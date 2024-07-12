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
  AllowanceKey,
  AuthorizedOnBehalf,
  BatchMintTokenDto,
  FulfillMintDto,
  HighThroughputMintTokenDto,
  MintRequestDto,
  TokenClass,
  TokenClassKeyProperties,
  TokenMintRequest,
  TokenMintStatus,
  createValidDTO,
  createValidRangedChainObject
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types/GalaChainContext";
import { getObjectByKey, inverseEpoch, inverseTime, putRangedChainObject } from "../utils";
import { fetchMintSupply } from "./fetchMintSupply";
import { validateMintRequest } from "./validateMintRequest";

export async function requestMint(
  ctx: GalaChainContext,
  dto: HighThroughputMintTokenDto,
  authorizedOnBehalf: AuthorizedOnBehalf | undefined
): Promise<FulfillMintDto> {
  const mintRequest: TokenMintRequest = await submitMintRequest(ctx, dto, authorizedOnBehalf);

  // simplified object for data transfer over the wire
  const mintRequestDto = new MintRequestDto();
  mintRequestDto.collection = mintRequest.collection;
  mintRequestDto.category = mintRequest.category;
  mintRequestDto.type = mintRequest.type;
  mintRequestDto.additionalKey = mintRequest.additionalKey;
  mintRequestDto.timeKey = mintRequest.timeKey;
  mintRequestDto.totalKnownMintsCount = mintRequest.totalKnownMintsCount;
  mintRequestDto.owner = mintRequest.owner;
  mintRequestDto.id = mintRequest.requestId();
  mintRequestDto.allowanceKey = dto.allowanceKey;

  const resDto = new FulfillMintDto({ requests: [mintRequestDto] });

  return resDto;
}

export async function requestMintBatch(
  ctx: GalaChainContext,
  dto: BatchMintTokenDto,
  authorizedOnBehalf: AuthorizedOnBehalf | undefined
): Promise<FulfillMintDto> {
  const minted: Array<MintRequestDto> = [];
  const errors: Array<string> = [];

  // mints sequentially; fails all mints if at least one operation fails
  for (let i = 0; i < dto.mintDtos.length; i += 1) {
    const mintDto = dto.mintDtos[i];
    try {
      const mintRequest = await submitMintRequest(ctx, mintDto, authorizedOnBehalf);

      const mintRequestDto = plainToInstance(MintRequestDto, mintRequest);
      mintRequestDto.allowanceKey = mintDto.allowanceKey;

      minted.push(mintRequestDto);
    } catch (e) {
      errors.push(`index: ${i}, message: ${e.message ?? ""}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`No token was minted. Errors: ${errors.join("; ")}.`);
  } else {
    const resDto = await createValidDTO(FulfillMintDto, {
      requests: minted
    });

    return resDto;
  }
}

export async function submitMintRequest(
  ctx: GalaChainContext,
  dto: HighThroughputMintTokenDto,
  authorizedOnBehalf: AuthorizedOnBehalf | undefined
): Promise<TokenMintRequest> {
  if (!dto) throw new Error("dto undefined");
  const callingUser: string = ctx.callingUser;
  const owner = dto.owner ?? callingUser;
  const tokenClassKey = dto.tokenClass;
  const quantity = dto.quantity;
  const allowanceKey = dto.allowanceKey;

  const tokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, TokenClass.buildClassKeyList(tokenClassKey))
  );

  if (!tokenClass) throw new Error("missing tokenclass");

  await validateMintRequest(ctx, dto, tokenClass, authorizedOnBehalf).catch((e) => {
    throw new Error(`ValidateMintRequest failure: ${e.message}`);
  });

  const mintRequest: TokenMintRequest = await writeMintRequest(ctx, {
    tokenClassKey,
    callingUser,
    owner,
    quantity,
    allowanceKey
  });

  return mintRequest;
}

export interface WriteMintRequestParams {
  tokenClassKey: TokenClassKeyProperties;
  callingUser: string;
  owner: string;
  quantity: BigNumber;
  allowanceKey?: AllowanceKey | undefined;
  knownTotalSupply?: BigNumber | undefined;
}

export async function writeMintRequest(
  ctx: GalaChainContext,
  { tokenClassKey, callingUser, owner, quantity, allowanceKey, knownTotalSupply }: WriteMintRequestParams
): Promise<TokenMintRequest> {
  // for batch operations, support a way to pass in the knownTotalSupply to avoid repeated range queries
  // knownTotalSupply should never be exposed in a dto,
  // it should only ever be determined by application code logic.
  let totalKnownMintsCount: BigNumber;
  if (knownTotalSupply === undefined) {
    totalKnownMintsCount = await fetchMintSupply(ctx, tokenClassKey).catch((e) => {
      throw new Error(`fetchMintSupply failure: ${e.message}`);
    });
  } else {
    totalKnownMintsCount = knownTotalSupply;
  }

  const epochKey = inverseEpoch(ctx, 0);
  const timeKey = inverseTime(ctx, 0);

  const mintRequest = new TokenMintRequest();

  mintRequest.collection = tokenClassKey.collection;
  mintRequest.category = tokenClassKey.category;
  mintRequest.type = tokenClassKey.type;
  mintRequest.additionalKey = tokenClassKey.additionalKey;
  mintRequest.timeKey = timeKey;
  mintRequest.totalKnownMintsCount = totalKnownMintsCount;
  mintRequest.requestor = callingUser;
  mintRequest.owner = owner;
  mintRequest.created = ctx.txUnixTime;
  mintRequest.quantity = quantity;
  mintRequest.state = TokenMintStatus.Unknown;
  mintRequest.id = mintRequest.requestId();
  mintRequest.created = ctx.txUnixTime;
  mintRequest.epoch = epochKey;
  mintRequest.allowanceKey = allowanceKey;

  await putRangedChainObject(ctx, mintRequest).catch((e) => {
    throw new Error(`MintRequest putState failure: ${e.message}`);
  });

  return mintRequest;
}
