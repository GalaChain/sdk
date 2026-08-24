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
import { TokenBalanceTargets } from "./TokenBalanceTargets";
import { UserAlias } from "./UserAlias";

const alice = "client|alice" as UserAlias;
const bob = "client|bob" as UserAlias;
const now = 1_000_000;
const delay = TokenBalanceTargets.CHANGE_DELAY_MS;

function emptyTargets() {
  return new TokenBalanceTargets();
}

function emptyBalance() {
  return new TokenBalance({
    collection: "test-collection",
    category: "test-category",
    type: "test-type",
    additionalKey: "test-additional-key",
    owner: "client|user1" as UserAlias
  });
}

describe("TokenBalanceTargets", () => {
  it("should allow any target when allowed is undefined", () => {
    // Given
    const targets = emptyTargets();

    // When
    const aliceOk = targets.allows(alice, now);
    const burnOk = targets.allows("burn", now);

    // Then
    expect(aliceOk).toEqual(true);
    expect(burnOk).toEqual(true);
  });

  it("should reject transfers when frozen", () => {
    // Given
    const targets = emptyTargets();

    // When
    targets.freeze();

    // Then
    expect(targets.allowed).toEqual([]);
    expect(targets.allows(alice, now)).toEqual(false);
    expect(targets.allows("burn", now)).toEqual(true);
  });

  it("should delay restrict until the delay elapses", () => {
    // Given
    const targets = emptyTargets();

    // When
    targets.restrict([alice], now);

    // Then
    expect(targets.allowed).toBeUndefined();
    expect(targets.pendingAllowed).toEqual([alice]);
    expect(targets.pendingAppliesAt).toEqual(now + delay);
    expect(targets.allows(bob, now + delay - 1)).toEqual(true);
    expect(targets.allows(bob, now + delay)).toEqual(false);
    expect(targets.allows(alice, now + delay)).toEqual(true);
    expect(targets.allowed).toEqual([alice]);
    expect(targets.pendingAllowed).toBeUndefined();
    expect(targets.pendingAppliesAt).toBeUndefined();
  });

  it("should not allow burn when restricted to aliases", () => {
    // Given
    const targets = emptyTargets();
    targets.restrict([alice], now);

    // When
    const beforeDelay = targets.allows("burn", now + delay - 1);
    const afterDelay = targets.allows("burn", now + delay);

    // Then
    expect(beforeDelay).toEqual(true);
    expect(afterDelay).toEqual(false);
  });

  it("should delay allow-all until the delay elapses", () => {
    // Given
    const targets = emptyTargets();
    targets.restrict([alice], now);
    targets.allows(alice, now + delay);

    // When
    targets.allowAll(now + delay);

    // Then
    expect(targets.allowed).toEqual([alice]);
    expect(targets.pendingAllowAll).toEqual(true);
    expect(targets.pendingAppliesAt).toEqual(now + delay + delay);
    expect(targets.allows(bob, now + delay + delay - 1)).toEqual(false);
    expect(targets.allows(bob, now + delay + delay)).toEqual(true);
    expect(targets.allowed).toBeUndefined();
    expect(targets.pendingAllowAll).toBeUndefined();
  });

  it("should freeze immediately and clear pending restrict", () => {
    // Given
    const targets = emptyTargets();
    targets.restrict([alice], now);

    // When
    targets.freeze();

    // Then
    expect(targets.allowed).toEqual([]);
    expect(targets.pendingAllowed).toBeUndefined();
    expect(targets.pendingAllowAll).toBeUndefined();
    expect(targets.pendingAppliesAt).toBeUndefined();
    expect(targets.allows(alice, now)).toEqual(false);
    expect(targets.allows(alice, now + delay)).toEqual(false);
    expect(targets.allows("burn", now)).toEqual(true);
  });

  it("should freeze immediately and clear pending allow-all", () => {
    // Given
    const targets = emptyTargets();
    targets.restrict([alice], now);
    targets.allows(alice, now + delay);
    targets.allowAll(now + delay);

    // When
    targets.freeze();

    // Then
    expect(targets.allowed).toEqual([]);
    expect(targets.pendingAllowed).toBeUndefined();
    expect(targets.pendingAllowAll).toBeUndefined();
    expect(targets.pendingAppliesAt).toBeUndefined();
    expect(targets.allows(alice, now + delay + delay)).toEqual(false);
  });

  it("should replace a pending restrict and restart the delay", () => {
    // Given
    const targets = emptyTargets();
    targets.restrict([alice], now);

    // When
    targets.restrict([bob], now + 1);

    // Then
    expect(targets.allowed).toBeUndefined();
    expect(targets.pendingAllowed).toEqual([bob]);
    expect(targets.pendingAppliesAt).toEqual(now + 1 + delay);
  });

  it("should keep a frozen wallet frozen until a pending restrict elapses", () => {
    // Given
    const targets = emptyTargets();
    targets.freeze();

    // When
    targets.restrict([alice], now);

    // Then
    expect(targets.allowed).toEqual([]);
    expect(targets.allows(alice, now + delay - 1)).toEqual(false);
    expect(targets.allows(alice, now + delay)).toEqual(true);
    expect(targets.allowed).toEqual([alice]);
  });

  it("should replace a pending restrict with pending allow-all and restart the delay", () => {
    // Given
    const targets = emptyTargets();
    targets.restrict([alice], now);

    // When
    targets.allowAll(now + 1);

    // Then
    expect(targets.pendingAllowed).toBeUndefined();
    expect(targets.pendingAllowAll).toEqual(true);
    expect(targets.pendingAppliesAt).toEqual(now + 1 + delay);
  });

  it("should reject restrict with an empty list", () => {
    // Given
    const targets = emptyTargets();

    // When
    const error = () => targets.restrict([], now);

    // Then
    expect(error).toThrow("must be non-empty");
  });

  it("should copy the restrict list so later mutation of the input is ignored", () => {
    // Given
    const targets = emptyTargets();
    const input = [alice];

    // When
    targets.restrict(input, now);
    input.push(bob);

    // Then
    expect(targets.pendingAllowed).toEqual([alice]);
  });

  it("should clear incomplete pending target fields", () => {
    // Given
    const appliesAtOnly = emptyTargets();
    appliesAtOnly.pendingAppliesAt = now + delay;
    const listOnly = emptyTargets();
    listOnly.pendingAllowed = [alice];
    const bothKinds = emptyTargets();
    bothKinds.pendingAllowed = [alice];
    bothKinds.pendingAllowAll = true;
    bothKinds.pendingAppliesAt = now + delay;

    // When
    appliesAtOnly.allows(alice, now);
    listOnly.allows(alice, now);
    bothKinds.allows(alice, now);

    // Then
    expect(appliesAtOnly.pendingAppliesAt).toBeUndefined();
    expect(listOnly.pendingAllowed).toBeUndefined();
    expect(bothKinds.pendingAllowed).toBeUndefined();
    expect(bothKinds.pendingAllowAll).toBeUndefined();
    expect(bothKinds.pendingAppliesAt).toBeUndefined();
  });

  it("should promote a due pending restrict when allows is queried", () => {
    // Given
    const targets = emptyTargets();
    targets.restrict([alice], now);

    // When
    targets.allows(alice, now + delay);

    // Then
    expect(targets.allowed).toEqual([alice]);
    expect(targets.pendingAllowed).toBeUndefined();
    expect(targets.pendingAppliesAt).toBeUndefined();
  });
});

describe("TokenBalance targets", () => {
  it("should allow any target when targets is undefined", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));

    // When
    balance.subtractQuantity(new BigNumber(10), now, undefined, alice);
    balance.subtractQuantity(new BigNumber(10), now, undefined, "burn");

    // Then
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(80));
    expect(balance.targets).toBeUndefined();
  });

  it("should reject transfers when frozen", () => {
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
    expect(balance.targets?.allowed).toEqual([]);
  });

  it("should reject restrict on an NFT balance", () => {
    // Given
    const balance = emptyBalance();
    balance.addInstance(new BigNumber(1));

    // When
    const error = () => balance.restrictTargets([alice], now);

    // Then
    expect(error).toThrow("FT-specific operation");
  });

  it("should apply pending restrict after delay during subtract", () => {
    // Given
    const balance = emptyBalance();
    balance.addQuantity(new BigNumber(100));
    balance.restrictTargets([alice], now);

    // When
    const beforeDelay = () => balance.subtractQuantity(new BigNumber(10), now + delay - 1, undefined, bob);
    const atDelay = () => balance.subtractQuantity(new BigNumber(10), now + delay, undefined, bob);

    // Then
    expect(beforeDelay).not.toThrow();
    expect(atDelay).toThrow("not allowed");
    expect(balance.targets?.allowed).toEqual([alice]);
  });

  it("should deserialize nested targets and enforce them", async () => {
    // Given
    const json = JSON.stringify({
      owner: "client|user1",
      collection: "test-collection",
      category: "test-category",
      type: "test-type",
      additionalKey: "test-additional-key",
      quantity: "100",
      targets: { allowed: [] }
    });
    const balance = TokenBalance.deserialize<TokenBalance>(TokenBalance, json);

    // When
    await balance.validateOrReject();
    const transfer = () => balance.subtractQuantity(new BigNumber(10), now, undefined, alice);
    balance.subtractQuantity(new BigNumber(10), now, undefined, "burn");

    // Then
    expect(transfer).toThrow("not allowed");
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(90));
  });
});
