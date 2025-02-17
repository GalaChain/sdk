import { ChainKey, ChainObject, PositionsObject } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { Exclude } from "class-transformer";
import { IsString } from "class-validator";

export class UserPosition extends ChainObject {
  @Exclude()
  static INDEX_KEY = "POSITIONS";

  @ChainKey({ position: 0 })
  @IsString()
  public readonly user: string;
  public positions: PositionsObject;

  constructor(user: string) {
    super();
    this.user = user;
    this.positions = {};
  }

  updateOrCreate(poolAddress: string, tickLower: number, tickUpper: number, liquidity: BigNumber) {
    if (!this.positions[poolAddress]) {
      this.positions[poolAddress] = [];
    }

    const poolPositions = this.positions[poolAddress];
    const existingPosition = poolPositions.find(
      (e) => e.tickLower === tickLower && e.tickUpper === tickUpper
    );

    if (existingPosition) {
      existingPosition.liquidity = BigNumber(existingPosition.liquidity).plus(liquidity).toString();
    } else {
      poolPositions.push({
        tickLower,
        tickUpper,
        liquidity: liquidity.toString()
      });
    }
  }

  removeLiquidity(poolAddress: string, tickLower: number, tickUpper: number, liquidity: BigNumber) {
    if (!this.positions[poolAddress]) return;
    const poolPositions = this.positions[poolAddress] || [];
    const posIdx = poolPositions.findIndex((e) => e.tickLower === tickLower && e.tickUpper === tickUpper);
    const existingPosition = poolPositions[posIdx];

    if (existingPosition) {
      if (BigNumber(existingPosition.liquidity).gte(liquidity)) {
        existingPosition.liquidity = BigNumber(existingPosition.liquidity).minus(liquidity).toString();
      }
    }
  }

  deletePosition(poolAddress: string, tickLower: number, tickUpper: number) {
    if (!this.positions[poolAddress]) return;
    const poolPositions = this.positions[poolAddress] || [];
    const posIdx = poolPositions.findIndex((e) => e.tickLower === tickLower && e.tickUpper === tickUpper);
    const existingPosition = poolPositions[posIdx];
    if (existingPosition) {
      poolPositions[posIdx] = poolPositions[poolPositions.length - 1];
      poolPositions.pop();
    }
    if (poolPositions.length === 0) {
      delete this.positions[poolAddress];
    }
  }
}
