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

/**
 * extendedFeeGateProcessing.ts
 *
 * Additional code that can be incorporated into either
 * entrance or exit fee gates.
 */
import {
  FeeAccelerationRateType,
  FeeCodeDefinition,
  FeeGateCodes,
  TokenClass,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  createValidDTO
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { burnTokens } from "../burns";
import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByPartialCompositeKey } from "../utils";
import { userExemptFromFees } from "./userExemptFromFees";

export interface IMintExtendedProcessing {
  tokenClass: TokenClassKey;
  tokens: TokenInstanceKey[];
  owner: string;
  quantity: BigNumber;
  feeCode?: FeeGateCodes | undefined;
}

/**
 * @description
 *
 * Supplemental or extended processing for a mint operation.
 * Burn some percentage of the mint quantity in conjunction
 * with the mint. Can be used as either
 * a pre-mint or a post-mint operation.
 *
 * @param ctx
 * @param data
 * @returns
 */
export async function mintProcessingBurn(ctx: GalaChainContext, data: IMintExtendedProcessing) {
  const { tokenClass, tokens, owner, quantity, feeCode } = data;
  const { collection, category, type, additionalKey } = tokenClass;

  if (feeCode === undefined) {
    return;
  }

  const exemption = await userExemptFromFees(ctx, { user: owner, feeCode: feeCode });

  if (exemption) {
    return;
  }

  const tokenClassEntry: TokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, [collection, category, type, additionalKey])
  );

  const feeCodeDefinitions: FeeCodeDefinition[] = await getObjectsByPartialCompositeKey(
    ctx,
    FeeCodeDefinition.INDEX_KEY,
    [feeCode],
    FeeCodeDefinition
  );

  const postMintBurnFeeDefinitions: FeeCodeDefinition[] = feeCodeDefinitions.filter((d) => {
    return d.feeAccelerationRateType === FeeAccelerationRateType.Custom;
  });

  const postMintBurnDefinition: FeeCodeDefinition | undefined = postMintBurnFeeDefinitions.pop();

  if (postMintBurnDefinition === undefined) {
    return;
  }

  const mintQuantityToBurn = quantity
    .times(postMintBurnDefinition.feeAccelerationRate)
    .integerValue(BigNumber.ROUND_DOWN);

  // Only support burn-on-mint postprocessing for fungibles, initially.
  // One could implement this for NFTs by slicing a trailing subset of the
  // array of TokenInstanceKeys equal in length to the percentage and
  // burning those individual instances,
  // if one were so inclined.
  if (tokenClassEntry.isNonFungible) {
    ctx.logger.info(
      `mintProcessingBurn called for NFT token with tokens array of length ${tokens.length}. ` +
        `feeCode ${feeCode} and TokenMintConfiguration for TokenClass ` +
        `${[collection, category, type, additionalKey].join("|")} defined, however ` +
        `mintProcessingBurn does not yet support NFT post-mint or pre-mint burns.`
    );

    return;
  } else {
    const instance = TokenInstance.FUNGIBLE_TOKEN_INSTANCE;

    const token: TokenInstanceKey = await createValidDTO(TokenInstanceKey, {
      collection,
      category,
      type,
      additionalKey,
      instance
    });

    await burnTokens(ctx, {
      owner,
      toBurn: [{ tokenInstanceKey: token, quantity: mintQuantityToBurn }],
      preValidated: true
    });
  }
}
