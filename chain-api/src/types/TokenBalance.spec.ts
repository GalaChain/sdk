import BigNumber from "bignumber.js";

import { TokenBalance, TokenHold } from "./TokenBalance";
import { TokenClassKey } from "./TokenClass";
import { TokenInstance } from "./TokenInstance";
import { UserAlias } from "./UserAlias";

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

function emptyBalance() {
  return new TokenBalance({
    collection: "test-collection",
    category: "test-category",
    type: "test-type",
    additionalKey: "test-additional-key",
    owner: "client|user1" as UserAlias
  });
}

function createHold(instance: BigNumber, expires: number, quantity?: BigNumber, name?: string) {
  return new TokenHold({
    createdBy: "client|user1" as UserAlias,
    instanceId: instance,
    quantity: quantity ?? new BigNumber(1),
    created: 1,
    expires: expires,
    name: name
  });
}

describe("fungible", () => {
  it("should add quantity", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addQuantity(new BigNumber(1));

    // Then
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(1));
  });

  it("should fail to add quantity if balance contains NFT instances", () => {
    // Given
    const balance = emptyBalance();
    balance.addInstance(new BigNumber(1));

    // When
    const error = () => balance.addQuantity(new BigNumber(1));

    // Then
    expect(error).toThrow("Attempted to perform FT-specific operation on balance containing NFT instances");
  });

  it("should fail to add quantity if quantity is invalid", () => {
    // Given
    const balance = emptyBalance();

    // When
    const error = () => balance.addQuantity(new BigNumber(-1));

    // Then
    expect(error).toThrow("FT quantity must be positive");
  });

  it("should subtract quantity", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addQuantity(new BigNumber(1));
    balance.subtractQuantity(new BigNumber(1), Date.now());

    // Then
    expect(balance.getQuantityTotal()).toEqual(new BigNumber(0));
  });

  it("should fail to subtract quantity if balance is insufficient", () => {
    // Given
    const balance = emptyBalance();

    // When
    const error = () => balance.subtractQuantity(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("Insufficient balance");
  });

  it("should fail to subtract quantity if balance contains NFT instances", () => {
    // Given
    const balance = emptyBalance();
    balance.addInstance(new BigNumber(1));

    // When
    const error = () => balance.subtractQuantity(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("Attempted to perform FT-specific operation on balance containing NFT instances");
  });

  it("should fail to subtract quantity if quantity is invalid", () => {
    // Given
    const balance = emptyBalance();

    // When
    const error = () => balance.subtractQuantity(new BigNumber(-1), Date.now());

    // Then
    expect(error).toThrow("FT quantity must be positive");
  });

  it("should fail to subtract quantity if quantity is locked by TokenHold", () => {
    // Given
    const balance = emptyBalance();
    const hold = createHold(TokenInstance.FUNGIBLE_TOKEN_INSTANCE, 0, new BigNumber(10));

    balance.addQuantity(new BigNumber(10));
    balance.lockQuantity(hold);

    // When
    const error = () => balance.subtractQuantity(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("Insufficient balance");
  });

  it("should successfully subtract quantity if the total is only partially locked", () => {
    // Given
    const initialTotal = new BigNumber(10);
    const lockedTotal = new BigNumber(5);
    const subtractTotal = new BigNumber(1);

    const balance = emptyBalance();
    const hold = createHold(TokenInstance.FUNGIBLE_TOKEN_INSTANCE, 0, lockedTotal);

    balance.addQuantity(initialTotal);
    balance.lockQuantity(hold);

    // When
    balance.subtractQuantity(subtractTotal, Date.now());

    // Then
    expect(balance.getQuantityTotal()).toEqual(initialTotal.minus(subtractTotal));
    expect(balance.getLockedQuantityTotal(Date.now())).toEqual(lockedTotal);
    expect(balance.getSpendableQuantityTotal(Date.now())).toEqual(
      initialTotal.minus(lockedTotal).minus(subtractTotal)
    );
  });

  it("should unlock TokenHold quantities from the balance", () => {
    // Given
    const initialTotal = new BigNumber(10);
    const lockedTotal = new BigNumber(10);
    const subtractTotal = new BigNumber(1);

    const balance = emptyBalance();
    const hold = createHold(TokenInstance.FUNGIBLE_TOKEN_INSTANCE, 0, lockedTotal);

    balance.addQuantity(initialTotal);
    balance.lockQuantity(hold);

    // When
    balance.unlockQuantity(lockedTotal, Date.now());
    balance.subtractQuantity(subtractTotal, Date.now());

    // Then
    expect(balance.getQuantityTotal()).toEqual(initialTotal.minus(subtractTotal));
    expect(balance.getLockedQuantityTotal(Date.now())).toEqual(new BigNumber("0"));
    expect(balance.getSpendableQuantityTotal(Date.now())).toEqual(initialTotal.minus(subtractTotal));
  });

  it("should fail to unlock a TokenHold Quantity with mismatched name", () => {
    // Given
    const initialTotal = new BigNumber(10);
    const lockedTotal = new BigNumber(10);

    const balance = emptyBalance();
    const nameForHold = "client|someone-else";
    const nameForUnlockAttempt = undefined;
    const hold = createHold(TokenInstance.FUNGIBLE_TOKEN_INSTANCE, 0, lockedTotal, nameForHold);

    balance.addQuantity(initialTotal);
    balance.lockQuantity(hold);

    const tokenClassKey = TokenClassKey.toStringKey({ ...balance });
    // When
    const error = () => balance.unlockQuantity(lockedTotal, Date.now(), nameForUnlockAttempt);

    // Then
    expect(error).toThrow(
      `Failed to unlock quantity ${lockedTotal} of Fungible token ${tokenClassKey} ` +
        `for TokenHold.name = ${nameForUnlockAttempt}.`
    );
  });

  it("should unlock quantity by using TokenHolds that will expire soonest", () => {
    // Given
    const initialTotal = new BigNumber(10);
    const quantityLockedPerHold = new BigNumber(1);

    const noExpirationTimestamp = 0;
    const expiresIn30MinutesTimestamp = Date.now() + 1000 * 60 * 30;
    const expiresIn30DaysTimestamp = Date.now() + 1000 * 60 * 60 * 24 * 30;

    const balance = emptyBalance();
    const holds = [
      createHold(
        TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
        noExpirationTimestamp,
        quantityLockedPerHold,
        undefined
      ),
      createHold(
        TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
        expiresIn30DaysTimestamp,
        quantityLockedPerHold,
        undefined
      ),
      createHold(
        TokenInstance.FUNGIBLE_TOKEN_INSTANCE,
        expiresIn30MinutesTimestamp,
        quantityLockedPerHold,
        undefined
      )
    ];

    balance.addQuantity(initialTotal);

    holds.forEach((hold) => {
      balance.lockQuantity(hold);
    });

    const lockedTotal = quantityLockedPerHold.times(holds.length);
    // When
    balance.unlockQuantity(quantityLockedPerHold, Date.now());
    const unexpiredLockedHolds = balance.getUnexpiredLockedHolds(Date.now());

    // Then
    expect(balance.getLockedQuantityTotal(Date.now())).toEqual(lockedTotal.minus(quantityLockedPerHold));
    expect(unexpiredLockedHolds.length).toBe(2);
    expect(unexpiredLockedHolds[0].expires).toBe(expiresIn30DaysTimestamp);
    expect(unexpiredLockedHolds[1].expires).toBe(noExpirationTimestamp);
  });

  it("should support partial unlocks across multiple TokenHolds", () => {
    // Given
    const initialTotal = new BigNumber(10);
    const quantityLockedPerHold = new BigNumber(5);
    const quantityToUnlock = new BigNumber(7);

    const balance = emptyBalance();
    const holds = [
      createHold(TokenInstance.FUNGIBLE_TOKEN_INSTANCE, 0, quantityLockedPerHold, undefined),
      createHold(TokenInstance.FUNGIBLE_TOKEN_INSTANCE, 0, quantityLockedPerHold, undefined)
    ];

    balance.addQuantity(initialTotal);

    holds.forEach((hold) => {
      balance.lockQuantity(hold);
    });

    const expectedTotalLockedInitially = quantityLockedPerHold.times(holds.length);
    const totalLockedInitially = balance.getLockedQuantityTotal(Date.now());
    const expectedQuantityToRemainLocked = expectedTotalLockedInitially.minus(quantityToUnlock);
    const expectedHoldsRemainingOnBalance = quantityToUnlock.dividedToIntegerBy(quantityLockedPerHold);

    // When
    balance.unlockQuantity(quantityToUnlock, Date.now());
    const remainingLockedQuantity = balance.getLockedQuantityTotal(Date.now());
    const unexpiredLockedHolds = balance.getUnexpiredLockedHolds(Date.now());

    // Then
    expect(totalLockedInitially.toNumber()).toEqual(expectedTotalLockedInitially.toNumber());
    expect(remainingLockedQuantity.toNumber()).toEqual(expectedQuantityToRemainLocked.toNumber());
    expect(unexpiredLockedHolds.length).toBe(expectedHoldsRemainingOnBalance.toNumber());
  });
});

describe("non-fungible", () => {
  it("should add nft instance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.addInstance(new BigNumber(2));

    // Then
    expect(balance.getNftInstanceCount()).toEqual(2);
  });

  it("should fail to add nft instance if instance already exists", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));

    const error = () => balance.addInstance(new BigNumber(1));

    // Then
    expect(error).toThrow("already exists in balance");
  });

  it("should fail to add nft instance if instance id is invalid", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));

    const errorZero = () => balance.addInstance(new BigNumber(0));
    const errorNegative = () => balance.addInstance(new BigNumber(0));
    const errorDecimal = () => balance.addInstance(new BigNumber(0));

    // Then
    expect(errorZero).toThrow("Instance ID must be positive integer");
    expect(errorNegative).toThrow("Instance ID must be positive integer");
    expect(errorDecimal).toThrow("Instance ID must be positive integer");
  });

  it("should remove nft instance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.removeInstance(new BigNumber(1), Date.now());

    // Then
    expect(balance.getNftInstanceCount()).toEqual(0);
  });

  it("should fail to remove nft instance not in balance", () => {
    // Given
    const balance = emptyBalance();

    // When
    const error = () => balance.removeInstance(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("not found in balance");
  });

  it("should fail to remove locked nft instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.lockInstance(unexpiredHold, Date.now());
    const error = () => balance.removeInstance(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("is locked");
  });

  it("should fail to remove in use nft instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.useInstance(unexpiredHold, Date.now());
    const error = () => balance.removeInstance(new BigNumber(1), Date.now());

    // Then
    expect(error).toThrow("is in use");
  });

  it("should lock instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.lockInstance(unexpiredHold, Date.now());

    // Then
    expect(balance).toEqual(
      expect.objectContaining({
        lockedHolds: [unexpiredHold]
      })
    );
  });

  it("should use instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.useInstance(unexpiredHold, Date.now());

    // Then
    expect(balance).toEqual(
      expect.objectContaining({
        inUseHolds: [unexpiredHold]
      })
    );
  });

  it("should fail to lock instance for non-nft instanceId", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(0), 0);
    const balance = emptyBalance();

    // When
    balance.addQuantity(new BigNumber(0));
    const error = () => balance.lockInstance(unexpiredHold, Date.now());

    // Then
    expect(error).toThrow("Instance ID must be positive integer");
  });

  it("should fail to use instance for non-nft instanceId", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(0), 0);
    const balance = emptyBalance();

    // When
    balance.addQuantity(new BigNumber(0));
    const error = () => balance.useInstance(unexpiredHold, Date.now());

    // Then
    expect(error).toThrow("Instance ID must be positive integer");
  });

  it("should fail to lock instance not in balance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    const error = () => balance.lockInstance(unexpiredHold, Date.now());

    // Then
    expect(error).toThrow("not found in balance");
  });

  it("should fail to use instance not in balance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    const error = () => balance.useInstance(unexpiredHold, Date.now());

    // Then
    expect(error).toThrow("not found in balance");
  });

  it("should fail to lock in use instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.useInstance(unexpiredHold, Date.now());
    const error = () => balance.lockInstance(unexpiredHold, Date.now());

    // Then
    expect(error).toThrow("is in use");
  });

  it("should fail to use instance already in use", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.useInstance(unexpiredHold, Date.now());
    const error = () => balance.useInstance(unexpiredHold, Date.now());

    // Then
    expect(error).toThrow("is in use");
  });

  it("should fail to lock already locked instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.lockInstance(unexpiredHold, Date.now());
    const error = () => balance.lockInstance(unexpiredHold, Date.now());

    // Then
    expect(error).toThrow("is locked");
  });

  it("should fail to use locked instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.lockInstance(unexpiredHold, Date.now());
    const error = () => balance.useInstance(unexpiredHold, Date.now());

    // Then
    expect(error).toThrow("is locked");
  });

  it("should unlock locked instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.lockInstance(unexpiredHold, Date.now());
    balance.unlockInstance(new BigNumber(1), undefined, Date.now());

    // Then
    expect(balance).toEqual(
      expect.objectContaining({
        lockedHolds: []
      })
    );
  });

  it("should fail to unlock already unlocked instance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    const error = () => balance.unlockInstance(new BigNumber(1), undefined, Date.now());

    // Then
    expect(error).toThrow("is not locked");
  });

  it("should release in use instance", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.useInstance(unexpiredHold, Date.now());
    balance.releaseInstance(new BigNumber(1), undefined, Date.now());

    // Then
    expect(balance).toEqual(
      expect.objectContaining({
        inUseHolds: []
      })
    );
  });

  it("should fail to release instance not in use", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    const error = () => balance.releaseInstance(new BigNumber(1), undefined, Date.now());

    // Then
    expect(error).toThrow("is not in use");
  });

  it("should find locked hold", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.lockInstance(unexpiredHold, Date.now());

    const foundHold = balance.findLockedHold(new BigNumber(1), undefined, Date.now());

    // Then
    expect(foundHold).toEqual(unexpiredHold);
  });

  it("should find in use hold", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.useInstance(unexpiredHold, Date.now());

    const foundHold = balance.findInUseHold(new BigNumber(1), Date.now());

    // Then
    expect(foundHold).toEqual(unexpiredHold);
  });

  it("should detect nft instance ids contained in balance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));

    const containsNft = balance.containsAnyNftInstanceId();

    // Then
    expect(containsNft).toEqual(true);
  });

  it("should be spendable if instance is in balance and free of holds", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));

    const isSpendable = balance.isInstanceSpendable(new BigNumber(1), Date.now());

    // Then
    expect(isSpendable).toEqual(true);
  });

  it("should not be spendable if instance is not in balance", () => {
    // Given
    const balance = emptyBalance();

    // When
    const notInBalance = balance.isInstanceSpendable(new BigNumber(1), Date.now());

    // Then
    expect(notInBalance).toEqual(false);
  });

  it("should not be spendable if instance is locked", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.lockInstance(unexpiredHold, Date.now());

    const notInBalance = balance.isInstanceSpendable(new BigNumber(1), Date.now());

    // Then
    expect(notInBalance).toEqual(false);
  });

  it("should not be spendable if instance is in use", () => {
    // Given
    const unexpiredHold = createHold(new BigNumber(1), 0);
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.useInstance(unexpiredHold, Date.now());

    const notInBalance = balance.isInstanceSpendable(new BigNumber(1), Date.now());

    // Then
    expect(notInBalance).toEqual(false);
  });

  it("should get correct instanceIds array from balance", () => {
    // Given
    const balance = emptyBalance();

    // When
    balance.addInstance(new BigNumber(1));
    balance.addInstance(new BigNumber(2));

    const instanceIds = balance.getNftInstanceIds();

    // Then
    expect(instanceIds).toEqual([new BigNumber(1), new BigNumber(2)]);
  });

  it("should clear holds", () => {
    // Given
    const hold6 = createHold(new BigNumber(6), 20);
    const hold7 = createHold(new BigNumber(7), 99);

    const balance = emptyBalance();
    balance.addInstance(new BigNumber(6));
    balance.addInstance(new BigNumber(7));
    balance.lockInstance(hold6, Date.now());
    balance.useInstance(hold7, Date.now());

    expect(balance).toEqual(
      expect.objectContaining({
        lockedHolds: [hold6],
        inUseHolds: [hold7]
      })
    );

    // Then
    balance.clearHolds(new BigNumber(1), 100);

    expect(balance).toEqual(
      expect.objectContaining({
        lockedHolds: [],
        inUseHolds: []
      })
    );
  });
});
