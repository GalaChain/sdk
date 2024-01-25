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
  AuthorizedOnBehalf,
  ChainCallDTO,
  ChainObject,
  HighThroughputMintTokenDto,
  TokenAllowance,
  TokenClass,
  TokenInstance,
  TokenInstanceKey
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { checkAllowances } from "../allowances";
import { GalaChainContext } from "../types/GalaChainContext";
import { getObjectByKey, getObjectsByPartialCompositeKey } from "../utils";

export async function validateMintRequest(
  ctx: GalaChainContext,
  dto: HighThroughputMintTokenDto,
  tokenClass: TokenClass,
  authorizedOnBehalf: AuthorizedOnBehalf | undefined
): Promise<TokenAllowance[]> {
  const callingUser: string = ctx.callingUser;
  const owner = dto.owner ?? callingUser;
  const tokenClassKey = dto.tokenClass;
  const quantity = dto.quantity;

  const callingOnBehalf: string = authorizedOnBehalf?.callingOnBehalf ?? callingUser;

  const decimalPlaces = quantity.decimalPlaces() ?? 0;
  if (decimalPlaces > tokenClass.decimals) {
    throw new Error(`Quantity: ${quantity} has more than ${tokenClass.decimals} decimal places.`);
  }

  // dto is valid, do chain code specific validation
  let results: TokenAllowance[] = [];

  if (dto.allowanceKey) {
    const applicableAllowanceKey = dto.allowanceKey;
    const allowance: TokenAllowance = await getObjectByKey(
      ctx,
      TokenAllowance,
      ChainObject.getCompositeKeyFromParts(TokenAllowance.INDEX_KEY, [
        applicableAllowanceKey.grantedTo,
        applicableAllowanceKey.collection,
        applicableAllowanceKey.category,
        applicableAllowanceKey.type,
        applicableAllowanceKey.additionalKey,
        applicableAllowanceKey.instance.toString(),
        applicableAllowanceKey.allowanceType.toString(),
        applicableAllowanceKey.grantedBy,
        applicableAllowanceKey.created.toString()
      ])
    );

    results = [allowance];
  } else {
    const queryParams = [
      callingOnBehalf, // grantedTo
      tokenClassKey.collection,
      tokenClassKey.category,
      tokenClassKey.type,
      tokenClassKey.additionalKey,
      TokenInstance.FUNGIBLE_TOKEN_INSTANCE.toString(),
      AllowanceType.Mint.toString()
    ];

    results = await getObjectsByPartialCompositeKey(
      ctx,
      TokenAllowance.INDEX_KEY,
      queryParams,
      TokenAllowance,
      true // TODO may lead to incomplete results!
    );

    results.sort((a: TokenAllowance, b: TokenAllowance): number => (a.created < b.created ? -1 : 1));
  }

  const applicableAllowances: TokenAllowance[] = results;

  const dtoInstanceKey = ChainCallDTO.deserialize<TokenInstanceKey>(TokenInstanceKey, {
    ...tokenClassKey,
    instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
  });

  // Check allowances
  const allowanceType = AllowanceType.Mint;

  const totalAllowance: BigNumber = await checkAllowances(
    ctx,
    applicableAllowances,
    dtoInstanceKey,
    allowanceType,
    callingOnBehalf
  );

  const actionDescription =
    `${AllowanceType[allowanceType]} ${quantity.toString()} ` +
    `token ${dtoInstanceKey.toStringKey()} to ${owner}`;

  if (totalAllowance.isLessThan(quantity)) {
    throw new Error(
      `${callingUser} does not have sufficient allowances ${totalAllowance.toString()} to ${actionDescription}`
    );
  }

  return applicableAllowances;
}
