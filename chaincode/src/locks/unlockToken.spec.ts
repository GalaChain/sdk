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
import { GalaChainResponse, TokenBalance, UnlockTokenDto, createValidDTO } from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { UnlockForbiddenUserError } from "./LockError";

describe("UnlockToken", () => {
  test(`UnlockToken removes a "lock" hold from a user's GalaChainTokenBalance`, async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const ownerBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1Id,
          instanceId: nftInstance.instance,
          quantity: new BigNumber("1"),
          created: 1,
          expires: 0
        }
      ]
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(nftClass, nftInstance, ownerBalance);

    const dto = await createValidDTO(UnlockTokenDto, {
      tokenInstance: nftInstanceKey
    });

    // When
    const response = await contract.UnlockToken(ctx, dto);

    // Then
    const balanceNoLockedHolds = plainToInstance(TokenBalance, { ...ownerBalance, lockedHolds: [] });
    expect(response).toEqual(GalaChainResponse.Success(balanceNoLockedHolds));
    expect(writes).toEqual(writesMap(balanceNoLockedHolds));
  });

  test("NFT unlocks for Token Authority", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const ownerBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1Id,
          instanceId: nftInstance.instance,
          quantity: new BigNumber("1"),
          created: 1,
          expires: 0
        }
      ]
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testAdminId)
      .savedState(nftClass, nftInstance, ownerBalance);

    const dto = await createValidDTO(UnlockTokenDto, {
      tokenInstance: nftInstanceKey
    });

    // When
    const response = await contract.UnlockToken(ctx, dto);

    // Then
    const balanceNoLockedHolds = plainToInstance(TokenBalance, { ...ownerBalance, lockedHolds: [] });
    expect(response).toEqual(GalaChainResponse.Success(balanceNoLockedHolds));
    expect(writes).toEqual(writesMap(balanceNoLockedHolds));
  });

  test("Fungible unlocks for Token Authority", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();

    const testLockedHoldName = "some test locked hold name";

    const ownerBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1Id,
          instanceId: currencyInstance.instance,
          quantity: new BigNumber("1"),
          created: 1,
          expires: 0,
          lockAuthority: users.testUser1Id,
          name: testLockedHoldName
        }
      ]
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testAdminId)
      .savedState(currencyClass, currencyInstance, ownerBalance);

    const dto = await createValidDTO(UnlockTokenDto, {
      tokenInstance: currencyInstanceKey,
      quantity: new BigNumber("1"),
      lockedHoldName: testLockedHoldName,
      owner: users.testUser1Id
    });

    // When
    const response = await contract.UnlockToken(ctx, dto);

    // Then
    const balanceNoLockedHolds = plainToInstance(TokenBalance, { ...ownerBalance, lockedHolds: [] });
    expect(response).toEqual(GalaChainResponse.Success(balanceNoLockedHolds));
    expect(writes).toEqual(writesMap(balanceNoLockedHolds));
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
    const ownerBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1Id,
          instanceId: nftInstance.instance,
          quantity: new BigNumber("1"),
          created: 1,
          expires: 0
        }
      ]
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.attacker)
      .savedState(nftClass, nftInstance, ownerBalance);

    const dto = await createValidDTO(UnlockTokenDto, {
      tokenInstance: nftInstanceKey
    });

    // When
    const response = await contract.UnlockToken(ctx, dto); // handled by @GalaTransaction decorator which is mocked out

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new UnlockForbiddenUserError(users.attacker, nftInstanceKey.toStringKey()))
    );
    expect(writes).toEqual({});
  });

  test("UnlockToken function unlocks for BridgeOuts executed by Bridge authorities", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const ownerBalance = plainToInstance(TokenBalance, {
      ...nft.tokenBalance(),
      lockedHolds: [
        {
          createdBy: users.testUser1Id,
          instanceId: nftInstance.instance,
          quantity: new BigNumber("1"),
          created: 1,
          expires: 0
        }
      ]
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testAdminId)
      .savedState(nftClass, nftInstance, ownerBalance);

    const dto = await createValidDTO(UnlockTokenDto, {
      tokenInstance: nftInstanceKey
    });

    const response = await contract.UnlockToken(ctx, dto);

    expect(response).toEqual(
      GalaChainResponse.Success(plainToInstance(TokenBalance, { ...ownerBalance, lockedHolds: [] }))
    );
    expect(writes).toEqual(writesMap(plainToInstance(TokenBalance, { ...ownerBalance, lockedHolds: [] })));
  });
});
