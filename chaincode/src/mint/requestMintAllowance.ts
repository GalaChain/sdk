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
  AllowanceType,
  ChainObject,
  FulfillMintAllowanceDto,
  GrantAllowanceQuantity,
  MintRequestDto,
  TokenClass,
  TokenInstance,
  TokenInstanceQueryKey,
  TokenMintAllowanceRequest,
  UserAlias
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { ensureQuantityCanBeMinted } from "../allowances";
import { putMintAllowanceRequestsOnChain } from "../allowances/grantAllowance";
import { fetchKnownBurnCount } from "../burns/fetchBurns";
import { GalaChainContext } from "../types/GalaChainContext";
import { getObjectByKey } from "../utils";
import { fetchMintAllowanceSupply } from "./fetchMintAllowanceSupply";

export interface InternalGrantAllowanceData {
  tokenInstance: TokenInstanceQueryKey;
  allowanceType: AllowanceType;
  quantities: Array<GrantAllowanceQuantity>;
  uses: BigNumber;
  expires?: number;
}

export async function requestMintAllowance(
  ctx: GalaChainContext,
  dto: InternalGrantAllowanceData
): Promise<FulfillMintAllowanceDto> {
  if (dto.allowanceType !== AllowanceType.Mint) {
    throw new Error(
      `SubmitMintAllowanceRequest only supports AllowanceType.Mint transactions. Provided: ${dto.allowanceType}`
    );
  }

  if (new Set(dto.quantities.map((i) => i.user)).size !== dto.quantities.length) {
    const message =
      "dto.quantities must contain a unique set of users. Users cannot be duplicated in a single GrantAllowance call";
    throw new Error(message);
  }

  // todo: rework this with a correct dto that specs instance key insead of query key
  if (!dto.tokenInstance.isCompleteKey()) {
    throw new Error(`SubmitMintAllowanceRequest requires a complete token key.`);
  }

  const instanceKey = dto.tokenInstance.toCompleteKey();

  const tokenInstanceKeyString = TokenInstance.CreateCompositeKey(instanceKey);

  const callingUser: UserAlias = ctx.callingUser;

  const totalQuantity = dto.quantities.reduce((a, b) => a.plus(b.quantity), new BigNumber(0));

  // This will throw an error if it can't be found
  const keyList = TokenClass.buildClassKeyList(instanceKey);

  const compositeKey = ChainObject.getCompositeKeyFromParts(TokenClass.INDEX_KEY, keyList);

  const tokenClass: TokenClass = await getObjectByKey(ctx, TokenClass, compositeKey);

  // Only token authorities can grant mint allowances
  if (!tokenClass.authorities.includes(callingUser)) {
    throw new Error(
      `User ${callingUser} is not an authority on token ${tokenInstanceKeyString} and may not create minting allowances.\nToken Authorities: ${tokenClass.authorities.join(
        ","
      )}`
    );
  }

  if (tokenClass.isNonFungible && !instanceKey.instance.isEqualTo(0)) {
    throw new Error(`Mint Allowance attempted for NFT with non-zero instance id (${instanceKey.instance}).
                      NFT Mint Allowances require an instance property of 0.`);
  }

  const knownMintAllowanceSupply = await fetchMintAllowanceSupply(ctx, tokenClass);

  const knownBurnsCount = await fetchKnownBurnCount(ctx, tokenClass);

  // throws if quantity exceeds supply or capacity
  ensureQuantityCanBeMinted(tokenClass, totalQuantity, knownMintAllowanceSupply, knownBurnsCount);

  const { allowanceType, quantities, uses } = dto;
  const expires = dto.expires ?? 0;

  const success: TokenMintAllowanceRequest[] = await putMintAllowanceRequestsOnChain(
    ctx,
    { allowanceType, quantities, uses, expires },
    tokenClass,
    knownMintAllowanceSupply
  );

  const successfulRequests: MintRequestDto[] = success.map((elem) => {
    const trimmedMintRequest = new MintRequestDto();

    trimmedMintRequest.collection = elem.collection;
    trimmedMintRequest.category = elem.category;
    trimmedMintRequest.type = elem.type;
    trimmedMintRequest.additionalKey = elem.additionalKey;
    trimmedMintRequest.timeKey = elem.timeKey;
    trimmedMintRequest.totalKnownMintsCount = elem.totalKnownMintAllowancesCount;
    trimmedMintRequest.id = elem.id;
    trimmedMintRequest.owner = elem.grantedTo ?? undefined;

    return trimmedMintRequest;
  });

  const res = new FulfillMintAllowanceDto();
  res.requests = successfulRequests;

  return res;
}
