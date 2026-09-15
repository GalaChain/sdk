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
import { genKeyPair, getEthAddress } from "../keys";
import { UserAlias } from "../types";

export const ADMIN_ROLES = ["CURATOR", "REGISTRAR"] as const;
export const DEFAULT_ROLES = ["EVALUATE", "SUBMIT"] as const;

/**
 * Chain user with role-based access control information.
 * Extends basic user identity with role assignments for testing authorization scenarios.
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
 * @param string - Optional user alias/identifier. If not provided, generates `eth|<addr>` identifier
 * @param roles - Array of role strings, defaults to DEFAULT_ROLES
 * @returns ChainUserWithRoles with cryptographic keys and role assignments
 *
 * @example
 * ```typescript
 * // Create user with default roles
 * const user = randomUser();
 *
 * // Create admin user
 * const admin = randomUser("admin", [...ADMIN_ROLES]);
 *
 * // Create user with custom roles
 * const curator = randomUser("curator", ["TokenCurator", "NFTManager"]);
 * ```
 */
export function randomUser(
  name?: string | undefined,
  roles: string[] = [...DEFAULT_ROLES]
): ChainUserWithRoles {
  const { privateKey, publicKey } = genKeyPair();
  const ethAddress = getEthAddress(publicKey);

  if (name === undefined) {
    return {
      identityKey: `eth|${ethAddress}` as UserAlias,
      ethAddress,
      publicKey,
      privateKey,
      roles
    };
  }

  const clientName = name.replace("client|", "");
  return {
    identityKey: `client|${clientName}` as UserAlias,
    ethAddress,
    publicKey,
    privateKey,
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
  admin: randomUser("client|admin", [...ADMIN_ROLES, ...DEFAULT_ROLES]),
  testUser1: randomUser("client|testUser1"),
  testUser2: randomUser("client|testUser2"),
  testUser3: randomUser("client|testUser3"),
  tokenHolder: randomUser("client|tokenHolder"),
  attacker: randomUser("client|maliciousUser", [...ADMIN_ROLES, ...DEFAULT_ROLES]),
  random: randomUser
};
