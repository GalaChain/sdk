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
import {
  UserAlias,
  UserRefValidationResult,
  ValidationFailedError,
  asValidUserAlias,
  signatures,
  validateUserRef
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { PublicKeyService } from "./PublicKeyService";

export async function resolveUserAlias(ctx: GalaChainContext, userRef: string): Promise<UserAlias> {
  const res = validateUserRef(userRef);

  if (res === UserRefValidationResult.VALID_SYSTEM_USER) {
    return userRef as UserAlias;
  }

  if (res === UserRefValidationResult.VALID_USER_ALIAS) {
    if (userRef.startsWith("eth|")) {
      return await resolveAliasFromEthAddress(ctx, userRef.slice(4));
    }

    return userRef as UserAlias;
  }

  if (res === UserRefValidationResult.VALID_ETH_ADDRESS) {
    return await resolveAliasFromEthAddress(ctx, userRef);
  }

  const key = UserRefValidationResult[res];
  throw new ValidationFailedError(`Invalid user reference (${key}): ${userRef}`, { userRef });
}

async function resolveAliasFromEthAddress(ctx: GalaChainContext, rawEthAddress: string): Promise<UserAlias> {
  const ethAddress = signatures.normalizeEthAddress(rawEthAddress);
  const userProfile = await PublicKeyService.getUserProfile(ctx, ethAddress);
  const actualAlias = userProfile?.alias ?? asValidUserAlias(`eth|${ethAddress}`);
  return actualAlias;
}
