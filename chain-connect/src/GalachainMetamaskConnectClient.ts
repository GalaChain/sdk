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
import { BrowserProvider, getAddress } from "ethers";

import { CustomEventEmitter, ExtendedEip1193Provider, MetaMaskEvents } from "./helpers";
import { CustomClient } from "./types/GalachainClient";

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
  }
}

export class GalachainMetamaskConnectClient
  extends CustomEventEmitter<MetaMaskEvents>
  implements CustomClient
{
  #ethAddress: string;
  #provider: BrowserProvider | undefined;
  #chainCodeUrl: string;

  get getChaincodeUrl() {
    return this.#chainCodeUrl;
  }

  get getGalachainAddress() {
    return this.#ethAddress.replace("0x", "eth|");
  }

  get getWalletAddress(): string {
    return getAddress(this.#ethAddress);
  }

  set setWalletAddress(val: string) {
    this.#ethAddress = getAddress(`0x${val.replace(/0x|eth\|/, "")}`);
  }

  constructor(chainCodeUrl: string) {
    super();
    this.#chainCodeUrl = chainCodeUrl;

    if (window.ethereum) {
      this.#provider = new BrowserProvider(window.ethereum);
    } else {
      throw new Error("Ethereum provider not found");
    }
  }

  private initializeListeners(): void {
    if (!window.ethereum) {
      return;
    }
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        this.setWalletAddress = getAddress(accounts[0]);
        this.emit("accountChanged", this.getGalachainAddress);
        this.emit("accountsChanged", accounts);
      } else {
        this.setWalletAddress = "";
        this.emit("accountChanged", null);
        this.emit("accountsChanged", null);
      }
    });
  }

  public async connect() {
    if (!this.#provider) {
      throw new Error("Ethereum provider not found");
    }
    this.initializeListeners();

    try {
      const accounts = (await this.#provider.send("eth_requestAccounts", [])) as string[];
      this.setWalletAddress = getAddress(accounts[0]);
      return this.getGalachainAddress;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  public async sign<U extends ConstructorArgs<ChainCallDTO>>(
    payload: U
  ): Promise<U & { signature: string; prefix: string }> {
    if (!this.#provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.#ethAddress) {
      throw new Error("No account connected");
    }

    try {
      const prefix = this.calculatePersonalSignPrefix(payload);
      const prefixedPayload = { ...payload, prefix };
      const dto = signatures.getPayloadToSign(prefixedPayload);

      const signer = await this.#provider.getSigner();
      const signature = await signer.provider.send("personal_sign", [this.#ethAddress, dto]);

      return { ...prefixedPayload, signature };
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
  }): Promise<T> {
    try {
      if (sign === true) {
        const newPayload = await this.sign(payload);

        return await this.submit(url, method, newPayload, headers);
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
