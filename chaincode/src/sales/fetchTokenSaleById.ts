import { TokenSale } from "@gala-chain/api";
import { GalaChainContext, getObjectByKey } from "@gala-chain/chaincode";

export async function fetchTokenSaleById(
  ctx: GalaChainContext,
  tokenSaleId: string
): Promise<TokenSale> {
  let tokenSale: TokenSale;

  try {
    tokenSale = await getObjectByKey(ctx, TokenSale, tokenSaleId);
  } catch (error) {
    throw new Error(`Token sale with tokenSaleId ${tokenSaleId} not found.`);
  }

  return tokenSale;
}
