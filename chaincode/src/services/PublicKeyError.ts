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
import { ConflictError, NotFoundError, UnauthorizedError } from "@gala-chain/api";

export class PkExistsError extends ConflictError {
  constructor(user: string) {
    super(`Public key is already saved for user ${user}`, { user });
  }
}

export class ProfileExistsError extends ConflictError {
  constructor(address: string, userAlias: string) {
    const msg = `User Profile is already saved for ethereum address ${address}, user ${userAlias}`;
    super(msg, { address, userAlias });
  }
}

export class ProfileNotFoundError extends NotFoundError {
  constructor(address: string) {
    super(`UserProfile is not saved for ethereum address ${address}`, { address });
  }
}

export class PkMismatchError extends ConflictError {
  constructor(user: string) {
    super(`Public key does not match existing publicKey on chain for user ${user}`, { user });
  }
}

export class PkNotFoundError extends NotFoundError {
  constructor(user: string) {
    super(`Public key is not saved for user ${user}`, { user });
  }
}

export class PkMissingError extends UnauthorizedError {
  constructor(user: string) {
    super(`Missing public key for user ${user}`, { user });
  }
}

export class PkInvalidSignatureError extends UnauthorizedError {
  constructor(user: string) {
    const message = `Signature is invalid. DTO should be signed by ${user} private key with secp256k1 algorithm`;
    super(message, { user });
  }
}

export class UserProfileNotFoundError extends NotFoundError {
  constructor(user: string) {
    super(`UserProfile not found for user alias ${user}`, { user });
  }
}
