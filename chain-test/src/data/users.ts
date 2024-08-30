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
import { UserProfile } from "@gala-chain/api";
import { ChainUser } from "@gala-chain/client";

export interface ChainUserWithRoles {
  alias: string;
  ethAddress: string;
  publicKey: string;
  privateKey: string;
  roles: string[] | undefined;
}

function randomUser(
  string?: string | undefined,
  roles: string[] = [...UserProfile.DEFAULT_ROLES]
): ChainUserWithRoles & { roles: string[] } {
  const user = ChainUser.withRandomKeys(string);
  return {
    alias: user.alias,
    ethAddress: user.ethAddress,
    publicKey: user.publicKey,
    privateKey: user.privateKey,
    roles
  };
}

export default {
  admin: randomUser("client|admin", [...UserProfile.ADMIN_ROLES]),
  testUser1: randomUser("client|testUser1"),
  testUser2: randomUser("client|testUser2"),
  testUser3: randomUser("client|testUser3"),
  tokenHolder: randomUser("client|tokenHolder"),
  attacker: randomUser("client|maliciousUser", [...UserProfile.ADMIN_ROLES]),
  random: randomUser
};
