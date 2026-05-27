/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  ApplyRequestsDto,
  GalaChainResponse,
  HasPendingApplyRequestsDto,
  NotImplementedError,
  RangedChainObject,
  UserAlias,
  UserRole,
  serialize
} from "@gala-chain/api";
import { instanceToPlain } from "class-transformer";

import { GalaChainContext } from "../types";

export const REQUEST_QUEUE_INDEX_KEY = "GCRQ";

/** Default minimum age (ms) before a queued request may be applied. */
export const MIN_DELAY_MS = 2000;

const REQUEST_TIME_KEY_LENGTH = 16;

function getRequestTimeKeyPart(unixTime: number): string {
  return `${unixTime}`.padStart(REQUEST_TIME_KEY_LENGTH, "0");
}

function getApplyRequestsKeyRange(
  contractName: string,
  cutoffTime: number
): { startKey: string; stopKey: string } {
  const startKey = RangedChainObject.getRangedKeyFromParts(REQUEST_QUEUE_INDEX_KEY, [contractName]);
  const stopKey = RangedChainObject.getRangedKeyFromParts(REQUEST_QUEUE_INDEX_KEY, [
    contractName,
    getRequestTimeKeyPart(cutoffTime + 1)
  ]);
  return { startKey, stopKey };
}

export type RequestMethodHandler = (
  ctx: GalaChainContext,
  params: Record<string, unknown>
) => Promise<unknown>;

export interface SavedRequest {
  requestMethodKey: string;
  callingUser: UserAlias;
  txUnixTime: number;
  params: Record<string, unknown>;
}

export async function saveRequest(
  ctx: GalaChainContext,
  contractName: string,
  requestMethodKey: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const txTimeKey = getRequestTimeKeyPart(ctx.txUnixTime);

  const rangedKey = RangedChainObject.getRangedKeyFromParts(REQUEST_QUEUE_INDEX_KEY, [
    contractName,
    txTimeKey,
    requestMethodKey,
    ctx.stub.getTxID()
  ]);

  const requestData: SavedRequest = {
    requestMethodKey,
    callingUser: ctx.callingUser,
    txUnixTime: ctx.txUnixTime,
    params: instanceToPlain(params)
  };

  await ctx.stub.putState(rangedKey, Buffer.from(serialize(requestData)));
  return { scheduled: true };
}

async function applySavedRequest(
  ctx: GalaChainContext,
  request: SavedRequest,
  requestMethodHandlers: Record<string, RequestMethodHandler>
): Promise<GalaChainResponse<unknown>> {
  const handler = requestMethodHandlers[request.requestMethodKey];

  if (!handler) {
    throw new NotImplementedError(`No request handler for request method key '${request.requestMethodKey}'`);
  }

  ctx.resetCallingUser();
  ctx.callingUserData = {
    alias: request.callingUser,
    roles: [UserRole.SUBMIT],
    signedBy: [request.callingUser],
    signatureQuorum: 1,
    allowedSigners: [request.callingUser],
    isMultisig: false
  };

  return GalaChainResponse.Wrap(handler(ctx, request.params));
}

export async function hasPendingApplyRequests(
  ctx: GalaChainContext,
  contractName: string,
  dto: HasPendingApplyRequestsDto
): Promise<boolean> {
  const minDelayMs = dto.minDelayMs ?? MIN_DELAY_MS;
  const cutoffTime = Math.max(0, ctx.txUnixTime - minDelayMs);
  const { startKey, stopKey } = getApplyRequestsKeyRange(contractName, cutoffTime);
  for await (const kv of ctx.stub.getStateByRange(startKey, stopKey)) {
    if (kv.value) {
      return true;
    }
  }
  return false;
}

export async function applySavedRequests(
  ctx: GalaChainContext,
  contractName: string,
  dto: ApplyRequestsDto,
  requestMethodHandlers: Record<string, RequestMethodHandler>
): Promise<GalaChainResponse<unknown>[]> {
  const maxRequests = dto.maxRequests ?? 500;
  const minDelayMs = dto.minDelayMs ?? MIN_DELAY_MS;
  const cutoffTime = Math.max(0, ctx.txUnixTime - minDelayMs);

  const { startKey, stopKey } = getApplyRequestsKeyRange(contractName, cutoffTime);
  const iterator = ctx.stub.getStateByRange(startKey, stopKey);

  const responses: GalaChainResponse<unknown>[] = [];

  for await (const kv of iterator) {
    if (responses.length >= maxRequests) {
      break;
    }

    const requestKey = kv.key;
    const request = JSON.parse(Buffer.from(kv.value).toString("utf8")) as SavedRequest;
    const sandboxCtx = ctx.createReadOnlyContext(responses.length);
    sandboxCtx.stub.setWrites(ctx.stub.getWrites());
    sandboxCtx.stub.setDeletes(ctx.stub.getDeletes());

    let response: GalaChainResponse<unknown>;
    try {
      response = await applySavedRequest(sandboxCtx, request, requestMethodHandlers);
    } catch (error) {
      response = GalaChainResponse.Error(error);
      ctx.logger.warn(`Failed to apply request ${requestKey}: ${(error as Error).message}`);
    }

    if (GalaChainResponse.isSuccess(response)) {
      ctx.stub.setWrites(sandboxCtx.stub.getWrites());
      ctx.stub.setDeletes(sandboxCtx.stub.getDeletes());
    }

    await ctx.stub.deleteState(requestKey);
    responses.push(response);
  }

  return responses;
}
