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
import { ChainCallDTO, signatures } from "@gala-chain/api";
import { BrowserProvider } from "ethers";

export const calculatePersonalSignPrefix = (payload: object): string => {
  const payloadLength = signatures.getPayloadToSign(payload).length;
  const prefix = "\u0019Ethereum Signed Message:\n" + payloadLength;

  const newPayload = { ...payload, prefix };
  const newPayloadLength = signatures.getPayloadToSign(newPayload).length;

  if (payloadLength === newPayloadLength) {
    return prefix;
  }
  return calculatePersonalSignPrefix(newPayload);
};

const requestAccounts = async (provider: BrowserProvider) => {
  const accounts = (await provider.send("eth_requestAccounts", [])) as string[];

  return accounts;
};

// NOTE: should we allow messageToSign to be a buffer?
export const connectAndSign = async (provider: BrowserProvider, messageToSign: object) => {
  const prefix = calculatePersonalSignPrefix(messageToSign);

  const augmentedDTO = { prefix, ...messageToSign };
  const payload = signatures.getPayloadToSign(augmentedDTO);

  const accounts = await requestAccounts(provider);
  const signer = await provider.getSigner();
  const signature = await signer.provider.send("personal_sign", [accounts[0], JSON.stringify(payload)]);

  return signature;
};
