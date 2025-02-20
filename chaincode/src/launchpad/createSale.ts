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

  CreateSaleResponse,
  CreateTokenSaleDTO,
  DefaultError,
  LaunchPadSale,
  NativeTokenAmountDto,
  TokenInstanceKey,
} from "@gala-chain/api";
import {
  GalaChainContext,
  getObjectByKey,
  mintTokenWithAllowance,
  putChainObject
} from "@gala-chain/chaincode";
import { createTokenClass } from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";

import { buyWithNative } from "./buyWithNative";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Creates a new token sale (LaunchPad) in the GalaChain environment.
 *
 * This function validates input parameters, creates a token class, mints an initial supply
 * of tokens, and initializes the LaunchPad sale object. If a pre-buy amount is specified,
 * it simulates a token purchase using native tokens.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param launchPadDetails - An object containing details for the token sale, including:
 *   - `tokenName`: The name of the token being created.
 *   - `tokenSymbol`: The symbol for the token.
 *   - `tokenDescription`: A description of the token.
 *   - `tokenImage`: An optional image URL for the token.
 *   - `preBuyAmount`: The amount of native tokens to use for a pre-buy (optional).
 *
 * @returns A promise that resolves to a `CreateSaleResponse` object containing details about
 *          the created sale, including the vault address and token collection name.
 *
 * @throws DefaultError if:
 *   - Required fields (`tokenName`, `tokenSymbol`, `tokenDescription`) are missing or empty.
 *   - The token class creation fails (no response key returned).
 */
export async function createSale(
  ctx: GalaChainContext,
  launchPadDetails: CreateTokenSaleDTO
): Promise<CreateSaleResponse> {
  // Validate input parameters
  if (!launchPadDetails.websiteUrl && !launchPadDetails.telegramUrl && !launchPadDetails.twitterUrl) {
    throw new DefaultError("Token sale creation requires atleast one social link.");
  }

  launchPadDetails.tokenSymbol = launchPadDetails.tokenSymbol.toUpperCase();

  // Define the token class key
  const tokenInstanceKey = new TokenInstanceKey();
  tokenInstanceKey.collection = "Token";
  tokenInstanceKey.category = "Unit";
  tokenInstanceKey.type = `${launchPadDetails.tokenSymbol}`;
  tokenInstanceKey.additionalKey = `${ctx.callingUser.replace(/\|/, ":")}`;
  tokenInstanceKey.instance = new BigNumber(0);

  // Validate uniqueness of sale and token
  const vaultAddress = `service|${tokenInstanceKey.getTokenClassKey().toStringKey()}$launchpad`;
  const key = ctx.stub.createCompositeKey(LaunchPadSale.INDEX_KEY, [vaultAddress]);
  const sale = await getObjectByKey(ctx, LaunchPadSale, key).catch(() => undefined);
  if (sale) {
    throw new DefaultError("This token and a sale associtated with it already exists");
  }

  // Call createTokenClass
  const responseKey = await createTokenClass(ctx, {
    network: "GC",
    tokenClass: tokenInstanceKey.getTokenClassKey(),
    isNonFungible: false,
    decimals: 18,
    name: launchPadDetails.tokenName,
    symbol: launchPadDetails.tokenSymbol,
    description: launchPadDetails.tokenDescription,
    rarity: "abc",
    image: launchPadDetails.tokenImage,
    metadataAddress: "",
    contractAddress: "",
    maxSupply: new BigNumber("2e+7"),
    maxCapacity: new BigNumber("2e+7"),
    totalMintAllowance: new BigNumber(0),
    totalSupply: new BigNumber(0),
    totalBurned: new BigNumber(0),
    authorities: [vaultAddress, ctx.callingUser]
  });

  if (!responseKey) {
    throw new DefaultError("Token class creation failed. No response key returned.");
  }

  await mintTokenWithAllowance(ctx, {
    tokenClassKey: tokenInstanceKey.getTokenClassKey(),
    tokenInstance: new BigNumber(0),
    owner: vaultAddress,
    quantity: new BigNumber("2e+7")
  });

  // Create the LaunchPadSale object
  const launchPad = new LaunchPadSale(vaultAddress, tokenInstanceKey, ctx.callingUser);

  await putChainObject(ctx, launchPad);

  if (launchPadDetails.preBuyAmount.comparedTo(0)) {
    const nativeTokenDto = new NativeTokenAmountDto();
    nativeTokenDto.nativeTokenAmount = launchPadDetails.preBuyAmount;
    nativeTokenDto.vaultAddress = launchPad.vaultAddress;
    await buyWithNative(ctx, nativeTokenDto);
  }

  // Return the response object
  return {
    image: launchPadDetails.tokenImage,
    tokenName: launchPadDetails.tokenName,
    symbol: launchPadDetails.tokenSymbol,
    description: launchPadDetails.tokenDescription,
    websiteUrl: launchPadDetails.websiteUrl ? launchPadDetails.websiteUrl : "",
    telegramUrl: launchPadDetails.telegramUrl ? launchPadDetails.telegramUrl : "",
    twitterUrl: launchPadDetails.twitterUrl ? launchPadDetails.twitterUrl : "",
    initialBuyAmount: launchPadDetails.preBuyAmount.toString(),
    vaultAddress: vaultAddress,
    creatorAddress: ctx.callingUser
  };
}
