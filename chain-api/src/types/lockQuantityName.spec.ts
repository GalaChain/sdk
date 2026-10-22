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
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { TokenHold } from "./TokenBalance";
import { PostMintLockConfiguration } from "./TokenMintConfiguration";
import { UserAlias } from "./UserAlias";
import { LockTokensDto, UnlockTokenDto, UnlockTokensDto } from "./lock";

const tokenInstance = {
  collection: "CC",
  category: "Currency",
  type: "TEST",
  additionalKey: "none",
  instance: "0"
};

describe("lock quantity and name", () => {
  it("rejects a negative quantity when unlocking a fungible token", async () => {
    const dto = plainToInstance(UnlockTokenDto, {
      tokenInstance,
      quantity: "-1",
      uniqueKey: "unlock-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "quantity")).toBe(true);
  });

  it("rejects a negative post-mint lock duration", async () => {
    const config = plainToInstance(PostMintLockConfiguration, {
      lockName: "vest",
      lockAuthority: "client|admin",
      expirationModifier: -1,
      lockPercentage: 1
    });

    const errors = await validate(config);
    expect(errors.some((error) => error.property === "expirationModifier")).toBe(true);
  });

  it("rejects an empty lock name and matches a stored empty name", async () => {
    const lock = plainToInstance(LockTokensDto, {
      tokenInstances: [{ tokenInstance, quantity: "1" }],
      name: "",
      uniqueKey: "lock-key"
    });
    const unlock = plainToInstance(UnlockTokensDto, {
      tokenInstances: [{ tokenInstance, quantity: "1" }],
      name: "",
      uniqueKey: "unlock-key"
    });

    expect((await validate(lock)).some((error) => error.property === "name")).toBe(true);
    expect((await validate(unlock)).some((error) => error.property === "name")).toBe(true);

    await expect(
      TokenHold.createValid({
        createdBy: "client|alice" as UserAlias,
        instanceId: new BigNumber(0),
        quantity: new BigNumber(1),
        created: 1,
        expires: 0,
        name: "",
        lockAuthority: undefined,
        vestingPeriodStart: undefined
      })
    ).rejects.toBeTruthy();

    const hold = new TokenHold({
      createdBy: "client|alice" as UserAlias,
      instanceId: new BigNumber(0),
      quantity: new BigNumber(1),
      created: 1,
      name: ""
    });
    expect(hold.matches(new BigNumber(0), "")).toBe(true);
  });
});
