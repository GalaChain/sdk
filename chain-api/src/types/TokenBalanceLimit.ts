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
import { BigNumber } from "bignumber.js";
import { IsInt, IsOptional, Min } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ValidationFailedError } from "../utils";
import { BigNumberArrayProperty, BigNumberIsNotNegative, BigNumberProperty } from "../validators";
import { TokenClassKey, TokenClassKeyProperties } from "./TokenClass";

export class TokenQuantityLimitExceededError extends ValidationFailedError {
  constructor(
    owner: string,
    tokenClass: TokenClassKeyProperties,
    quantity: BigNumber,
    limit: BigNumber,
    spent: BigNumber
  ) {
    const tokenClassKey = TokenClassKey.toStringKey(tokenClass);
    super(`Quantity ${quantity} exceeds quantity limit ${limit} of token ${tokenClassKey}`, {
      owner,
      tokenClassKey,
      quantity: quantity.toFixed(),
      limit: limit.toFixed(),
      spent: spent.toFixed()
    });
  }
}

export class TokenBalanceLimit {
  public static readonly WINDOW_HOURS = 24;
  public static readonly HOUR_MS = 60 * 60 * 1000;
  public static readonly INCREASE_DELAY_MS = TokenBalanceLimit.WINDOW_HOURS * TokenBalanceLimit.HOUR_MS;

  @JSONSchema({
    description:
      "Maximum quantity that may be subtracted from this balance across the current hour and the " +
      "preceding 23 hourly buckets. When set, this value takes precedence over TokenClass.quantityLimit."
  })
  @IsOptional()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity?: BigNumber;

  @JSONSchema({
    description:
      "Owner-requested quantity that is not yet effective. Applied at pendingAppliesAt when the " +
      "requested limit is an increase versus the current effective limit."
  })
  @IsOptional()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  pendingQuantity?: BigNumber;

  @JSONSchema({
    description: "Unix epoch timestamp in milliseconds (ms) when pendingQuantity becomes effective."
  })
  @Min(0)
  @IsInt()
  @IsOptional()
  pendingAppliesAt?: number;

  @JSONSchema({
    description:
      "Spend per hourly bucket. Index is unixHour mod 24. Entering hour H zeros hours[H] " +
      "(yesterday's same hour) and any skipped hours since lastHour, then new spend is added to hours[H]."
  })
  @IsOptional()
  @BigNumberArrayProperty()
  hours?: BigNumber[];

  @JSONSchema({
    description: "Unix hour (floor(ms / 3600000)) of the last recorded spend."
  })
  @Min(0)
  @IsInt()
  @IsOptional()
  lastHour?: number;

  public static unixHour(currentTime: number): number {
    return Math.floor(currentTime / TokenBalanceLimit.HOUR_MS);
  }

  public static hourIndex(currentTime: number): number {
    return TokenBalanceLimit.modWindow(TokenBalanceLimit.unixHour(currentTime));
  }

  public static isFinite(limit: BigNumber | undefined): limit is BigNumber {
    return limit !== undefined && limit.isFinite();
  }

  public static effective(
    limit: TokenBalanceLimit | undefined,
    currentTime: number,
    classQuantityLimit: BigNumber | undefined
  ): BigNumber | undefined {
    if (limit !== undefined) {
      return limit.effectiveQuantity(currentTime, classQuantityLimit);
    }
    return TokenBalanceLimit.isFinite(classQuantityLimit) ? classQuantityLimit : undefined;
  }

  public effectiveQuantity(
    currentTime: number,
    classQuantityLimit: BigNumber | undefined
  ): BigNumber | undefined {
    this.promoteDue(currentTime);
    if (TokenBalanceLimit.isFinite(this.quantity)) {
      return this.quantity;
    }
    if (TokenBalanceLimit.isFinite(classQuantityLimit)) {
      return classQuantityLimit;
    }
    return undefined;
  }

  /**
   * Increase versus the current effective limit is delayed.
   * A later increase while one is pending replaces it and restarts the delay.
   */
  public setQuantity(
    newLimit: BigNumber,
    currentTime: number,
    classQuantityLimit: BigNumber | undefined
  ): void {
    const currentEffective = this.effectiveQuantity(currentTime, classQuantityLimit);
    const isIncrease = currentEffective !== undefined && newLimit.isGreaterThan(currentEffective);

    if (isIncrease) {
      this.pendingQuantity = newLimit;
      this.pendingAppliesAt = currentTime + TokenBalanceLimit.INCREASE_DELAY_MS;
    } else {
      this.quantity = newLimit;
      delete this.pendingQuantity;
      delete this.pendingAppliesAt;
    }
  }

  public spent(currentTime: number): BigNumber {
    this.rotateHours(currentTime);
    return (this.hours ?? []).reduce((sum, hourSpend) => sum.plus(hourSpend), new BigNumber(0));
  }

  public recordSpend(quantity: BigNumber, currentTime: number): void {
    this.rotateHours(currentTime);
    const hours = this.hours ?? TokenBalanceLimit.emptyHours();
    this.hours = hours;
    const idx = TokenBalanceLimit.hourIndex(currentTime);
    hours[idx] = (hours[idx] ?? new BigNumber(0)).plus(quantity);
  }

  public promoteDue(currentTime: number): void {
    if (
      this.pendingQuantity !== undefined &&
      this.pendingAppliesAt !== undefined &&
      currentTime >= this.pendingAppliesAt
    ) {
      this.quantity = this.pendingQuantity;
      delete this.pendingQuantity;
      delete this.pendingAppliesAt;
    }
  }

  /**
   * Advance hourly buckets to currentTime.
   * currentTime is expected to be monotonic (chain tx time). A backwards jump
   * does not move lastHour, so a later forward step cannot zero a newer bucket.
   */
  private rotateHours(currentTime: number): void {
    const hour = TokenBalanceLimit.unixHour(currentTime);
    if (
      this.hours === undefined ||
      this.hours.length !== TokenBalanceLimit.WINDOW_HOURS ||
      this.lastHour === undefined
    ) {
      this.hours = TokenBalanceLimit.emptyHours();
      this.lastHour = hour;
      return;
    }

    const elapsed = hour - this.lastHour;
    if (elapsed <= 0) {
      return;
    }
    if (elapsed >= TokenBalanceLimit.WINDOW_HOURS) {
      this.hours = TokenBalanceLimit.emptyHours();
      this.lastHour = hour;
      return;
    }

    for (let i = 1; i <= elapsed; i++) {
      this.hours[TokenBalanceLimit.modWindow(this.lastHour + i)] = new BigNumber(0);
    }
    this.lastHour = hour;
  }

  private static modWindow(hour: number): number {
    const window = TokenBalanceLimit.WINDOW_HOURS;
    return ((hour % window) + window) % window;
  }

  private static emptyHours(): BigNumber[] {
    return Array.from({ length: TokenBalanceLimit.WINDOW_HOURS }, () => new BigNumber(0));
  }
}
