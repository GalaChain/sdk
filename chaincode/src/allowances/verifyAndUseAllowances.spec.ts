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
import { currency, fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { InsufficientAllowanceError } from "./AllowanceError";
import { verifyAndUseAllowances } from "./verifyAndUseAllowances";

describe("verifyAndUseAllowances", () => {
  test("should deduplicate allowance keys and prevent double-spending", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();

    const { ctx } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1, users.tokenHolder);

    // Create an allowance for 100 tokens
    const tokenAllowance = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(ctx.txUnixTime),
      grantedTo: users.testUser1.identityKey,
      grantedBy: users.tokenHolder.identityKey,
      allowanceType: AllowanceType.Lock,
      quantity: new BigNumber("100"),
      quantitySpent: new BigNumber("0"),
      uses: new BigNumber("10"),
      usesSpent: new BigNumber("0")
    });

    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      owner: users.tokenHolder.identityKey,
      quantity: new BigNumber("1000")
    });

    const { ctx: testCtx } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.tokenHolder)
      .savedState(currencyClass, currencyInstance, tokenAllowance, tokenBalance);

    // When - auto-fetch and use allowance
    // Then - should succeed with exactly 100 tokens
    const result = await verifyAndUseAllowances(
      testCtx,
      users.tokenHolder.identityKey,
      currencyInstanceKey,
      new BigNumber("100"),
      currencyInstance,
      users.testUser1.identityKey,
      AllowanceType.Lock
    );

    expect(result).toBe(true);
  });

  test("should fail when requesting more than deduplicated allowance amount", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();

    const { ctx } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1, users.tokenHolder);

    // Create an allowance for 100 tokens
    const tokenAllowance = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(ctx.txUnixTime),
      grantedTo: users.testUser1.identityKey,
      grantedBy: users.tokenHolder.identityKey,
      allowanceType: AllowanceType.Lock,
      quantity: new BigNumber("100"),
      quantitySpent: new BigNumber("0"),
      uses: new BigNumber("10"),
      usesSpent: new BigNumber("0")
    });

    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      owner: users.tokenHolder.identityKey,
      quantity: new BigNumber("1000")
    });

    const { ctx: testCtx } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.tokenHolder)
      .savedState(currencyClass, currencyInstance, tokenAllowance, tokenBalance);

    // When - auto-fetch and try to use 200 tokens
    // Then - should fail because actual allowance is only 100
    await expect(
      verifyAndUseAllowances(
        testCtx,
        users.tokenHolder.identityKey,
        currencyInstanceKey,
        new BigNumber("200"),
        currencyInstance,
        users.testUser1.identityKey,
        AllowanceType.Lock
      )
    ).rejects.toThrow(InsufficientAllowanceError);
  });

  test("should work normally with unique allowance keys", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();

    const { ctx } = fixture(GalaChainTokenContract).registeredUsers(users.testUser1, users.tokenHolder);

    // Create two different allowances for 100 tokens each
    const tokenAllowance1 = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(ctx.txUnixTime),
      grantedTo: users.testUser1.identityKey,
      grantedBy: users.tokenHolder.identityKey,
      allowanceType: AllowanceType.Lock,
      quantity: new BigNumber("100"),
      quantitySpent: new BigNumber("0"),
      uses: new BigNumber("10"),
      usesSpent: new BigNumber("0"),
      created: 1
    });

    const tokenAllowance2 = plainToInstance(TokenAllowance, {
      ...currency.tokenAllowancePlain(ctx.txUnixTime),
      grantedTo: users.testUser1.identityKey,
      grantedBy: users.tokenHolder.identityKey,
      allowanceType: AllowanceType.Lock,
      quantity: new BigNumber("100"),
      quantitySpent: new BigNumber("0"),
      uses: new BigNumber("10"),
      usesSpent: new BigNumber("0"),
      created: 2
    });

    const tokenBalance = plainToInstance(TokenBalance, {
      ...currency.tokenBalance(),
      owner: users.tokenHolder.identityKey,
      quantity: new BigNumber("1000")
    });

    const { ctx: testCtx } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.tokenHolder)
      .savedState(currencyClass, currencyInstance, tokenAllowance1, tokenAllowance2, tokenBalance);

    // When - auto-fetch and use allowances (total 200 tokens)
    // Then - should succeed with 200 tokens
    const result = await verifyAndUseAllowances(
      testCtx,
      users.tokenHolder.identityKey,
      currencyInstanceKey,
      new BigNumber("200"),
      currencyInstance,
      users.testUser1.identityKey,
      AllowanceType.Lock
    );

    expect(result).toBe(true);
  });
});
