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
import { NotImplementedError } from "../error";

// verify if TON is supported
function importTonOrReject() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ton = require("@ton/ton");
  if (!ton) {
    throw new NotImplementedError("TON is not supported. Missing library @ton/ton");
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require("@ton/crypto");
  if (!crypto) {
    throw new NotImplementedError("TON is not supported. Missing library @ton/crypto");
  }

  return { ton, crypto };
}

function isValidTonAddress(address: string): boolean {
  const { ton } = importTonOrReject();

  try {
    const [wc, hash] = address.split(":");

    if (!wc || !hash || !Number.isInteger(parseFloat(wc))) {
      return false;
    }

    const parsed = ton.Address.parseFriendly(hash);

    return parsed && !parsed.isTestOnly;
  } catch (e) {
    return false;
  }
}

export default {
  isValidTonAddress
} as const;
