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
  ConflictError,
  CreateSaleResDto,
  CreateTokenSaleDTO,
  LaunchpadSale,
  NativeTokenQuantityDto,
  PreConditionFailedError,
  TokenInstanceKey
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { mintTokenWithAllowance } from "../mint/index";
import { createTokenClass, updateTokenClass } from "../token/index";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { buyWithNative } from "./buyWithNative";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Creates a new token sale (Launchpad) in the GalaChain environment.
 *
 * This function validates input parameters, creates a token class, mints an initial supply
 * of tokens, and initializes the Launchpad sale object. If a pre-buy amount is specified,
 * it simulates a token purchase using native tokens.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param launchpadDetails - An object containing details for the token sale, including:
 *   - `tokenName`: The name of the token being created.
 *   - `tokenSymbol`: The symbol for the token.
 *   - `tokenDescription`: A description of the token.
 *   - `tokenImage`: An optional image URL for the token.
 *   - `preBuyAmount`: The amount of native tokens to use for a pre-buy (optional).
 *
 * @returns A promise that resolves to a `CreateSaleResDto` object containing details about
 *          the created sale, including the vault address and token collection name.
 *
 * @throws DefaultError if:
 *   - Required fields (`tokenName`, `tokenSymbol`, `tokenDescription`) are missing or empty.
 *   - The token class creation fails (no response key returned).
 */
export async function createSale(
  ctx: GalaChainContext,
  launchpadDetails: CreateTokenSaleDTO
): Promise<CreateSaleResDto> {
  let isSaleFinalised = false;
  // Validate input parameters

  if (!launchpadDetails.websiteUrl && !launchpadDetails.telegramUrl && !launchpadDetails.twitterUrl) {
    throw new PreConditionFailedError("Token sale creation requires atleast one social link.");
  }

  launchpadDetails.tokenSymbol = launchpadDetails.tokenSymbol.toUpperCase();

  // Define the token class key
  const tokenInstanceKey = new TokenInstanceKey();
  tokenInstanceKey.collection = `${launchpadDetails.tokenCollection}`;
  tokenInstanceKey.category = `${launchpadDetails.tokenCategory}`;
  tokenInstanceKey.type = `${launchpadDetails.tokenSymbol}`;
  tokenInstanceKey.additionalKey = `${ctx.callingUser.replace(/\|/, ":")}`;
  tokenInstanceKey.instance = new BigNumber(0);

  // Validate uniqueness of sale and token
  const vaultAddress = `service|${tokenInstanceKey.getTokenClassKey().toStringKey()}$launchpad`;
  const key = ctx.stub.createCompositeKey(LaunchpadSale.INDEX_KEY, [vaultAddress]);
  const sale = await getObjectByKey(ctx, LaunchpadSale, key).catch(() => undefined);
  if (sale) {
    throw new ConflictError("This token and a sale associated with it already exists");
  }

  // Call createTokenClass
  await createTokenClass(ctx, {
    network: "GC",
    tokenClass: tokenInstanceKey.getTokenClassKey(),
    isNonFungible: false,
    decimals: 18,
    name: launchpadDetails.tokenName,
    symbol: launchpadDetails.tokenSymbol,
    description: launchpadDetails.tokenDescription,
    image: launchpadDetails.tokenImage,
    maxSupply: new BigNumber("2e+7"),
    maxCapacity: new BigNumber("2e+7"),
    totalMintAllowance: new BigNumber(0),
    totalSupply: new BigNumber(0),
    totalBurned: new BigNumber(0),
    authorities: [vaultAddress, ctx.callingUser]
  });

  // Mint tokens using the calling user's allowance
  await mintTokenWithAllowance(ctx, {
    tokenClassKey: tokenInstanceKey.getTokenClassKey(),
    tokenInstance: new BigNumber(0),
    owner: vaultAddress,
    quantity: new BigNumber("2e+7")
  });

  //Update token class to remove the calling user as an authority in the token class
  await updateTokenClass(ctx, {
    tokenClass: tokenInstanceKey.getTokenClassKey(),
    authorities: [vaultAddress]
  });

  // Create the LaunchpadSale object
  const launchpad = new LaunchpadSale(
    vaultAddress,
    tokenInstanceKey,
    launchpadDetails.reverseBondingCurveConfiguration?.toChainObject(),
    ctx.callingUser
  );

  await putChainObject(ctx, launchpad);

  if (launchpadDetails.preBuyQuantity.isGreaterThan(0)) {
    const nativeTokenDto = new NativeTokenQuantityDto();
    nativeTokenDto.nativeTokenQuantity = launchpadDetails.preBuyQuantity;
    nativeTokenDto.vaultAddress = launchpad.vaultAddress;
    const tradeStatus = await buyWithNative(ctx, nativeTokenDto);
    isSaleFinalised = tradeStatus.isFinalized;
  }

  // Return the response object
  return {
    image: launchpadDetails.tokenImage,
    tokenName: launchpadDetails.tokenName,
    symbol: launchpadDetails.tokenSymbol,
    description: launchpadDetails.tokenDescription,
    websiteUrl: launchpadDetails.websiteUrl ? launchpadDetails.websiteUrl : "",
    telegramUrl: launchpadDetails.telegramUrl ? launchpadDetails.telegramUrl : "",
    twitterUrl: launchpadDetails.twitterUrl ? launchpadDetails.twitterUrl : "",
    initialBuyQuantity: launchpadDetails.preBuyQuantity.toFixed(),
    vaultAddress: vaultAddress,
    creatorAddress: ctx.callingUser,
    collection: launchpadDetails.tokenCollection,
    category: launchpadDetails.tokenCategory,
    functionName: "CreateSale",
    isFinalized: isSaleFinalised,
    tokenStringKey: tokenInstanceKey.getTokenClassKey().toStringKey(),
    reverseBondingCurveConfiguration: launchpadDetails.reverseBondingCurveConfiguration
  } satisfies CreateSaleResDto;
}
