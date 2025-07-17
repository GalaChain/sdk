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
import { ConflictError, SubmitCallDTO, UnauthorizedError, signatures } from "@gala-chain/api";

export class RequestConfirmationService {
  private constructor() {
    // prevent instantiation
  }

  // the implementation is a closure to prevent global static ephemeral key map
  private static readonly impl = (() => {
    // this is a safety measure to prevent abuse - and it is reasonable limit,
    // because it means 1000 simultaneous transactions with ephemeral keys
    const MAX_EPHEMERAL_KEYS = 1000;

    // this is only for safety, ephemeral key should be deleted after use
    const KEY_EXPIRY_MS = 1000 * 30;

    const MIN_UNIQUE_KEY_LENGTH = 16;

    const ephemeralKeys: Map<string, [string, NodeJS.Timeout]> = new Map();

    function signRequest<T extends SubmitCallDTO>(dto: T): T & { signature: string } {
      const uniqueKey = dto.uniqueKey;

      if (uniqueKey.length < MIN_UNIQUE_KEY_LENGTH) {
        const msg = `uniqueKey for ephemeral signing must be at least ${MIN_UNIQUE_KEY_LENGTH} characters long`;
        throw new UnauthorizedError(msg);
      }

      if (ephemeralKeys.has(uniqueKey)) {
        throw new ConflictError(`Ephemeral key already exists for uniqueKey ${uniqueKey}`);
      }

      if (ephemeralKeys.size >= MAX_EPHEMERAL_KEYS) {
        throw new ConflictError(`Too many ephemeral keys created. Please try again later.`);
      }

      const privateKey = signatures.genKeyPair().privateKey;

      ephemeralKeys.set(uniqueKey, [
        privateKey,
        setTimeout(() => {
          ephemeralKeys.delete(uniqueKey);
          console.warn(`Ephemeral key for ${uniqueKey} expired`);
        }, KEY_EXPIRY_MS)
      ]);

      return dto.signed(privateKey) as T & { signature: string };
    }

    function signConfirmation<T extends SubmitCallDTO>(dto: T): T & { signature: string } {
      const uniqueKey = dto.uniqueKey;

      if (uniqueKey.length < MIN_UNIQUE_KEY_LENGTH) {
        const msg = `uniqueKey for ephemeral signing must be at least ${MIN_UNIQUE_KEY_LENGTH} characters long`;
        throw new UnauthorizedError(msg);
      }

      const privateKey = ephemeralKeys.get(uniqueKey);
      if (privateKey === undefined) {
        throw new UnauthorizedError(`Ephemeral key not found for uniqueKey ${uniqueKey}`);
      }

      const signed = dto.signed(privateKey[0]);

      // delete the timeout and the key
      clearTimeout(privateKey[1]);
      ephemeralKeys.delete(uniqueKey);

      return signed as T & { signature: string };
    }

    return { signRequest, signConfirmation };
  })();

  public static signRequest(dto: SubmitCallDTO): SubmitCallDTO & { signature: string } {
    return this.impl.signRequest(dto);
  }

  public static signConfirmation<T extends SubmitCallDTO>(dto: T): T & { signature: string } {
    return this.impl.signConfirmation(dto);
  }
}
