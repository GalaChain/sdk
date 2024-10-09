import { TokenAllowance, TokenSale, TokenSaleDtoValidationError, TokenSaleMintAllowance } from "@gala-chain/api";
import { deleteChainObject, GalaChainContext, getObjectByKey, getObjectsByPartialCompositeKey, takeUntilUndefined } from "@gala-chain/chaincode";

export async function removeTokenSale(
  ctx: GalaChainContext,
  tokenSaleId: string
): Promise<void> {
  const transactionTime: number = ctx.txUnixTime;

  const chainValidationErrors: Array<string> = [];

  // This will throw an error if it can't be found
  const tokenSale = await getObjectByKey(ctx, TokenSale, tokenSaleId);

  if (tokenSale.owner !== ctx.callingUser) {
    chainValidationErrors.push(
      `${ctx.callingUser} does not have permission to remove token sale ${tokenSaleId}`
    );
  }

  if (tokenSale.quantity.isEqualTo(tokenSale.quantityFulfilled)) {
    chainValidationErrors.push(`Token sale ${tokenSaleId} has already sold out`);
  }

  if (chainValidationErrors.length === 0) {

    const instanceQueryKeys = takeUntilUndefined(tokenSaleId);
    const tokenSaleMintAllowances = await getObjectsByPartialCompositeKey(ctx, TokenSaleMintAllowance.INDEX_KEY, instanceQueryKeys, TokenSaleMintAllowance);
    
    // Remove remaining mint allowances that weren't sold
    await Promise.all(
      tokenSaleMintAllowances.map(
        async (tokenSaleMintAllowance) => {
          const allowance = await getObjectByKey(ctx, TokenAllowance, tokenSaleMintAllowance.allowanceObjectKey);
          await deleteChainObject(ctx, allowance)
        }
      )
    );

    // Remove token
    // TODO: Do we want to end and save state instead of remove?
    await deleteChainObject(ctx, tokenSale);
  } else {
    throw new TokenSaleDtoValidationError("removeTokenSale", chainValidationErrors);
  }
}
