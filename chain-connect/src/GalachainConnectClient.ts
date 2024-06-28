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
import { ChainCallDTO, serialize, signatures } from "@gala-chain/api";
import { BrowserProvider, Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export class GalachainConnectClient {
  private address_: string;
  private provider_: BrowserProvider | undefined;
  private chainCodeUrl: string;

  get address() {
    return `eth|${this.address_}`;
  }

  set address(val: string) {
    this.address_ = val.replace(/0x|eth\|/, "");
  }

  get provider() {
    return this.provider_;
  }

  constructor(chainCodeUrl: string) {
    this.chainCodeUrl = chainCodeUrl;
  }

  public async connectToMetaMask() {
    if (!window.ethereum) {
      throw new Error("Ethereum provider not found");
    }

    this.provider_ = new BrowserProvider(window.ethereum);

    try {
      const accounts = (await this.provider_.send("eth_requestAccounts", [])) as string[];
      this.address_ = accounts[0];

      return this.address;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  public async send<T, U extends ChainCallDTO>({
    url = this.chainCodeUrl,
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
    if (!this.provider_) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }

    try {
      if (sign === true) {
        const prefix = this.calculatePersonalSignPrefix(payload);
        const prefixedPayload = { ...payload, prefix };
        const dto = signatures.getPayloadToSign(prefixedPayload);

        const signer = await this.provider_.getSigner();
        const signature = await signer.provider.send("personal_sign", [this.address, dto]);

        return await this.submit(url, method, { ...prefixedPayload, signature }, headers);
      }

      return await this.submit(url, method, payload, headers);
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  private async submit<T, U extends ChainCallDTO>(
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
