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
import { ChainUser, UserAlias, UserProfile } from "@gala-chain/api";

/**
 * Chain user with role-based access control information.
 * Extends basic ChainUser with role assignments for testing authorization scenarios.
 */
export interface ChainUserWithRoles {
  identityKey: UserAlias;
  ethAddress: string;
  publicKey: string;
  privateKey: string;
  roles: string[];
}

/**
 * Creates a random user with specified roles for testing.
 *
 * @param string - Optional user alias/identifier. If not provided, generates random identifier
 * @param roles - Array of role strings, defaults to DEFAULT_ROLES
 * @returns ChainUserWithRoles with cryptographic keys and role assignments
 *
 * @example
 * ```typescript
 * // Create user with default roles
 * const user = randomUser();
 *
 * // Create admin user
 * const admin = randomUser("admin", UserProfile.ADMIN_ROLES);
 *
 * // Create user with custom roles
 * const curator = randomUser("curator", ["TokenCurator", "NFTManager"]);
 * ```
 */
export function randomUser(
  string?: string | undefined,
  roles: string[] = [...UserProfile.DEFAULT_ROLES]
): ChainUserWithRoles & { roles: string[] } {
  const user = ChainUser.withRandomKeys(string);
  return {
    identityKey: user.identityKey,
    ethAddress: user.ethAddress,
    publicKey: user.publicKey,
    privateKey: user.privateKey,
    roles
  };
}

/**
 * Collection of predefined test users for common testing scenarios.
 *
 * Provides commonly used user roles and identities to simplify test setup.
 *
 * @example
 * ```typescript
 * import users from '@gala-chain/test/data/users';
 *
 * // Use predefined users
 * const admin = users.admin;
 * const user1 = users.testUser1;
 *
 * // Create new random user
 * const customUser = users.random("custom-user", ["CustomRole"]);
 * ```
 */
export default {
  admin: randomUser("client|admin", [...UserProfile.ADMIN_ROLES]),
  testUser1: randomUser("client|testUser1"),
  testUser2: randomUser("client|testUser2"),
  testUser3: randomUser("client|testUser3"),
  tokenHolder: randomUser("client|tokenHolder"),
  attacker: randomUser("client|maliciousUser", [...UserProfile.ADMIN_ROLES]),
  random: randomUser
};
