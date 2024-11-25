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

let crypto: typeof import("node:crypto") | undefined;

Promise.resolve().then(async () => {
  try {
    crypto = (await import("node:crypto")).default;
  } catch (err) {
    console.error("Node.js crypto support is disabled!");
  }
});

export function randomUniqueKey(): string {
  // Try Node.js crypto first
  if (crypto) {
    return crypto.randomBytes(32).toString("base64");
  }

  // Fallback to Web Crypto API
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  throw new Error("No cryptographically secure random number generator available");
}
