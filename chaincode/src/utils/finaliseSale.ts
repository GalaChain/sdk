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
  AddLiquidityDTO,
  BurnTokenQuantity,
  CreatePoolDto,
  GetAddLiquidityEstimationDto,
  LaunchpadFinalizeFeeAllocation,
  LaunchpadSale
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import Decimal from "decimal.js";

import { fetchOrCreateBalance } from "../balances";
import { burnTokens } from "../burns";
import { addLiquidity, createPool, getAddLiquidityEstimation } from "../dex";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { generateKeyFromClassKey, sortString } from "./dexUtils";
import { fetchPlatformFeeAddress, getBondingConstants } from "./launchpadSaleUtils";
import { getObjectByKey, putChainObject } from "./state";

export async function finalizeSale(ctx: GalaChainContext, sale: LaunchpadSale): Promise<void> {
  const key = ctx.stub.createCompositeKey(LaunchpadFinalizeFeeAllocation.INDEX_KEY, []);
  const feeAllocation = await getObjectByKey(ctx, LaunchpadFinalizeFeeAllocation, key).catch(() => undefined);

  const platformFeeAddressConfiguration = await fetchPlatformFeeAddress(ctx);
  if (!platformFeeAddressConfiguration) {
    throw new Error("Platform fee configuration is yet to be defined.");
  }

  const platformFeePercentage = feeAllocation ? feeAllocation.platformFeePercentage : 0.1;
  const ownerAllocationPercentage = feeAllocation ? feeAllocation.ownerAllocationPercentage : 0.6;
  const liquidityAllocationPercentage = feeAllocation ? feeAllocation.liquidityAllocationPercentage : 0.3;

  const nativeToken = sale.fetchNativeTokenInstanceKey();
  const memeToken = sale.fetchSellingTokenInstanceKey();

  await transferToken(ctx, {
    from: sale.vaultAddress,
    to: sale.saleOwner,
    tokenInstanceKey: nativeToken,
    quantity: new BigNumber(sale.nativeTokenQuantity)
      .times(ownerAllocationPercentage)
      .decimalPlaces(8, BigNumber.ROUND_DOWN),
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: sale.vaultAddress,
      callingUser: sale.vaultAddress
    }
  });

  await transferToken(ctx, {
    from: sale.vaultAddress,
    to: platformFeeAddressConfiguration.feeAddress,
    tokenInstanceKey: nativeToken,
    quantity: new BigNumber(sale.nativeTokenQuantity)
      .times(platformFeePercentage)
      .decimalPlaces(8, BigNumber.ROUND_DOWN),
    allowancesToUse: [],
    authorizedOnBehalf: {
      callingOnBehalf: sale.vaultAddress,
      callingUser: sale.vaultAddress
    }
  });

  const sellingTokenClassKey = sale.fetchSellingTokenInstanceKey().getTokenClassKey();
  const nativeTokenClassKey = sale.fetchNativeTokenInstanceKey().getTokenClassKey();

  const { isChanged } = sortString([sellingTokenClassKey, nativeTokenClassKey].map(generateKeyFromClassKey));

  const finalPrice = convertFinalPriceToSqrtPrice(sale, isChanged);
  const poolDTO = new CreatePoolDto(
    isChanged ? nativeTokenClassKey : sellingTokenClassKey,
    isChanged ? sellingTokenClassKey : nativeTokenClassKey,
    3000,
    finalPrice
  );

  await createPool(ctx, poolDTO);

  const expectedTokenDTO = new GetAddLiquidityEstimationDto(
    isChanged ? nativeTokenClassKey : sellingTokenClassKey,
    isChanged ? sellingTokenClassKey : nativeTokenClassKey,
    3000,
    new BigNumber(sale.nativeTokenQuantity).times(liquidityAllocationPercentage),
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
    new BigNumber(liquidity.amount0.toString()),
    new BigNumber(liquidity.amount1.toString()),
    new BigNumber(liquidity.amount0.toString()).times(0.9999999),
    new BigNumber(liquidity.amount1.toString()).times(0.9999999)
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

function convertFinalPriceToSqrtPrice(sale: LaunchpadSale, isChanged: boolean): BigNumber {
  const totalTokensSold = new Decimal(sale.fetchTokensSold());
  const basePrice = new Decimal(sale.fetchBasePrice());
  const { exponentFactor, euler, decimals } = getBondingConstants();

  const exponent = exponentFactor.mul(totalTokensSold).div(decimals);
  const multiplicand = euler.pow(exponent);
  const price = multiplicand.mul(basePrice).div(decimals);
  const sqrtPrice = isChanged ? new Decimal(1).dividedBy(price).pow("0.5") : price.pow("0.5");

  return new BigNumber(sqrtPrice.toString());
}
