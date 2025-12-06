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
  FeeGateCodes,
  GalaChainResponse,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  PostMintLockConfiguration,
  TokenClass,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  TokenMintConfiguration,
  UserAlias,
  UserRef,
  createValidDTO
} from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { lockTokens } from "../locks";
import { resolveUserAlias } from "../services";
import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";
import { burnToMintProcessing } from "./extendedFeeGateProcessing";

export interface IMintPostProcessing {
  tokenClass: TokenClassKey;
  tokens: TokenInstanceKey[];
  owner: UserRef;
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

  const ownerAlias = await resolveUserAlias(ctx, owner);

  if (mintConfiguration.postMintBurn !== undefined) {
    await burnToMintProcessing(ctx, {
      ...data,
      owner: ownerAlias,
      burnConfiguration: mintConfiguration.postMintBurn
    });
  }

  if (mintConfiguration.postMintLock !== undefined) {
    await lockOnMintProcessing(ctx, {
      ...data,
      owner: ownerAlias,
      lockConfiguration: mintConfiguration.postMintLock
    });
  }
}

export interface ILockOnMintProcessing {
  tokenClass: TokenClassKey;
  tokens: TokenInstanceKey[];
  owner: UserAlias;
  quantity: BigNumber;
  lockConfiguration: PostMintLockConfiguration;
}

export async function lockOnMintProcessing(ctx: GalaChainContext, data: ILockOnMintProcessing) {
  const { tokenClass, tokens, owner, quantity, lockConfiguration } = data;
  const { collection, category, type, additionalKey } = tokenClass;

  const tokenClassEntry: TokenClass = await getObjectByKey(
    ctx,
    TokenClass,
    TokenClass.getCompositeKeyFromParts(TokenClass.INDEX_KEY, [collection, category, type, additionalKey])
  );

  const { lockName, lockAuthority, expirationModifier, lockPercentage } = lockConfiguration;

  const mintQuantityToLock = quantity
    .times(lockPercentage)
    .decimalPlaces(tokenClassEntry.decimals, BigNumber.ROUND_DOWN);

  const verifyAuthorizedOnBehalf = async (c: TokenClassKey) => undefined;

  // only support lock-on-mint postprocessing for fungibles, initially.
  // we would need to know a specific instance to lock for NFTs
  if (tokenClassEntry.isNonFungible) {
    ctx.logger.info(
      `lockOnMintProcessing called for NFT token(s) [${tokens.length}] ` +
        `minted for owner ${owner}. TokenMintConfiguration for TokenClass ` +
        `${[collection, category, type, additionalKey].join("|")} with ` +
        `postMintLock configuration defined, however ` +
        `lockOnMintProcessing does not yet support NFT post-mint locks.`
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

    await lockTokens(ctx, {
      tokenInstances: [{ tokenInstanceKey: token, quantity: mintQuantityToLock, owner: owner }],
      allowancesToUse: [],
      name: `${lockName}_${ctx.stub.getTxID()}`,
      lockAuthority: lockAuthority,
      expires: ctx.txUnixTime + expirationModifier,
      verifyAuthorizedOnBehalf
    });
  }
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

export async function mintTokenWithAllowanceExitGate(
  ctx: GalaChainContext,
  dto: MintTokenWithAllowanceDto,
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

export async function batchMintTokenExitGate(
  ctx: GalaChainContext,
  dto: BatchMintTokenDto,
  response: GalaChainResponse<TokenInstanceKey[]>
): Promise<void> {
  for (const mintDto of dto.mintDtos) {
    const { tokenClass, quantity } = mintDto;
    const owner = mintDto.owner ?? ctx.callingUser;
    // todo: batchMintToken currently returns a singular array of TokenInstanceKeys,
    // and they are not ordered in a way that corresponds to the incoming mintDto.
    // passing in the specific NFT instances minted per mintDto would require
    // re-mapping the minted instances in the response to the input mintDtos.
    // rework this if/when post mint processing of NFTs is added -
    // for now, just passing in an empty array as placeholder.
    const tokens: TokenInstanceKey[] = [];

    await mintPostProcessing(ctx, { tokenClass, owner, tokens, quantity });
  }
}
