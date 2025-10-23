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
import ton from "./ton";

export enum SigningScheme {
  ETH = "ETH",
  TON = "TON"
}

function isValidSignature(
  signature: string,
  obj: object,
  publicKey: string,
  signing: SigningScheme = SigningScheme.ETH
): boolean {
  if (signing === SigningScheme.ETH) {
    return eth.isValid(signature, obj, publicKey);
  } else if (signing === SigningScheme.TON) {
    return ton.isValidSignature(
      Buffer.from(signature, "base64"),
      obj,
      Buffer.from(publicKey, "base64"),
      undefined
    );
  }
  throw new Error(`Unsupported signing scheme: ${signing}`);
}

function getSignature(
  obj: object,
  privateKey: string | Buffer,
  signing: SigningScheme = SigningScheme.ETH
): string {
  if (signing === SigningScheme.ETH) {
    const keyBuff = typeof privateKey === "string" ? eth.normalizePrivateKey(privateKey) : privateKey;
    return eth.getSignature(obj, keyBuff);
  } else if (signing === SigningScheme.TON) {
    const keyBuff = typeof privateKey === "string" ? Buffer.from(privateKey, "base64") : privateKey;
    return ton.getSignature(obj, keyBuff, undefined).toString("base64");
  }
  throw new Error(`Unsupported signing scheme: ${signing}`);
}

export default {
  ...eth,
  ton,
  getPayloadToSign,
  isValidSignature,
  getSignature
} as const;
