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
  AllowanceType,
  TokenClassKey,
  TokenInstanceKey,
  TokenInstanceQueryKey,
  createValidDTO
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { grantAllowance } from "../allowances";
import { GalaChainContext } from "../types/GalaChainContext";
import { mintToken } from "./mintToken";

export interface MintTokenWithAllowanceParams {
  tokenClassKey: TokenClassKey;
  tokenInstance: BigNumber;
  owner: string;
  quantity: BigNumber;
}

export async function mintTokenWithAllowance(
  ctx: GalaChainContext,
  dto: MintTokenWithAllowanceParams
): Promise<Array<TokenInstanceKey>> {
  const { tokenClassKey, tokenInstance, quantity, owner } = dto;

  const response = await grantAllowance(ctx, {
    tokenInstance: await createValidDTO(TokenInstanceQueryKey, { ...tokenClassKey, instance: tokenInstance }),
    allowanceType: AllowanceType.Mint,
    quantities: [{ user: ctx.callingUser, quantity }],
    uses: new BigNumber("1"),
    expires: 0
  });

  const tokenInstanceArray = await mintToken(ctx, {
    tokenClassKey: tokenClassKey,
    owner: owner,
    applicableAllowanceKey: await createValidDTO(AllowanceKey, response[0]),
    quantity,
    authorizedOnBehalf: undefined
  });

  return tokenInstanceArray;
}
