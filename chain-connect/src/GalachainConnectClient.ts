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
import { ChainCallDTO, ConstructorArgs, serialize, signatures } from "@gala-chain/api";
import { BrowserProvider, Eip1193Provider, getAddress } from "ethers";

import { EIP6963AnnounceProviderEvent, EIP6963ProviderDetail } from "./EthereumProviderTypes";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<EIP6963AnnounceProviderEvent>;
  }
}

let providers: EIP6963ProviderDetail[] = [];

export class GalachainConnectClient {
  #ethAddress: string;
  #provider: BrowserProvider | undefined;
  #chainCodeUrl: string;

  get galachainAddress() {
    return this.#ethAddress.replace("0x", "eth|");
  }

  get ethAddress() {
    return getAddress(this.#ethAddress);
  }

  set ethAddress(val: string) {
    this.#ethAddress = getAddress(`0x${val.replace(/0x|eth\|/, "")}`);
  }

  get provider() {
    return this.#provider;
  }

  constructor(chainCodeUrl: string) {
    this.#chainCodeUrl = chainCodeUrl;
  }

  public async connectToMetaMask() {
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found");
    }

    this.#provider = new BrowserProvider(window.ethereum);

    try {
      const accounts = (await this.#provider.send("eth_requestAccounts", [])) as string[];
      this.ethAddress = getAddress(accounts[0]);

      return this.galachainAddress;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  public async send<T, U extends ConstructorArgs<ChainCallDTO>>({
    url = this.#chainCodeUrl,
    method,
    payload,
    sign = false,
    headers = {}
  }: {
    url?: string;
    method: string;
    payload: U;
    sign?: boolean;
    headers?: object;
  }): Promise<{ Data: T }> {
    if (!this.#provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.#ethAddress) {
      throw new Error("No account connected");
    }

    try {
      if (sign === true) {
        const prefix = this.calculatePersonalSignPrefix(payload);
        const prefixedPayload = { ...payload, prefix };
        const dto = signatures.getPayloadToSign(prefixedPayload);

        const signer = await this.#provider.getSigner();
        const signature = await signer.provider.send("personal_sign", [this.#ethAddress, dto]);

        return await this.submit(url, method, { ...prefixedPayload, signature }, headers);
      }

      return await this.submit(url, method, payload, headers);
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  private async submit<T, U extends ConstructorArgs<ChainCallDTO>>(
    chainCodeUrl: string,
    method: string,
    signedPayload: U,
    headers: object
  ): Promise<T> {
    if (signedPayload instanceof ChainCallDTO) {
      await signedPayload.validateOrReject();
    }

    const url = `${chainCodeUrl}/${method}`;
    const response = await fetch(url, {
      method: "POST",
      body: serialize(signedPayload),
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    });

    const id = response.headers.get("x-transaction-id");
    const data = await response.json();

    if (data.error) {
      return data.error;
    }

    return id ? { Hash: id, ...data } : data;
  }

  private calculatePersonalSignPrefix(payload: object): string {
    const payloadLength = signatures.getPayloadToSign(payload).length;
    const prefix = "\u0019Ethereum Signed Message:\n" + payloadLength;

    const newPayload = { ...payload, prefix };
    const newPayloadLength = signatures.getPayloadToSign(newPayload).length;

    if (payloadLength === newPayloadLength) {
      return prefix;
    }
    return this.calculatePersonalSignPrefix(newPayload);
  }
}
