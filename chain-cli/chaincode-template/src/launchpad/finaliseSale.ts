import { BurnTokenQuantity } from "@gala-chain/api";
import {
  GalaChainContext,
  burnTokens,
  fetchOrCreateBalance,
  putChainObject,
  transferToken
} from "@gala-chain/chaincode";
import BigNumber from "bignumber.js";
import Decimal from "decimal.js";

import { addLiquidity } from "../v3/addLiquidity";
import { createPool } from "../v3/createPool";
import { AddLiquidityDTO, CreatePoolDto, ExpectedTokenDTO } from "../v3/dtos";
import { getAddLiquidityEstimation } from "../v3/getFunctions";
import { generateKeyFromClassKey, sortString } from "../v3/helpers/format.helper";
import { LaunchPadSale } from "./LaunchPadSale";
import { fetchPlatformFeeAddress, getBondingConstants } from "./helper/launchpadHelperFunctions";

export async function finalizeSale(ctx: GalaChainContext, sale: LaunchPadSale): Promise<void> {
  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();

  await transferToken(ctx, {
    from: sale.vaultAddress,
    to: sale.saleOwner,
    tokenInstanceKey: nativeToken,
    quantity: new BigNumber(sale.nativeTokenQuantity).times(0.6).decimalPlaces(8, BigNumber.ROUND_DOWN),
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: sale.vaultAddress,
      callingUser: sale.vaultAddress
    }
  });

  const platformFeeAddress = await fetchPlatformFeeAddress(ctx);
  await transferToken(ctx, {
    from: sale.vaultAddress,
    to: platformFeeAddress,
    tokenInstanceKey: nativeToken,
    quantity: new BigNumber(sale.nativeTokenQuantity).times(0.1).decimalPlaces(8, BigNumber.ROUND_DOWN),
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: sale.vaultAddress,
      callingUser: sale.vaultAddress
    }
  });

  let sellingTokenClassKey = sale.fetchSellingTokenInstanceKey().getTokenClassKey();
  let nativeTokenClassKey = sale.fetchNativeTokenInstanceKey().getTokenClassKey();

  const { isChanged } = sortString([sellingTokenClassKey, nativeTokenClassKey].map(generateKeyFromClassKey));

  const finalPrice = convertFinalPriceToSqrtPrice(sale, isChanged);
  const poolDTO = new CreatePoolDto(
    isChanged ? nativeTokenClassKey : sellingTokenClassKey,
    isChanged ? sellingTokenClassKey : nativeTokenClassKey,
    3000,
    finalPrice
  );

  await createPool(ctx, poolDTO);

  const expectedTokenDTO = new ExpectedTokenDTO(
    isChanged ? nativeTokenClassKey : sellingTokenClassKey,
    isChanged ? sellingTokenClassKey : nativeTokenClassKey,
    3000,
    new BigNumber(sale.nativeTokenQuantity).times(0.3),
    -887220,
    887220,
    isChanged ? true : false
  );
  const liquidity = await getAddLiquidityEstimation(ctx, expectedTokenDTO);

  const positionDto = new AddLiquidityDTO(
    isChanged ? nativeTokenClassKey : sellingTokenClassKey,
    isChanged ? sellingTokenClassKey : nativeTokenClassKey,
    3000,
    -887220,
    887220,
    new BigNumber(liquidity[0].toString()),
    new BigNumber(liquidity[1].toString()),
    new BigNumber(liquidity[0].toString()).times(0.9999999),
    new BigNumber(liquidity[1].toString()).times(0.9999999)
  );

  await addLiquidity(ctx, positionDto, sale.vaultAddress);

  const sellingTokenToBurn = await fetchOrCreateBalance(ctx, sale.vaultAddress, memeToken);
  const burnTokenQuantity = new BurnTokenQuantity();
  burnTokenQuantity.tokenInstanceKey = memeToken;
  burnTokenQuantity.quantity = sellingTokenToBurn.getQuantityTotal();

  await burnTokens(ctx, {
    owner: sale.vaultAddress,
    toBurn: [burnTokenQuantity],
    preValidated: true
  });

  // update sale status
  sale.finalizeSale();
  await putChainObject(ctx, sale);
}

function convertFinalPriceToSqrtPrice(sale: LaunchPadSale, isChanged: boolean): BigNumber {
  const totalTokensSold = new Decimal(sale.fetchTokensSold());
  const basePrice = new Decimal(sale.fetchBasePrice());
  const { exponentFactor, euler, decimals } = getBondingConstants();

  const exponent = exponentFactor.mul(totalTokensSold).div(decimals);
  const multiplicand = euler.pow(exponent);
  const price = multiplicand.mul(basePrice).div(decimals);
  const sqrtPrice = isChanged ? new Decimal(1).dividedBy(price).pow("0.5") : price.pow("0.5");

  return new BigNumber(sqrtPrice.toString());
}
