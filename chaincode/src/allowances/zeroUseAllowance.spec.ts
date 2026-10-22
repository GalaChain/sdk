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
import { AllowanceKey, AllowanceType, TokenAllowance, createValidChainObject } from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";
import { isAllowanceSpent } from "./checkAllowances";
import { allowanceIsUseable } from "./grantAllowance";
import { refreshAllowances } from "./refreshAllowances";
import { useAllowances } from "./useAllowances";

describe("zero use allowances", () => {
  it("treats a refreshed allowance with zero uses as spent", async () => {
    const allowance = await createValidChainObject(TokenAllowance, {
      grantedTo: users.testUser1.identityKey,
      collection: "TEST",
      category: "Item",
      type: "Potion",
      additionalKey: "Elixir",
      instance: new BigNumber("1"),
      allowanceType: AllowanceType.Lock,
      grantedBy: users.testUser2.identityKey,
      created: 1,
      uses: new BigNumber("5"),
      expires: 0,
      quantity: new BigNumber("100")
    });

    const { ctx } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser2)
      .savedState(allowance);

    const allowanceKey = new AllowanceKey();
    allowanceKey.grantedTo = allowance.grantedTo;
    allowanceKey.collection = allowance.collection;
    allowanceKey.category = allowance.category;
    allowanceKey.type = allowance.type;
    allowanceKey.additionalKey = allowance.additionalKey;
    allowanceKey.instance = allowance.instance;
    allowanceKey.allowanceType = allowance.allowanceType;
    allowanceKey.grantedBy = allowance.grantedBy;
    allowanceKey.created = allowance.created;

    const [updated] = await refreshAllowances(ctx, [{ allowanceKey, uses: new BigNumber("0"), expires: 0 }]);

    expect(updated.uses.isZero()).toBe(true);
    expect(isAllowanceSpent(updated)).toBe(true);
    expect(allowanceIsUseable(ctx, updated)).toBe(false);
    await expect(useAllowances(ctx, new BigNumber("1"), [updated], AllowanceType.Lock)).rejects.toThrow(
      /Quantity remaining/
    );
  });
});
