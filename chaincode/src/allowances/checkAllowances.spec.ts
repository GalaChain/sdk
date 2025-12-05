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
import { AllowanceType, TokenAllowance, TokenBalance } from "@gala-chain/api";
import { currency, fixture, nft, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { checkAllowances, cleanAllowances, isAllowanceExpired } from "./checkAllowances";

describe("checkAllowances", () => {
  it("should not count expired allowances", async () => {
    const checkAllowancesFixture = fixture(GalaChainTokenContract);

    const { ctx } = checkAllowancesFixture;
    ctx.callingUserData = {
      alias: users.admin.identityKey,
      ethAddress: users.admin.ethAddress,
      roles: users.admin.roles,
      signedBy: [users.admin.identityKey],
      signatureQuorum: 1,
      allowedSigners: [users.admin.identityKey],
      isMultisig: false
    };

    const txTime = ctx.txUnixTime;

    const expiredTime = txTime - 1000 * 60 * 60;
    const futureTime = txTime + 1000 * 60 * 60;
    const neverExpires = 0;

    const timelessAllowance = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(txTime),
      expires: neverExpires
    });

    const futureExpirationAllowance = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(txTime),
      expires: futureTime
    });

    const expiredAllowance = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(txTime),
      expires: expiredTime
    });

    const applicableAllowances: TokenAllowance[] = [
      timelessAllowance,
      futureExpirationAllowance,
      expiredAllowance
    ];

    checkAllowancesFixture.savedState(...applicableAllowances);

    const defaultAllowanceType = applicableAllowances[0].allowanceType;

    let allAllowancesTotal = new BigNumber(0);
    let expiredTotal = new BigNumber(0);

    for (const allowance of applicableAllowances) {
      // quantitySpent could be undefined
      const quantitySpent = allowance.quantitySpent ?? new BigNumber("0");
      const allowanceQuantity = allowance.quantity.minus(quantitySpent);

      allAllowancesTotal = allAllowancesTotal.plus(allowanceQuantity);

      if (allowance.expires !== 0 && allowance.expires < txTime) {
        expiredTotal = expiredTotal.plus(allowanceQuantity);
      }
    }

    const expectedTotal = allAllowancesTotal.minus(expiredTotal);

    const totalAllowance: BigNumber = await checkAllowances(
      ctx,
      applicableAllowances,
      currency.tokenInstanceKey(),
      defaultAllowanceType,
      ctx.callingUser
    );

    expect(totalAllowance.toNumber()).toBe(expectedTotal.toNumber());
    expect(expiredTotal.toNumber()).not.toBe(0);
    expect(totalAllowance.toNumber()).not.toBe(0);
  });
});

describe("isAllowanceExpired", () => {
  it("should support allowances that never expire by a 0 timestamp value", () => {
    const { ctx } = fixture(GalaChainTokenContract);

    const neverExpires = 0;

    const applicableAllowance: TokenAllowance = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(ctx.txUnixTime - 2000),
      expires: neverExpires
    });

    expect(isAllowanceExpired(ctx, applicableAllowance)).toBe(false);
  });

  it("should return false for an allowance with an expiration timestamp in the future", () => {
    const { ctx } = fixture(GalaChainTokenContract);

    const txTime = ctx.txUnixTime;
    const futureTime = txTime + 1000 * 60 * 60;

    const applicableAllowance: TokenAllowance = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(txTime - 2000),
      expires: futureTime
    });

    expect(isAllowanceExpired(ctx, applicableAllowance)).toBe(false);
  });

  it("should return true for an allowance with a non-zero timestamp in the past", () => {
    const { ctx } = fixture(GalaChainTokenContract);

    const txTime = ctx.txUnixTime;
    const pastTime = txTime - 1000 * 60 * 60;

    const applicableAllowance: TokenAllowance = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(pastTime - 2000),
      expires: pastTime
    });

    expect(isAllowanceExpired(ctx, applicableAllowance)).toBe(true);
  });
});

describe("cleanAllowances - H-03: NFT allowances should be invalidated after transfer", () => {
  it("should invalidate NFT allowance when grantor no longer owns the specific NFT instance (self-grant scenario)", async () => {
    // Scenario: Alice owns NFT instance #1, grants allowance to herself, then transfers to Charlie
    // After transfer, Alice's allowance should be invalid because she no longer owns instance #1

    const nftClassKey = nft.tokenClassKey();
    const txTime = Date.now();

    // Alice's allowance for NFT instance #1 (granted to herself)
    const aliceAllowance = plainToInstance(TokenAllowance, {
      ...nft.tokenAllowancePlain(txTime),
      grantedBy: users.testUser1.identityKey, // Alice grants
      grantedTo: users.testUser1.identityKey, // to herself
      instance: new BigNumber(1),
      allowanceType: AllowanceType.Transfer
    });

    // Charlie now owns the NFT (Alice transferred it to Charlie)
    // So Alice's balance should NOT contain instance #1
    const aliceBalance = new TokenBalance({
      owner: users.testUser1.identityKey,
      ...nftClassKey
    });
    // Alice has NO instances after transfer (empty instanceIds)

    const { ctx } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(aliceAllowance, aliceBalance);

    ctx.callingUserData = {
      alias: users.testUser1.identityKey,
      ethAddress: users.testUser1.ethAddress,
      roles: users.testUser1.roles,
      signedBy: [users.testUser1.identityKey],
      signatureQuorum: 1,
      allowedSigners: [users.testUser1.identityKey],
      isMultisig: false
    };

    const allowancesToCheck = [aliceAllowance];

    // When cleanAllowances is called, Alice's allowance should be removed
    // because doesGrantorHaveToken will return false (Alice doesn't own instance #1)
    const validAllowances = await cleanAllowances(ctx, allowancesToCheck, users.testUser1.identityKey);

    // Then: No valid allowances should remain
    expect(validAllowances.length).toBe(0);
  });

  it("should invalidate NFT allowance when grantor no longer owns the specific NFT instance (third-party grant scenario)", async () => {
    // Scenario: Alice owns NFT instance #1, grants allowance to Bob, then transfers to Charlie
    // After transfer, Bob's allowance from Alice should be invalid

    const nftClassKey = nft.tokenClassKey();
    const txTime = Date.now();

    // Alice's allowance granted to Bob for NFT instance #1
    const bobAllowanceFromAlice = plainToInstance(TokenAllowance, {
      ...nft.tokenAllowancePlain(txTime),
      grantedBy: users.testUser1.identityKey, // Alice grants
      grantedTo: users.testUser2.identityKey, // to Bob
      instance: new BigNumber(1),
      allowanceType: AllowanceType.Transfer
    });

    // Alice no longer owns the NFT (transferred to Charlie)
    const aliceBalance = new TokenBalance({
      owner: users.testUser1.identityKey,
      ...nftClassKey
    });
    // Alice has NO instances after transfer

    const { ctx } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(bobAllowanceFromAlice, aliceBalance);

    ctx.callingUserData = {
      alias: users.testUser2.identityKey,
      ethAddress: users.testUser2.ethAddress,
      roles: users.testUser2.roles,
      signedBy: [users.testUser2.identityKey],
      signatureQuorum: 1,
      allowedSigners: [users.testUser2.identityKey],
      isMultisig: false
    };

    const allowancesToCheck = [bobAllowanceFromAlice];

    // When cleanAllowances is called, Bob's allowance should be removed
    // because doesGrantorHaveToken will return false (Alice doesn't own instance #1)
    const validAllowances = await cleanAllowances(ctx, allowancesToCheck, users.testUser2.identityKey);

    // Then: No valid allowances should remain
    expect(validAllowances.length).toBe(0);
  });

  it("should keep NFT allowance valid when grantor still owns the specific NFT instance", async () => {
    // Scenario: Alice owns NFT instance #1, grants allowance to Bob, and still owns it
    // The allowance should remain valid

    const nftClassKey = nft.tokenClassKey();
    const txTime = Date.now();

    // Alice's allowance granted to Bob for NFT instance #1
    const bobAllowanceFromAlice = plainToInstance(TokenAllowance, {
      ...nft.tokenAllowancePlain(txTime),
      grantedBy: users.testUser1.identityKey, // Alice grants
      grantedTo: users.testUser2.identityKey, // to Bob
      instance: new BigNumber(1),
      allowanceType: AllowanceType.Transfer
    });

    // Alice still owns the NFT
    const aliceBalance = new TokenBalance({
      owner: users.testUser1.identityKey,
      ...nftClassKey
    });
    aliceBalance.addInstance(new BigNumber(1)); // Alice still has instance #1

    const { ctx } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(bobAllowanceFromAlice, aliceBalance);

    ctx.callingUserData = {
      alias: users.testUser2.identityKey,
      ethAddress: users.testUser2.ethAddress,
      roles: users.testUser2.roles,
      signedBy: [users.testUser2.identityKey],
      signatureQuorum: 1,
      allowedSigners: [users.testUser2.identityKey],
      isMultisig: false
    };

    const allowancesToCheck = [bobAllowanceFromAlice];

    // When cleanAllowances is called, Bob's allowance should remain valid
    const validAllowances = await cleanAllowances(ctx, allowancesToCheck, users.testUser2.identityKey);

    // Then: The allowance should still be valid
    expect(validAllowances.length).toBe(1);
  });

  it("should invalidate allowance for specific instance but keep allowance for different instance", async () => {
    // Scenario: Alice owns NFT instances #1 and #2
    // Alice grants allowances for both to Bob
    // Alice transfers instance #1 to Charlie (but keeps #2)
    // Only the allowance for instance #1 should be invalidated

    const nftClassKey = nft.tokenClassKey();
    const txTime = Date.now();

    // Allowance for instance #1 (Alice no longer owns this)
    const allowanceForInstance1 = plainToInstance(TokenAllowance, {
      ...nft.tokenAllowancePlain(txTime),
      grantedBy: users.testUser1.identityKey,
      grantedTo: users.testUser2.identityKey,
      instance: new BigNumber(1),
      allowanceType: AllowanceType.Transfer
    });

    // Allowance for instance #2 (Alice still owns this)
    const allowanceForInstance2 = plainToInstance(TokenAllowance, {
      ...nft.tokenAllowancePlain(txTime + 1), // different created time for uniqueness
      grantedBy: users.testUser1.identityKey,
      grantedTo: users.testUser2.identityKey,
      instance: new BigNumber(2),
      allowanceType: AllowanceType.Transfer
    });

    // Alice only owns instance #2 now (transferred #1 to Charlie)
    const aliceBalance = new TokenBalance({
      owner: users.testUser1.identityKey,
      ...nftClassKey
    });
    aliceBalance.addInstance(new BigNumber(2)); // Only instance #2

    const { ctx } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(allowanceForInstance1, allowanceForInstance2, aliceBalance);

    ctx.callingUserData = {
      alias: users.testUser2.identityKey,
      ethAddress: users.testUser2.ethAddress,
      roles: users.testUser2.roles,
      signedBy: [users.testUser2.identityKey],
      signatureQuorum: 1,
      allowedSigners: [users.testUser2.identityKey],
      isMultisig: false
    };

    const allowancesToCheck = [allowanceForInstance1, allowanceForInstance2];

    // When cleanAllowances is called
    const validAllowances = await cleanAllowances(ctx, allowancesToCheck, users.testUser2.identityKey);

    // Then: Only allowance for instance #2 should remain valid
    expect(validAllowances.length).toBe(1);
    expect(validAllowances[0].instance.isEqualTo(new BigNumber(2))).toBe(true);
  });
});
