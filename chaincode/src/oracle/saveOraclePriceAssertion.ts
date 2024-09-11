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
  OracleDefinition,
  OraclePriceAssertion,
  OraclePriceAssertionDto,
  TokenInstanceKey,
  UnauthorizedError 
} from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { ensureIsAuthorizedBy } from "../contracts";
import {
  getObjectByKey,
  putChainObject
} from "../utils";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

export interface ISaveOraclePriceAssertion {
  oracle: string;
  identity?: string | undefined;
  baseToken: TokenInstanceKey;
  quoteToken: TokenInstanceKey;
  exchangeRate: BigNumber;
  source?: string | undefined;
  sourceUrl?: string | undefined;
  timestamp: number;
}

export async function saveOraclePriceAssertion(ctx: GalaChainContext, dto: OraclePriceAssertionDto) {
  const oracleDefinition = await getObjectByKey(
    ctx,
    OracleDefinition,
    OracleDefinition.getCompositeKeyFromParts(OracleDefinition.INDEX_KEY, [dto.oracle])
  );

  const identity: string = dto.identity;

  if (!oracleDefinition.authorities.includes(identity)) {
    throw new UnauthorizedError(
      `Unauthorized user ${identity} attempted to assert ` + `price for oracle ${dto.oracle}`
    );
  }

  await ensureIsAuthorizedBy(ctx, dto, identity);

  const { oracle, baseToken, quoteToken, exchangeRate, source, sourceUrl, timestamp } = dto;
  const txid = ctx.stub.getTxID();
  const priceAssertion = plainToInstance(OraclePriceAssertion, {
    oracle,
    identity,
    txid,
    baseToken,
    quoteToken,
    exchangeRate,
    source,
    sourceUrl,
    timestamp
  });

  await priceAssertion.validateOrReject();

  await putChainObject(ctx, priceAssertion);

  return priceAssertion;
}
