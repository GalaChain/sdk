import { DefaultError } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { PositionData } from "../types";
import { requirePosititve } from "./format.helper";

// @notice Updates the positions for a pool
/// @param positions The mapping containing all user positions
/// @param owner The address of the position owner
/// @param tickLower The lower tick boundary of the position
/// @param tickUpper The upper tick boundary of the position
/// @param liquidityDelta The amount of liquidity changing for the position
/// @param feeGrowthInside0 The all-time fee growth in token0, per unit of liquidity, inside the position's tick boundaries
/// @param feeGrowthInside1 The all-time fee growth in token1, per unit of liquidity, inside the position's tick boundaries
/// @return position The position info struct of the given owners' position
export function updatePositions(
  positions: Map<string, PositionData>,
  owner: string,
  tickLower: number,
  tickUpper: number,
  liquidityDelta: BigNumber,
  feeGrowthInside0: BigNumber,
  feeGrowthInside1: BigNumber
) {
  // TODO: key must be a keccak hash
  let key = `${owner}_${tickLower}_${tickUpper}`;

  if (positions[key] == undefined) {
    positions[key] = {};
    positions[key].owner = owner;
    positions[key].liquidity = new BigNumber(0).toString();
    positions[key].feeGrowthInside0Last = new BigNumber(0).toString();
    positions[key].feeGrowthInside1Last = new BigNumber(0).toString();
    positions[key].tokensOwed0 = new BigNumber(0).toString();
    positions[key].tokensOwed1 = new BigNumber(0).toString();
  }
  let positionData = positions[key];

  let liquidityNext: BigNumber;
  if (liquidityDelta.isEqualTo(0)) {
    if (!positionData.liquidity.isGreaterThan(0)) throw new DefaultError("NP");
    liquidityNext = new BigNumber(positionData.liquidity);
  } else {
    liquidityNext = new BigNumber(positionData.liquidity).plus(liquidityDelta);
    requirePosititve(liquidityNext);
  }

  // Calculate accumulated fees
  let tokensOwed0 = feeGrowthInside0
    .minus(new BigNumber(positionData.feeGrowthInside0Last))
    .times(new BigNumber(positionData.liquidity));
  let tokensOwed1 = feeGrowthInside1
    .minus(new BigNumber(positionData.feeGrowthInside1Last))
    .times(new BigNumber(positionData.liquidity));

  // update the position
  if (!liquidityDelta.isEqualTo(0)) positionData.liquidity = liquidityNext.toString();
  positionData.feeGrowthInside0Last = feeGrowthInside0.toString();
  positionData.feeGrowthInside1Last = feeGrowthInside1.toString();

  if (tokensOwed0.isGreaterThan(0) || tokensOwed1.isGreaterThan(0)) {
    positionData.tokensOwed0 = new BigNumber(positionData.tokensOwed0).plus(tokensOwed0).toString();
    positionData.tokensOwed1 = new BigNumber(positionData.tokensOwed1).plus(tokensOwed1).toString();
  }
}
