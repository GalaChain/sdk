import { FetchSaleDto, LaunchPadSale, NotFoundError } from "@gala-chain/api";
import { GalaChainContext, getObjectByKey } from "@gala-chain/chaincode";
import { BigNumber } from "bignumber.js";



BigNumber.config({
  ROUNDING_MODE: BigNumber.ROUND_UP
});

/**
 * Fetches the details of a specific token sale (LaunchPadSale) using its sale address.
 * 
 * This function retrieves the sale object from the chain using a composite key derived 
 * from the sale address. If the sale record is not found, an error is thrown.
 * 
 * @param ctx - The context object providing access to the GalaChain environment.
 * @param fetchSaleDTO - An object containing the sale address:
 *   - `vaultAddress`: The address of the sale to be fetched.
 * 
 * @returns A promise that resolves to a `LaunchPadSale` object containing details about 
 *          the specified token sale.
 * 
 * @throws NotFoundError if no sale record is found for the provided sale address.
 */
export async function fetchSaleDetails(
  ctx: GalaChainContext,
  fetchSaleDTO: FetchSaleDto
): Promise<LaunchPadSale> {
  const key = ctx.stub.createCompositeKey(LaunchPadSale.INDEX_KEY, [fetchSaleDTO.vaultAddress]);

  const sale = await getObjectByKey(ctx, LaunchPadSale, key).catch(() => undefined);
  if (sale === undefined) {
    throw new NotFoundError("Sale record not found.");
  }

  return sale;
}
