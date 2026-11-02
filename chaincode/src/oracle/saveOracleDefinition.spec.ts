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
import { fixture, users } from "@gala-chain/test";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { saveOracleDefinition } from "./saveOracleDefinition";

function curatorContext() {
  return fixture(GalaChainTokenContract)
    .caClientIdentity("client|curator", "CuratorOrg")
    .registeredUsers(users.testUser1)
    .callingUser(users.testUser1);
}

describe("saveOracleDefinition", () => {
  it("saves the caller when authorities are omitted", async () => {
    const { ctx } = curatorContext();

    const saved = await saveOracleDefinition(ctx, { name: "price" });

    expect(saved.authorities).toEqual([ctx.callingUser]);
  });

  it("rejects an empty authority list", async () => {
    const { ctx } = curatorContext();

    await expect(saveOracleDefinition(ctx, { name: "price", authorities: [] })).rejects.toThrow(
      /authorities/
    );
  });

  it("rejects a blank authority", async () => {
    const { ctx } = curatorContext();

    await expect(saveOracleDefinition(ctx, { name: "price", authorities: [""] })).rejects.toThrow(
      /authorities/
    );
  });

  it("accepts registered and self-authenticating authorities", async () => {
    const { ctx } = curatorContext();
    const ethAlias = `eth|${users.testUser2.ethAddress}`;

    const saved = await saveOracleDefinition(ctx, {
      name: "price",
      authorities: [users.testUser1.identityKey, ethAlias]
    });

    expect(saved.authorities).toEqual([users.testUser1.identityKey, ethAlias]);
  });

  it("rejects an unregistered non-Ethereum authority", async () => {
    const { ctx } = curatorContext();

    await expect(
      saveOracleDefinition(ctx, {
        name: "price",
        authorities: ["client|missing"]
      })
    ).rejects.toThrow(/not registered/);
  });
});
