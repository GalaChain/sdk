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
});
