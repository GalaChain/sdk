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
import { TokenAllowance } from "@gala-chain/api";
import { currency, fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { checkAllowances, isAllowanceExpired } from "./checkAllowances";

describe("checkAllowances", () => {
  it("should not count expired allowances", async () => {
    const checkAllowancesFixture = fixture(GalaChainTokenContract);

    const { ctx } = checkAllowancesFixture;
    ctx.callingUserData = {
      alias: users.admin.alias,
      ethAddress: users.admin.ethAddress,
      roles: users.admin.roles
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
