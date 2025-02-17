import {
  AddLiquidityDTO,
  BurnTokenQuantity,
  CreatePoolDto,
  ExpectedTokenDTO,
  LaunchPadSale,
  asValidUserAlias
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import Decimal from "decimal.js";

import { fetchOrCreateBalance } from "../balances";
import { burnTokens } from "../burns";
import { addLiquidity, createPool, getAddLiquidityEstimation } from "../dex";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { generateKeyFromClassKey, sortString } from "./dexUtils";
import { fetchPlatformFeeAddress, getBondingConstants } from "./launchpadSaleutils";
import { putChainObject } from "./state";

export async function finalizeLaunchpadSale(ctx: GalaChainContext, sale: LaunchPadSale): Promise<void> {
  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();
  const vaultAddress = asValidUserAlias(sale.vaultAddress);
  const saleOwner = asValidUserAlias(sale.saleOwner);

  await transferToken(ctx, {
    from: vaultAddress,
    to: saleOwner,
    tokenInstanceKey: nativeToken,
    quantity: new BigNumber(sale.nativeTokenQuantity).times(0.6).decimalPlaces(8, BigNumber.ROUND_DOWN),
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: vaultAddress,
      callingUser: vaultAddress
    }
  });

  const platformFeeAddress = asValidUserAlias(await fetchPlatformFeeAddress(ctx));
  await transferToken(ctx, {
    from: vaultAddress,
    to: platformFeeAddress,
    tokenInstanceKey: nativeToken,
    quantity: new BigNumber(sale.nativeTokenQuantity).times(0.1).decimalPlaces(8, BigNumber.ROUND_DOWN),
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: vaultAddress,
      callingUser: vaultAddress
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

  await addLiquidity(ctx, positionDto, vaultAddress);

  const sellingTokenToBurn = await fetchOrCreateBalance(ctx, vaultAddress, memeToken);
  const burnTokenQuantity = new BurnTokenQuantity();
  burnTokenQuantity.tokenInstanceKey = memeToken;
  burnTokenQuantity.quantity = sellingTokenToBurn.getQuantityTotal();

  await burnTokens(ctx, {
    owner: vaultAddress,
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
