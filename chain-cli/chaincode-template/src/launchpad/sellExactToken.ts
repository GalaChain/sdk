import { DefaultError } from "@gala-chain/api";
import { GalaChainContext, fetchOrCreateBalance, fetchTokenClass, putChainObject, transferToken } from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";

import { callMemeTokenIn } from "./callMemeTokenIn";
import { callNativeTokenOut } from "./callNativeTokenOut";
import { tradeResponse, exactTokenAmountDto, nativeTokenAmountDto } from "./dtos";
import { fetchAndValidateSale } from "./helper/launchpadHelperFunctions";

BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Executes the sale of an exact amount of tokens for native tokens (e.g., GALA).
 *
 * This function facilitates selling a specific token amount by transferring the tokens to
 * the sale vault and providing the calculated native tokens in return. It ensures validation
 * of the sale, handles insufficient vault balances, and checks expected vs. actual native tokens.
 *
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param sellTokenDTO - An object containing the sale details:
 *   - `vaultAddress`: The address of the sale.
 *   - `tokenAmount`: The exact amount of tokens to sell.
 *   - `expectedNativeToken` (optional): The expected amount of native tokens in return.
 *
 * @returns A promise that resolves to a `tradeResponse` object containing the updated
 *          balances of the seller's tokens and native tokens.
 *
 * @throws DefaultError if the expected native tokens exceed the actual amount to be provided.
 */
export async function sellExactToken(
  ctx: GalaChainContext,
  sellTokenDTO: exactTokenAmountDto
): Promise<tradeResponse> {
  const sale = await fetchAndValidateSale(ctx, sellTokenDTO.vaultAddress);

  let nativeTokensToProvide = new BigNumber(await callNativeTokenOut(ctx, sellTokenDTO));
  const nativeTokensLeftInVault = new BigNumber(sale.nativeTokenQuantity);
  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();

  if (nativeTokensLeftInVault.comparedTo(nativeTokensToProvide) < 0) {
    nativeTokensToProvide = nativeTokensLeftInVault;
    const nativeTokensBeingSoldDto = new nativeTokenAmountDto();
    nativeTokensBeingSoldDto.vaultAddress = sellTokenDTO.vaultAddress;
    nativeTokensBeingSoldDto.nativeTokenAmount = nativeTokensToProvide;
    sellTokenDTO.tokenAmount = new BigNumber(await callMemeTokenIn(ctx, nativeTokensBeingSoldDto));
  }

  if (
    sellTokenDTO.expectedNativeToken &&
    sellTokenDTO.expectedNativeToken.comparedTo(nativeTokensToProvide) > 0
  ) {
    throw new DefaultError(
      "Expected Gala tokens from this operation exceeds the actual amount that will be provided."
    );
  }

  await transferToken(ctx, {
    from: ctx.callingUser,
    to: sellTokenDTO.vaultAddress,
    tokenInstanceKey: memeToken,
    quantity: sellTokenDTO.tokenAmount,
    allowancesToUse: [],
    authorizedOnBehalf: undefined
  });

  await transferToken(ctx, {
    from: sellTokenDTO.vaultAddress,
    to: ctx.callingUser,
    tokenInstanceKey: nativeToken,
    quantity: nativeTokensToProvide,
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: sellTokenDTO.vaultAddress,
      callingUser: sellTokenDTO.vaultAddress
    }
  });

  sale.sellToken(sellTokenDTO.tokenAmount, nativeTokensToProvide);
  await putChainObject(ctx, sale);

  const token = await fetchTokenClass(ctx, sale.sellingToken);
  return {
    inputAmount: sellTokenDTO.tokenAmount.toString(),
    outputAmount: nativeTokensToProvide.toString(),
    tokenName: token.name,
    tradeType: "Sell",
    vaultAddress: sellTokenDTO.vaultAddress,
    userAddress: ctx.callingUser
  };
}
