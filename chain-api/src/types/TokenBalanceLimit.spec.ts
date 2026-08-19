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
import BigNumber from "bignumber.js";

import { TokenBalance } from "./TokenBalance";
import { TokenBalanceLimit } from "./TokenBalanceLimit";
import { UserAlias } from "./UserAlias";

function emptyBalance() {
  return new TokenBalance({
    collection: "test-collection",
    category: "test-category",
    type: "test-type",
    additionalKey: "test-additional-key",
    owner: "client|user1" as UserAlias
  });
}

describe("TokenBalanceLimit", () => {
  const now = 1_000_000;
  const delay = TokenBalanceLimit.INCREASE_DELAY_MS;
  const hour = (h: number) => h * TokenBalanceLimit.HOUR_MS;

  it("should subtract when quantity is within the class limit", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));

    // When
    balance.subtractQuantity(new BigNumber(10), now, new BigNumber(10));

    // Then
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(90));
  });

  it("should fail to subtract when quantity exceeds the class limit", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));

    // When
    const error = () => balance.subtractQuantity(new BigNumber(11), now, new BigNumber(10));

    // Then
    expect(error).toThrow("exceeds quantity limit");
  });

  it("should fail when cumulative spend in the hourly window exceeds the class limit", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.subtractQuantity(new BigNumber(6), now, new BigNumber(10));

    // When
    const error = () => balance.subtractQuantity(new BigNumber(5), now, new BigNumber(10));

    // Then
    expect(error).toThrow("exceeds quantity limit");
  });

  it("should use owner limit instead of class limit when owner limit is set", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.setQuantityLimit(new BigNumber(5), now, new BigNumber(10));

    // When
    const withinOwnerLimit = () => balance.subtractQuantity(new BigNumber(5), now, new BigNumber(10));
    const aboveOwnerLimit = () => balance.subtractQuantity(new BigNumber(6), now, new BigNumber(10));

    // Then
    expect(withinOwnerLimit).not.toThrow();
    expect(aboveOwnerLimit).toThrow("exceeds quantity limit");
  });

  it("should apply a first owner limit immediately when it is not higher than the class limit", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.setQuantityLimit(new BigNumber(5), now, new BigNumber(10));

    // Then
    expect(balance.limit?.quantity).toEqual(new BigNumber(5));
    expect(balance.limit?.pendingQuantity).toBeUndefined();
    expect(balance.getEffectiveQuantityLimit(now, new BigNumber(10))).toEqual(new BigNumber(5));
  });

  it("should delay an owner limit that is higher than the current effective limit", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.setQuantityLimit(new BigNumber(50), now, new BigNumber(10));

    // Then
    expect(balance.limit?.quantity).toBeUndefined();
    expect(balance.limit?.pendingQuantity).toEqual(new BigNumber(50));
    expect(balance.limit?.pendingAppliesAt).toEqual(now + delay);
    expect(balance.getEffectiveQuantityLimit(now, new BigNumber(10))).toEqual(new BigNumber(10));
  });

  it("should keep using the current limit until the pending increase applies", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.setQuantityLimit(new BigNumber(50), now, new BigNumber(10));

    // When
    const beforeDelay = () => balance.subtractQuantity(new BigNumber(11), now + delay - 1, new BigNumber(10));
    const atDelay = () => balance.subtractQuantity(new BigNumber(50), now + delay, new BigNumber(10));

    // Then
    expect(beforeDelay).toThrow("exceeds quantity limit");
    expect(atDelay).not.toThrow();
    expect(balance.limit?.quantity).toEqual(new BigNumber(50));
    expect(balance.limit?.pendingQuantity).toBeUndefined();
  });

  it("should apply a decrease immediately and cancel a pending increase", () => {
    // Given
    const balance = emptyBalance();
    balance.setQuantityLimit(new BigNumber(5), now, new BigNumber(10));
    balance.setQuantityLimit(new BigNumber(50), now, new BigNumber(10));

    // When
    balance.setQuantityLimit(new BigNumber(3), now + 1, new BigNumber(10));

    // Then
    expect(balance.limit?.quantity).toEqual(new BigNumber(3));
    expect(balance.limit?.pendingQuantity).toBeUndefined();
    expect(balance.limit?.pendingAppliesAt).toBeUndefined();
    expect(balance.getEffectiveQuantityLimit(now + 1, new BigNumber(10))).toEqual(new BigNumber(3));
  });

  it("should apply a first owner limit immediately when there is no class limit", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.setQuantityLimit(new BigNumber(50), now, undefined);

    // Then
    expect(balance.limit?.quantity).toEqual(new BigNumber(50));
    expect(balance.limit?.pendingQuantity).toBeUndefined();
  });

  it("should fail to set a quantity limit on an NFT balance", () => {
    // Given
    const balance = emptyBalance();
    balance.addInstance(new BigNumber(1));

    // When
    const error = () => balance.setQuantityLimit(new BigNumber(1), now, undefined);

    // Then
    expect(error).toThrow("Attempted to perform FT-specific operation on balance containing NFT instances");
  });

  it("should zero the entered hour slot and keep the previous hour", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));

    // When
    balance.subtractQuantity(new BigNumber(3), hour(11), new BigNumber(10));
    balance.subtractQuantity(new BigNumber(4), hour(12), new BigNumber(10));

    // Then
    expect(balance.limit?.hours?.[11]).toEqual(new BigNumber(3));
    expect(balance.limit?.hours?.[12]).toEqual(new BigNumber(4));
    expect(balance.limit?.lastHour).toEqual(12);
  });

  it("should allow spend again after 24 hourly buckets expire", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.subtractQuantity(new BigNumber(10), hour(0), new BigNumber(10));

    // When
    const stillInWindow = () => balance.subtractQuantity(new BigNumber(1), hour(23), new BigNumber(10));
    const afterWindow = () => balance.subtractQuantity(new BigNumber(10), hour(24), new BigNumber(10));

    // Then
    expect(stillInWindow).toThrow("exceeds quantity limit");
    expect(afterWindow).not.toThrow();
  });

  it("should report zero spent on a new limit", () => {
    // Given
    const limit = new TokenBalanceLimit();

    // When
    const spent = limit.spent(now);

    // Then
    expect(spent).toEqual(new BigNumber(0));
  });

  it("should accumulate spend recorded in the same hour", () => {
    // Given
    const limit = new TokenBalanceLimit();

    // When
    limit.recordSpend(new BigNumber(3), hour(11));
    limit.recordSpend(new BigNumber(4), hour(11));

    // Then
    expect(limit.spent(hour(11))).toEqual(new BigNumber(7));
    expect(limit.hours?.[11]).toEqual(new BigNumber(7));
  });

  it("should zero a skipped hour and keep the previous hour", () => {
    // Given
    const limit = new TokenBalanceLimit();
    limit.recordSpend(new BigNumber(3), hour(11));

    // When
    limit.recordSpend(new BigNumber(4), hour(13));

    // Then
    expect(limit.hours?.[11]).toEqual(new BigNumber(3));
    expect(limit.hours?.[12]).toEqual(new BigNumber(0));
    expect(limit.hours?.[13]).toEqual(new BigNumber(4));
    expect(limit.spent(hour(13))).toEqual(new BigNumber(7));
  });

  it("should keep the oldest hour after 23 hours", () => {
    // Given
    const limit = new TokenBalanceLimit();
    limit.recordSpend(new BigNumber(10), hour(0));

    // When
    const spent = limit.spent(hour(23));

    // Then
    expect(spent).toEqual(new BigNumber(10));
    expect(limit.hours?.[0]).toEqual(new BigNumber(10));
  });

  it("should clear all buckets after 24 hours", () => {
    // Given
    const limit = new TokenBalanceLimit();
    limit.recordSpend(new BigNumber(10), hour(0));

    // When
    const spent = limit.spent(hour(24));

    // Then
    expect(spent).toEqual(new BigNumber(0));
  });

  it("should map a negative unix hour to a non-negative bucket index", () => {
    // Given & When
    const idx = TokenBalanceLimit.hourIndex(-1);

    // Then
    expect(idx).toEqual(23);
  });

  it("should restart the delay when a pending increase is replaced", () => {
    // Given
    const limit = new TokenBalanceLimit();
    limit.setQuantity(new BigNumber(50), now, new BigNumber(100));
    limit.setQuantity(new BigNumber(80), now, new BigNumber(100));

    // When
    limit.setQuantity(new BigNumber(120), now + 1, new BigNumber(100));

    // Then
    expect(limit.quantity).toEqual(new BigNumber(50));
    expect(limit.pendingQuantity).toEqual(new BigNumber(120));
    expect(limit.pendingAppliesAt).toEqual(now + 1 + delay);
    expect(limit.effectiveQuantity(now + 1, new BigNumber(100))).toEqual(new BigNumber(50));
  });

  it("should apply a pending owner limit even if the class limit was raised in the meantime", () => {
    // Given
    const limit = new TokenBalanceLimit();
    limit.setQuantity(new BigNumber(150), now, new BigNumber(100));

    // When
    const beforeDue = limit.effectiveQuantity(now, new BigNumber(200));
    const whenDue = limit.effectiveQuantity(now + delay, new BigNumber(200));

    // Then
    expect(beforeDue).toEqual(new BigNumber(200));
    expect(whenDue).toEqual(new BigNumber(150));
    expect(limit.quantity).toEqual(new BigNumber(150));
    expect(limit.pendingQuantity).toBeUndefined();
  });

  it("should fall back to the class limit when the owner has not set a quantity", () => {
    // Given
    const limit = new TokenBalanceLimit();

    // When
    const effective = limit.effectiveQuantity(now, new BigNumber(10));

    // Then
    expect(effective).toEqual(new BigNumber(10));
  });
});
