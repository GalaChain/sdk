/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import BigNumber from "bignumber.js";

import { TokenBalance } from "./TokenBalance";
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

const alice = "client|alice" as UserAlias;
const bob = "client|bob" as UserAlias;
const now = 1_000_000;
const delay = TokenBalance.TARGET_CHANGE_DELAY_MS;

describe("TokenBalance targets", () => {
  it("should allow any target when allowedTargets is undefined", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));

    // When
    balance.subtractQuantity(new BigNumber(10), now, undefined, alice);
    balance.subtractQuantity(new BigNumber(10), now, undefined, "burn");

    // Then
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(80));
  });

  it("should allow only burn when frozen", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.freezeTargets();

    // When
    const transfer = () => balance.subtractQuantity(new BigNumber(10), now, undefined, alice);
    balance.subtractQuantity(new BigNumber(10), now, undefined, "burn");

    // Then
    expect(transfer).toThrow("not allowed");
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(90));
    expect(balance.allowedTargets).toEqual([]);
  });

  it("should delay restrict until the delay elapses", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.restrictTargets([alice], now);

    // When
    const beforeDelay = () => balance.subtractQuantity(new BigNumber(10), now + delay - 1, undefined, bob);
    const atDelayWrong = () => balance.subtractQuantity(new BigNumber(10), now + delay, undefined, bob);
    const atDelayOk = () => balance.subtractQuantity(new BigNumber(10), now + delay, undefined, alice);

    // Then
    expect(balance.pendingAllowedTargets).toEqual([alice]);
    expect(balance.pendingTargetsAppliesAt).toEqual(now + delay);
    expect(beforeDelay).not.toThrow();
    expect(atDelayWrong).toThrow("not allowed");
    expect(atDelayOk).not.toThrow();
    expect(balance.allowedTargets).toEqual([alice]);
    expect(balance.pendingAllowedTargets).toBeUndefined();
  });

  it("should not allow burn when restricted to aliases", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.restrictTargets([alice], now);

    // When
    const burnBefore = () => balance.subtractQuantity(new BigNumber(10), now + delay - 1, undefined, "burn");
    const burnAfter = () => balance.subtractQuantity(new BigNumber(10), now + delay, undefined, "burn");

    // Then
    expect(burnBefore).not.toThrow();
    expect(burnAfter).toThrow("not allowed");
  });

  it("should delay allow-all until the delay elapses", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.restrictTargets([alice], now);
    balance.subtractQuantity(new BigNumber(1), now + delay, undefined, alice);
    balance.allowAllTargets(now + delay);

    // When
    const beforeDelay = () =>
      balance.subtractQuantity(new BigNumber(10), now + delay + delay - 1, undefined, bob);
    const atDelay = () => balance.subtractQuantity(new BigNumber(10), now + delay + delay, undefined, bob);

    // Then
    expect(beforeDelay).toThrow("not allowed");
    expect(atDelay).not.toThrow();
    expect(balance.allowedTargets).toBeUndefined();
    expect(balance.pendingAllowAll).toBeUndefined();
  });

  it("should freeze immediately and clear pending target changes", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.restrictTargets([alice], now);

    // When
    balance.freezeTargets();
    const transfer = () => balance.subtractQuantity(new BigNumber(10), now, undefined, alice);
    balance.subtractQuantity(new BigNumber(10), now, undefined, "burn");

    // Then
    expect(transfer).toThrow("not allowed");
    expect(balance.allowedTargets).toEqual([]);
    expect(balance.pendingAllowedTargets).toBeUndefined();
    expect(balance.pendingTargetsAppliesAt).toBeUndefined();
  });

  it("should replace a pending restrict and restart the delay", () => {
    // Given
    const balance = emptyBalance();
    balance.restrictTargets([alice], now);

    // When
    balance.restrictTargets([bob], now + 1);

    // Then
    expect(balance.allowedTargets).toBeUndefined();
    expect(balance.pendingAllowedTargets).toEqual([bob]);
    expect(balance.pendingTargetsAppliesAt).toEqual(now + 1 + delay);
  });

  it("should keep a frozen wallet frozen until a pending restrict elapses", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.freezeTargets();
    balance.restrictTargets([alice], now);

    // When
    const beforeDelay = () => balance.subtractQuantity(new BigNumber(10), now + delay - 1, undefined, alice);
    const atDelay = () => balance.subtractQuantity(new BigNumber(10), now + delay, undefined, alice);

    // Then
    expect(balance.allowedTargets).toEqual([]);
    expect(beforeDelay).toThrow("not allowed");
    expect(atDelay).not.toThrow();
    expect(balance.allowedTargets).toEqual([alice]);
  });

  it("should replace a pending restrict with pending allow-all and restart the delay", () => {
    // Given
    const balance = emptyBalance();
    balance.restrictTargets([alice], now);

    // When
    balance.allowAllTargets(now + 1);

    // Then
    expect(balance.pendingAllowedTargets).toBeUndefined();
    expect(balance.pendingAllowAll).toEqual(true);
    expect(balance.pendingTargetsAppliesAt).toEqual(now + 1 + delay);
  });

  it("should reject restrict with an empty list", () => {
    // Given
    const balance = emptyBalance();

    // When
    const error = () => balance.restrictTargets([], now);

    // Then
    expect(error).toThrow("must be non-empty");
  });

  it("should clear incomplete pending target fields", () => {
    // Given
    const appliesAtOnly = emptyBalance();
    appliesAtOnly.pendingTargetsAppliesAt = now + delay;
    const listOnly = emptyBalance();
    listOnly.pendingAllowedTargets = [alice];

    // When
    appliesAtOnly.subtractQuantity(new BigNumber(0), now, undefined, alice);
    listOnly.subtractQuantity(new BigNumber(0), now, undefined, alice);

    // Then
    expect(appliesAtOnly.pendingTargetsAppliesAt).toBeUndefined();
    expect(listOnly.pendingAllowedTargets).toBeUndefined();
  });
});
