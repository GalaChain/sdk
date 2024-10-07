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
import { AuthorizedOnBehalf, TokenAllowance, TokenClassKey, TokenInstanceKey } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { fetchAllowances } from "../allowances";
import { GalaChainContext } from "../types";
import { BatchMintError } from "./MintError";
import { fetchMintSupply } from "./fetchMintSupply";
import { mintToken } from "./mintToken";

export interface MintOperationParams {
  tokenClassKey: TokenClassKey;
  owner: string;
  quantity: BigNumber;
  authorizedOnBehalf: AuthorizedOnBehalf | undefined;
  applicableAllowances?: TokenAllowance[] | undefined;
  knownTotalSupply?: BigNumber | undefined;
}

export async function batchMintToken(
  ctx: GalaChainContext,
  ops: MintOperationParams[]
): Promise<TokenInstanceKey[]> {
  const minted: Array<TokenInstanceKey> = [];
  const errors: Array<string> = [];

  const opsByTokenClass: Record<string, indexedMintOperationsByTokenClass> = indexMintOperations(ctx, ops);

  for (const indexKey in opsByTokenClass) {
    const opsByToken = opsByTokenClass[indexKey];
    const tokenClassKey = opsByToken.tokenClassKey;

    let knownTotalSupply = await fetchMintSupply(ctx, tokenClassKey);

    for (const indexKeyByCaller in opsByToken.mintOperationsIndex) {
      const tokenOpsByCaller = opsByToken.mintOperationsIndex[indexKeyByCaller];
      const callingOnBehalf = tokenOpsByCaller.callingOnBehalf;

      // Get allowances
      const fetchAllowancesData = {
        grantedTo: `${callingOnBehalf}`,
        collection: tokenClassKey.collection,
        category: tokenClassKey.category,
        type: tokenClassKey.type,
        additionalKey: tokenClassKey.additionalKey
      };

      const applicableAllowances = await fetchAllowances(ctx, fetchAllowancesData);

      const mintOpsBatch = tokenOpsByCaller.mintOperations;

      // mints sequentially; fails all mints if at least one operation fails
      for (let i = 0; i < mintOpsBatch.length; i += 1) {
        const mintOp = mintOpsBatch[i];

        mintOp.knownTotalSupply = new BigNumber(knownTotalSupply);
        mintOp.applicableAllowances = applicableAllowances;

        try {
          const mintResponse = await mintToken(ctx, mintOp);
          minted.push(...mintResponse);
        } catch (e) {
          errors.push(`index: ${i}, message: ${e.message ?? ""}`);
        }

        // ensure we're incrementing known supply as we go
        knownTotalSupply = knownTotalSupply.plus(mintOp.quantity);
      }
    }
  }

  if (errors.length > 0) {
    throw new BatchMintError(errors);
  } else {
    return minted;
  }
}

export interface indexedMintOperations {
  callingOnBehalf: AuthorizedOnBehalf | string;
  mintOperations: MintOperationParams[];
}

export interface indexedMintOperationsByTokenClass {
  tokenClassKey: TokenClassKey;
  mintOperationsIndex: Record<string, indexedMintOperations>;
}

export function indexMintOperations(
  ctx: GalaChainContext,
  ops: MintOperationParams[]
): Record<string, indexedMintOperationsByTokenClass> {
  const mintIndex: Record<string, indexedMintOperationsByTokenClass> = {};

  for (let i = 0; i < ops.length; i++) {
    const callingOnBehalf = ops[i].authorizedOnBehalf ?? ctx.callingUser;
    const { collection, category, type, additionalKey } = ops[i].tokenClassKey;

    const tokenKey = `${collection}_${category}_${type}_${additionalKey}`;

    if (mintIndex[tokenKey] === undefined) {
      const emptyIndexedTokenClass: indexedMintOperationsByTokenClass = {
        tokenClassKey: ops[i].tokenClassKey,
        mintOperationsIndex: {}
      };

      mintIndex[tokenKey] = emptyIndexedTokenClass;
    }

    const key = `${callingOnBehalf}_${collection}_${category}_${type}_${additionalKey}`;

    if (mintIndex[tokenKey].mintOperationsIndex[key] === undefined) {
      const emptyIndexedMintOp: indexedMintOperations = {
        callingOnBehalf: ops[i].authorizedOnBehalf ?? ctx.callingUser,
        mintOperations: []
      };

      mintIndex[tokenKey].mintOperationsIndex[key] = emptyIndexedMintOp;
    }

    mintIndex[tokenKey].mintOperationsIndex[key].mintOperations.push(ops[i]);
  }

  return mintIndex;
}
