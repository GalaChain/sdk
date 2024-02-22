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
import { DefaultError, ValidationFailedError } from "@gala-chain/api";

export class SameSenderAndRecipientError extends ValidationFailedError {
  constructor(fromPersonKey: string, toPersonKey: string) {
    super(
      `TransferToken requires a different sender and recipient. ` +
        `Received: from ${fromPersonKey}, to ${toPersonKey}.`,
      {
        fromPersonKey,
        toPersonKey
      }
    );
  }
}

export class TransferTokenFailedError extends DefaultError {
  constructor(message: string, payload: Record<string, unknown> | undefined) {
    super(`TransferToken failed: ${message}`, payload);
  }
}
