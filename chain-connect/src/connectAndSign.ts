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

const requestAccounts = async (provider: BrowserProvider) => {
  const accounts = (await provider.send("eth_requestAccounts", [])) as string[];

  return accounts;
};

export const connectAndSign = async (provider: BrowserProvider, messageToSign: Buffer | object) => {
  // TODO: if GalachainDto is used, need to use signatures.getPayloadToSign
  const accounts = await requestAccounts(provider);
  const signer = await provider.getSigner();
  const signature = await signer.provider.send("personal_sign", [accounts[0], JSON.stringify(messageToSign)]);

  return signature;
};
