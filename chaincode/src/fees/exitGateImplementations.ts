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
  BatchMintTokenDto,
  ChainError,
  ErrorCode,
  FeeAccelerationRateType,
  FeeCodeDefinition,
  FeeGateCodes,
  FulfillMintDto,
  GalaChainResponse,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  TokenMintConfiguration
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { burnTokens } from "../burns";
import { GalaChainContext } from "../types";
import { getObjectByKey, getObjectsByPartialCompositeKey } from "../utils";
import { extractUniqueOwnersFromRequests } from "./feeGateImplementations";

export interface IMintPostProcessing {
  tokenClass: TokenClassKey;
  tokens: TokenInstanceKey[];
  owner: string;
  quantity: BigNumber;
  feeCode?: FeeGateCodes | undefined;
}

export async function mintPostProcessing(ctx: GalaChainContext, data: IMintPostProcessing) {
  const { tokenClass, tokens, owner, quantity, feeCode } = data;
  const { collection, category, type, additionalKey } = tokenClass;

  const mintConfiguration: TokenMintConfiguration | undefined = await getObjectByKey(
    ctx,
    TokenMintConfiguration,
    TokenMintConfiguration.getCompositeKeyFromParts(TokenMintConfiguration.INDEX_KEY, [
      collection,
      category,
      type,
      additionalKey
    ])
  ).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  if (!mintConfiguration) {
    return;
  }

  if (mintConfiguration.postMintBurn) {
    await mintPostProcessingBurn(ctx, data);
  }
}

export async function mintPostProcessingBurn(ctx: GalaChainContext, data: IMintPostProcessing) {
  const { tokenClass, tokens, owner, quantity, feeCode } = data;
  const { collection, category, type, additionalKey } = tokenClass;

  if (feeCode === undefined) {
    return;
  }

  const tokenClassEntry: TokenClass | undefined = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, [collection, category, type, additionalKey])
  ).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  // only support burn-on-mint postprocessing for fungibles, initially.
  // One could implement this for NFTs by slicing a trailing subset of the
  // array of TokenInstanceKeys equal in length to the percentage and
  // burning those individual instances,
  // if one were so inclined.
  if (tokenClassEntry === undefined || tokenClassEntry?.isNonFungible || tokens.length !== 1) {
    ctx.logger.info(
      `mintPostProcessingBurn called for NFT token. feeCode ${feeCode} and ` +
        `TokenMintConfiguration for TokenClass ` +
        `${[collection, category, type, additionalKey].join("|")} defined, howerver ` +
        `mintPostProcessingBurn does not yet support NFT post-mint burns.`
    );

    return;
  }

  const token: TokenInstanceKey = tokens[0];

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

  await burnTokens(ctx, {
    owner,
    toBurn: [{ tokenInstanceKey: token, quantity: mintQuantityToBurn }],
    preValidated: true
  });
}

export async function mintTokenExitGate(
  ctx: GalaChainContext,
  dto: MintTokenDto,
  response: GalaChainResponse<TokenInstanceKey[]>
): Promise<void> {
  const { tokenClass, quantity } = dto;
  const owner = dto.owner ?? ctx.callingUser;
  const tokens: TokenInstanceKey[] | undefined = response.Data;

  if (tokens === undefined || tokens.length < 1) {
    return;
  }

  await mintPostProcessing(ctx, { tokenClass, owner, tokens, quantity });
}
