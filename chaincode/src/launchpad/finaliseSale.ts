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
  LaunchpadSale,
  PreConditionFailedError
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import Decimal from "decimal.js";

import { fetchOrCreateBalance } from "../balances";
import { burnTokens } from "../burns";
import { addLiquidity, createPool, getAddLiquidityEstimation, getPoolData, getSlot0 } from "../dex";
import { generateKeyFromClassKey, sortString } from "../dex/dexUtils";
import { transferToken } from "../transfer";
import { GalaChainContext } from "../types";
import { fetchLaunchpadFeeAddress, getBondingConstants, getObjectByKey, putChainObject } from "../utils";

export async function finalizeSale(ctx: GalaChainContext, sale: LaunchpadSale): Promise<void> {
  const key = ctx.stub.createCompositeKey(LaunchpadFinalizeFeeAllocation.INDEX_KEY, []);
  const feeAllocation = await getObjectByKey(ctx, LaunchpadFinalizeFeeAllocation, key).catch(() => undefined);

  const platformFeeAddressConfiguration = await fetchLaunchpadFeeAddress(ctx);
  if (!platformFeeAddressConfiguration) {
    throw new PreConditionFailedError("Platform fee configuration is yet to be defined.");
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

  const { isChanged: areTokensSorted } = sortString(
    [sellingTokenClassKey, nativeTokenClassKey].map(generateKeyFromClassKey)
  );

  const { sqrtPrice, finalPrice } = calculateFinalLaunchpadPrice(sale, areTokensSorted);
  const poolDTO = new CreatePoolDto(
    areTokensSorted ? nativeTokenClassKey : sellingTokenClassKey,
    areTokensSorted ? sellingTokenClassKey : nativeTokenClassKey,
    3000,
    sqrtPrice
  );

  // Check if a pool for this token already exists
  const pool = await getPoolData(ctx, poolDTO);
  if (!pool) {
    await createPool(ctx, poolDTO);
  }
  const poolInfo = await getSlot0(ctx, poolDTO);

  // Proceed normally if price in the pool is within an acceptable range
  const priceCloseEnough = sqrtPrice.minus(poolInfo.sqrtPrice).abs().lte(sqrtPrice.multipliedBy(0.05));
  const expectedNativeTokenRequired = new BigNumber(sale.nativeTokenQuantity).times(
    liquidityAllocationPercentage
  );
  const isPriceGreaterThanExpected = poolInfo.sqrtPrice.isGreaterThan(sqrtPrice);
  const expectedSaleTokenRequired = expectedNativeTokenRequired.times(finalPrice);

  // Determine token amounts and token ordering
  const token0 = areTokensSorted ? nativeTokenClassKey : sellingTokenClassKey;
  const token1 = areTokensSorted ? sellingTokenClassKey : nativeTokenClassKey;

  const liquidityAmount = priceCloseEnough
    ? expectedNativeTokenRequired
    : isPriceGreaterThanExpected
      ? expectedSaleTokenRequired
      : expectedNativeTokenRequired;

  const zeroForOne = priceCloseEnough
    ? areTokensSorted
    : isPriceGreaterThanExpected
      ? !areTokensSorted
      : areTokensSorted;

  const expectedTokenDTO = new GetAddLiquidityEstimationDto(
    token0,
    token1,
    3000,
    liquidityAmount,
    -887220,
    887220,
    zeroForOne
  );

  const addLiquidityEstimate = await getAddLiquidityEstimation(ctx, expectedTokenDTO);

  const amount0 = new BigNumber(addLiquidityEstimate.amount0.toString());
  const amount1 = new BigNumber(addLiquidityEstimate.amount1.toString());

  const positionDto = new AddLiquidityDTO(
    token0,
    token1,
    3000,
    -887220,
    887220,
    amount0,
    amount1,
    amount0.times(0.9999999),
    amount1.times(0.9999999),
    undefined
  );
  positionDto.uniqueKey = sale.vaultAddress;

  await addLiquidity(ctx, positionDto, sale.vaultAddress);

  // Burn any extra meme tokens
  const sellingTokenToBurn = await fetchOrCreateBalance(ctx, sale.vaultAddress, memeToken);
  const burnSellingTokenQuantity = new BurnTokenQuantity();
  burnSellingTokenQuantity.tokenInstanceKey = memeToken;
  burnSellingTokenQuantity.quantity = sellingTokenToBurn.getQuantityTotal();

  await burnTokens(ctx, {
    owner: sale.vaultAddress,
    toBurn: [burnSellingTokenQuantity],
    preValidated: true
  });

  // Burn any extra GALA
  const nativeTokenToBurn = await fetchOrCreateBalance(ctx, sale.vaultAddress, nativeToken);
  const burnNativeTokenQuantity = new BurnTokenQuantity();
  burnNativeTokenQuantity.tokenInstanceKey = nativeToken;
  burnNativeTokenQuantity.quantity = nativeTokenToBurn.getQuantityTotal();

  if (burnNativeTokenQuantity.quantity) {
    await burnTokens(ctx, {
      owner: sale.vaultAddress,
      toBurn: [burnNativeTokenQuantity],
      preValidated: true
    });
  }

  // update sale status
  sale.finalizeSale();
  await putChainObject(ctx, sale);
}

function calculateFinalLaunchpadPrice(
  sale: LaunchpadSale,
  areTokensSorted: boolean
): { sqrtPrice: BigNumber; finalPrice: BigNumber } {
  const totalTokensSold = new Decimal(sale.fetchTokensSold());
  const basePrice = new Decimal(sale.fetchBasePrice());
  const { exponentFactor, euler, decimals } = getBondingConstants();

  const exponent = exponentFactor.mul(totalTokensSold).div(decimals);
  const multiplicand = euler.pow(exponent);
  const finalPriceDecimal = multiplicand.mul(basePrice).div(decimals);

  const priceDecimal = areTokensSorted ? new Decimal(1).dividedBy(finalPriceDecimal) : finalPriceDecimal;
  const sqrtPriceDecimal = priceDecimal.pow("0.5");

  return {
    finalPrice: new BigNumber(new Decimal(1).dividedBy(finalPriceDecimal).toString()),
    sqrtPrice: new BigNumber(sqrtPriceDecimal.toString())
  };
}
