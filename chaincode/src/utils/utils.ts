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
import { ValidationFailedError } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";

// Block timeout can change on peers, using it makes this brittle. However,
// getting epoch or block number via fabric-ledger, system chaincode call,
// and epoch from proposal header all fail to work as of 2022-12-08.

let blockTimeoutConfig: number | undefined;

if (process.env.HLF_BLOCK_TIMEOUT) {
  const envTimeout = parseInt(process.env.HLF_BLOCK_TIMEOUT);

  if (isFinite(envTimeout)) {
    blockTimeoutConfig = envTimeout;
  }
}

export const blockTimeout = blockTimeoutConfig ?? 2000;
// roughly 4.5 billion ms into the future from the unix epoch
// 1000ms * 60s * 60m * 24h * 365d * 45000000000y
// "0141912000000000000000"
export const inversionHeight = 1.41912e20;
export const inverseKeyLength = 22;
export const lookbackTxCount = 200;

export function inverseEpoch(ctx: GalaChainContext, offset?: number): string {
  // assuming epoch is a growing integer tied to block height
  // create an inverse that can be used to create a lexigraphic key or
  // create an offset key for GetStateByRange exclusive of current height
  const decodedSP = ctx.stub.getSignedProposal();

  const epoch = decodedSP.proposal.header.channelHeader.epoch;

  offset = offset ? offset : 0;

  const height = new BigNumber(epoch).minus(new BigNumber(offset));

  const heightMax = inversionHeight;
  const len = inverseKeyLength;
  const inverse = new BigNumber(heightMax).minus(height).toString().padStart(len, "0");

  return inverse;
}

export function inverseTime(ctx: GalaChainContext, offset?: number): string {
  // create an inverse that can be used to create a lexigraphic key or
  // create an offset key for GetStateByRange exclusive of current height
  const txtime = ctx.txUnixTime;

  offset = offset ? offset : 0;

  const height = new BigNumber(txtime).minus(new BigNumber(offset)).toNumber();

  return generateInverseTimeKey(height);
}

export function generateInverseTimeKey(height: number): string {
  const heightMax = inversionHeight;
  const len = inverseKeyLength;
  const inverse = new BigNumber(heightMax).minus(height).toString().padStart(len, "0");

  return inverse;
}

function takeUntilUndefinedRecursive(
  args: (string | undefined)[],
  originalArray: (string | undefined)[]
): string[] {
  if (args.length === 0) {
    return [];
  } else if (args[0] === undefined) {
    // expect all remaining fields to be undefined
    const definedField = args.find((a) => a !== undefined);

    if (!definedField) {
      return [];
    } else {
      const arrStr = `[${originalArray.join(",")}]`;
      const message = `Expected all remaining fields to be undefined, but found: ${definedField} in [${arrStr}]`;
      throw new ValidationFailedError(message);
    }
  } else {
    return [args[0], ...takeUntilUndefinedRecursive(args.slice(1), originalArray)];
  }
}

export function takeUntilUndefined(...args: (string | undefined)[]): string[] {
  return takeUntilUndefinedRecursive(args, args);
}

export interface dateIndexKeys {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
  milliseconds: string;
}

export function txUnixTimeToDateIndexKeys(txUnixTime: number) {
  const txDate = new Date(txUnixTime);

  const year = `${txDate.getUTCFullYear()}`;
  // JavaScript's Date.getUTCMonth returns the month as a Zero-indexed value;
  // so we add one below to get a human-readable month number.
  const month = `${txDate.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${txDate.getUTCDate()}`.padStart(2, "0");
  const hours = `${txDate.getUTCHours()}`.padStart(2, "0");
  const minutes = `${txDate.getUTCMinutes()}`.padStart(2, "0");
  const seconds = `${txDate.getUTCSeconds()}`.padStart(2, "0");
  const milliseconds = `${txDate.getUTCMilliseconds()}`.padStart(4, "0");

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    milliseconds
  };
}
