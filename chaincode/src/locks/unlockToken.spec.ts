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
import { GalaChainResponse, TokenHold, UnlockTokenDto, createValidSubmitDTO } from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { UnlockForbiddenUserError } from "./LockError";

describe("UnlockToken", () => {
  test(`UnlockToken removes a "lock" hold from a user's GalaChainTokenBalance`, async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const balanceNoLockedHolds = nft.tokenBalance();
    expect(balanceNoLockedHolds.getNftInstanceIds()).toContainEqual(nftInstance.instance);

    const balanceWithLockedHold = balanceNoLockedHolds.copy();
    balanceWithLockedHold.lockInstance(
      new TokenHold({
        createdBy: users.testUser1.identityKey,
        instanceId: nftInstance.instance,
        quantity: new BigNumber("1"),
        created: 1,
        expires: 0
      }),
      1
    );

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(nftClass, nftInstance, balanceWithLockedHold);

    const dto = await createValidSubmitDTO(UnlockTokenDto, { tokenInstance: nftInstanceKey }).signed(
      users.testUser1.privateKey
    );

    // When
    const response = await contract.UnlockToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(balanceNoLockedHolds));
    expect(getWrites()).toEqual(writesMap(balanceNoLockedHolds));
  });

  test("NFT unlocks for Token Authority", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const balanceNoLockedHolds = nft.tokenBalance();
    expect(balanceNoLockedHolds.getNftInstanceIds()).toContainEqual(nftInstance.instance);

    const balanceWithLockedHold = balanceNoLockedHolds.copy();
    balanceWithLockedHold.lockInstance(
      new TokenHold({
        createdBy: users.testUser1.identityKey,
        instanceId: nftInstance.instance,
        quantity: new BigNumber("1"),
        created: 1,
        expires: 0
      }),
      1
    );

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(nftClass, nftInstance, balanceWithLockedHold);

    const dto = await createValidSubmitDTO(UnlockTokenDto, { tokenInstance: nftInstanceKey }).signed(
      users.admin.privateKey
    );

    expect(balanceWithLockedHold.getUnexpiredLockedHolds(0)[0].createdBy).toEqual(
      users.testUser1.identityKey
    );
    expect(users.admin.identityKey).not.toEqual(users.testUser1.identityKey);
    expect(nftClass.authorities).toContain(users.admin.identityKey);

    // When
    const response = await contract.UnlockToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(balanceNoLockedHolds));
    expect(getWrites()).toEqual(writesMap(balanceNoLockedHolds));
  });

  test("NFT unlocks for Token Authority with named locked hold", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const lockedHoldName = "some test locked hold name";

    const balanceNoLockedHolds = nft.tokenBalance();
    expect(balanceNoLockedHolds.getNftInstanceIds()).toContainEqual(nftInstance.instance);

    const balanceWithLockedHold = balanceNoLockedHolds.copy();
    balanceWithLockedHold.lockInstance(
      new TokenHold({
        createdBy: users.testUser1.identityKey,
        instanceId: nftInstance.instance,
        quantity: new BigNumber("1"),
        created: 1,
        expires: 0,
        name: lockedHoldName
      }),
      1
    );

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(nftClass, nftInstance, balanceWithLockedHold);

    const dto = await createValidSubmitDTO(UnlockTokenDto, {
      tokenInstance: nftInstanceKey,
      lockedHoldName: lockedHoldName
    }).signed(users.admin.privateKey);

    // When
    const response = await contract.UnlockToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(balanceNoLockedHolds));
    expect(getWrites()).toEqual(writesMap(balanceNoLockedHolds));
  });

  test("Fungible unlocks for Token Authority", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const balanceNoLockedHolds = currency.tokenBalance();

    const testLockedHoldName = "some test locked hold name";

    const balanceWithLockedHold = balanceNoLockedHolds.copy();
    balanceWithLockedHold.lockQuantity(
      new TokenHold({
        createdBy: users.testUser1.identityKey,
        lockAuthority: users.testUser1.identityKey,
        instanceId: currencyInstance.instance,
        quantity: new BigNumber("1"),
        created: 1,
        expires: 0,
        name: testLockedHoldName
      })
    );

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(currencyClass, currencyInstance, balanceWithLockedHold);

    const dto = await createValidSubmitDTO(UnlockTokenDto, {
      tokenInstance: currencyInstanceKey,
      quantity: new BigNumber("1"),
      lockedHoldName: testLockedHoldName,
      owner: users.testUser1.identityKey
    }).signed(users.admin.privateKey);

    // When
    const response = await contract.UnlockToken(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(balanceNoLockedHolds));
    expect(getWrites()).toEqual(writesMap(balanceNoLockedHolds));
  });

  test("prevents users.attacker's attempt to unlock owner's token", async () => {
    /* UnlockToken appears to allow malicious users to unlock any token - no owner check.
            implemented business logic for authorization:
              you are the owner on the balance. you can remove the hold.
              you are the creator of the token hold. you can remove the hold.
              you are a token authority on the TokenClass of the NFT. you can remove the hold.
              you are a bridge authority of a bridge for the TokenClass. You can remove the hold.
              otherwise you can't remove the hold.
        */

    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const ownerBalance = nft.tokenBalance();
    expect(ownerBalance.getNftInstanceIds()).toContainEqual(nftInstance.instance);
    ownerBalance.lockInstance(
      new TokenHold({
        createdBy: users.testUser1.identityKey,
        instanceId: nftInstance.instance,
        quantity: new BigNumber("1"),
        created: 1,
        expires: 0
      }),
      1
    );

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.attacker)
      .savedState(nftClass, nftInstance, ownerBalance);

    const dto = await createValidSubmitDTO(UnlockTokenDto, { tokenInstance: nftInstanceKey }).signed(
      users.attacker.privateKey
    );

    // When
    const response = await contract.UnlockToken(ctx, dto); // handled by @GalaTransaction decorator which is mocked out

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new UnlockForbiddenUserError(users.attacker.identityKey, nftInstanceKey.toStringKey())
      )
    );
    expect(getWrites()).toEqual({});
  });
});
