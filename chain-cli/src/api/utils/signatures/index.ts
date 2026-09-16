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
import eth from "./eth";
import { getPayloadToSign } from "./getPayloadToSign";

function isValidSignature(signature: string, obj: object, publicKey: string): boolean {
  return eth.isValid(signature, obj, publicKey);
}

function getSignature(obj: object, privateKey: string | Buffer): string {
  const keyBuff = typeof privateKey === "string" ? eth.normalizePrivateKey(privateKey) : privateKey;
  return eth.getSignature(obj, keyBuff);
}

export default {
  ...eth,
  getPayloadToSign,
  isValidSignature,
  getSignature
} as const;
