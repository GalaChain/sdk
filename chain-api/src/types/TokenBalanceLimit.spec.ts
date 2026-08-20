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

  it("should not enforce a limit when the class has none", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));

    // When
    balance.subtractQuantity(new BigNumber(100), now, undefined);

    // Then
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(0));
    expect(balance.limit).toBeUndefined();
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

  it("should apply a lowered class limit immediately", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.subtractQuantity(new BigNumber(6), now, new BigNumber(10));

    // When
    const error = () => balance.subtractQuantity(new BigNumber(1), now, new BigNumber(5));

    // Then
    expect(error).toThrow("exceeds quantity limit");
  });

  it("should apply a raised class limit immediately", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.subtractQuantity(new BigNumber(6), now, new BigNumber(10));

    // When
    balance.subtractQuantity(new BigNumber(11), now, new BigNumber(50));

    // Then
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(83));
  });

  it("should apply a newly added class limit immediately", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.subtractQuantity(new BigNumber(11), now, undefined);

    // When
    const error = () => balance.subtractQuantity(new BigNumber(11), now, new BigNumber(10));

    // Then
    expect(error).toThrow("exceeds quantity limit");
  });

  it("should delay an owner quota increase until the delay elapses", () => {
    // Given
    const delay = TokenBalanceLimit.INCREASE_DELAY_MS;
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.setQuantityLimit(new BigNumber(50), now, new BigNumber(10));

    // When
    const beforeDelay = () => balance.subtractQuantity(new BigNumber(11), now + delay - 1, new BigNumber(10));
    const atDelay = () => balance.subtractQuantity(new BigNumber(11), now + delay, new BigNumber(10));

    // Then
    expect(balance.limit?.pendingQuantity).toEqual(new BigNumber(50));
    expect(balance.limit?.pendingAppliesAt).toEqual(now + delay);
    expect(beforeDelay).toThrow("exceeds quantity limit");
    expect(atDelay).not.toThrow();
    expect(balance.limit?.quantity).toEqual(new BigNumber(50));
    expect(balance.limit?.pendingQuantity).toBeUndefined();
  });

  it("should apply an owner quota decrease immediately", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.setQuantityLimit(new BigNumber(5), now, new BigNumber(10));

    // When
    const error = () => balance.subtractQuantity(new BigNumber(6), now, new BigNumber(10));

    // Then
    expect(balance.limit?.quantity).toEqual(new BigNumber(5));
    expect(balance.limit?.pendingQuantity).toBeUndefined();
    expect(error).toThrow("exceeds quantity limit");
  });

  it("should drop hour 0 at hour 24, keep hour 24 through hour 47, and drop it at hour 48", () => {
    // Given
    const limit = new TokenBalanceLimit();
    limit.recordSpend(new BigNumber(10), hour(0));
    limit.recordSpend(new BigNumber(20), hour(1));
    limit.recordSpend(new BigNumber(30), hour(23));

    // When
    limit.recordSpend(new BigNumber(40), hour(24));
    const spentAt24 = limit.spent(hour(24));
    const hour24Bucket = limit.hours?.[0];
    const spentAt47 = limit.spent(hour(47));
    const spentAt48 = limit.spent(hour(48));

    // Then
    expect(spentAt24).toEqual(new BigNumber(90));
    expect(hour24Bucket).toEqual(new BigNumber(40));
    expect(spentAt47).toEqual(new BigNumber(40));
    expect(spentAt48).toEqual(new BigNumber(0));
  });

  it("should clear incomplete pending fields", () => {
    // Given
    const quantityOnly = new TokenBalanceLimit();
    quantityOnly.pendingQuantity = new BigNumber(200);
    const appliesAtOnly = new TokenBalanceLimit();
    appliesAtOnly.pendingAppliesAt = now + TokenBalanceLimit.INCREASE_DELAY_MS;

    // When
    quantityOnly.spent(now);
    appliesAtOnly.spent(now);

    // Then
    expect(quantityOnly.pendingQuantity).toBeUndefined();
    expect(quantityOnly.pendingAppliesAt).toBeUndefined();
    expect(appliesAtOnly.pendingQuantity).toBeUndefined();
    expect(appliesAtOnly.pendingAppliesAt).toBeUndefined();
  });

  it("should keep spend at lastHour + 23 and drop it at lastHour + 24", () => {
    // Given
    const limit = new TokenBalanceLimit();
    limit.recordSpend(new BigNumber(10), hour(10));

    // When
    const atPlus23 = limit.spent(hour(33));
    const atPlus24 = limit.spent(hour(34));

    // Then
    expect(atPlus23).toEqual(new BigNumber(10));
    expect(atPlus24).toEqual(new BigNumber(0));
  });

  it("should apply setQuantity decrease, equal, increase, and pending replacement", () => {
    // Given
    const delay = TokenBalanceLimit.INCREASE_DELAY_MS;
    const classLimit = new BigNumber(100);

    const decreased = new TokenBalanceLimit();
    decreased.setQuantity(new BigNumber(100), now, classLimit);

    const equal = new TokenBalanceLimit();
    equal.setQuantity(new BigNumber(100), now, classLimit);

    const increased = new TokenBalanceLimit();
    increased.setQuantity(new BigNumber(100), now, classLimit);

    const replaced = new TokenBalanceLimit();
    replaced.setQuantity(new BigNumber(100), now, classLimit);
    replaced.setQuantity(new BigNumber(200), now, classLimit);

    // When
    decreased.setQuantity(new BigNumber(50), now, classLimit);
    equal.setQuantity(new BigNumber(100), now, classLimit);
    increased.setQuantity(new BigNumber(150), now, classLimit);
    replaced.setQuantity(new BigNumber(150), now + 1, classLimit);

    // Then
    expect(decreased.quantity).toEqual(new BigNumber(50));
    expect(decreased.pendingQuantity).toBeUndefined();
    expect(equal.quantity).toEqual(new BigNumber(100));
    expect(equal.pendingQuantity).toBeUndefined();
    expect(increased.quantity).toEqual(new BigNumber(100));
    expect(increased.pendingQuantity).toEqual(new BigNumber(150));
    expect(increased.pendingAppliesAt).toEqual(now + delay);
    expect(replaced.quantity).toEqual(new BigNumber(100));
    expect(replaced.pendingQuantity).toEqual(new BigNumber(150));
    expect(replaced.pendingAppliesAt).toEqual(now + 1 + delay);
  });

  it("should promote a due pending limit when spent is queried", () => {
    // Given
    const delay = TokenBalanceLimit.INCREASE_DELAY_MS;
    const limit = new TokenBalanceLimit();
    limit.setQuantity(new BigNumber(100), now, undefined);
    limit.setQuantity(new BigNumber(200), now, undefined);

    // When
    limit.spent(now + delay);

    // Then
    expect(limit.quantity).toEqual(new BigNumber(200));
    expect(limit.pendingQuantity).toBeUndefined();
    expect(limit.pendingAppliesAt).toBeUndefined();
  });

  it("should reject spend when currentTime is earlier than lastHour", () => {
    // Given
    const limit = new TokenBalanceLimit();
    limit.recordSpend(new BigNumber(1), hour(10));

    // When
    const error = () => limit.recordSpend(new BigNumber(1), hour(9));

    // Then
    expect(error).toThrow("Token balance limit time went backwards");
  });
});
