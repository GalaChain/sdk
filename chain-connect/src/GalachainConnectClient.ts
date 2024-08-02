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

import { generateEIP712Types } from "./Utils";

interface ExtendedEip1193Provider extends Eip1193Provider {
  on(event: "accountsChanged", handler: (accounts: string[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
  }
}

interface MetaMaskEvents {
  accountChanged: string | null;
  accountsChanged: string[] | null;
}

type Listener<T> = (data: T) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class CustomEventEmitter<Events extends Record<string, any>> {
  private listeners: { [K in keyof Events]?: Listener<Events[K]>[] } = {};

  public on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(listener);
    return this;
  }

  public off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event]?.filter((l) => l !== listener);
    return this;
  }

  public emit<K extends keyof Events>(event: K, data: Events[K]): boolean {
    if (!this.listeners[event]) return false;
    this.listeners[event]?.forEach((listener) => listener(data));
    return true;
  }
}

export class GalachainConnectClient extends CustomEventEmitter<MetaMaskEvents> {
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
        this.ethAddress = getAddress(accounts[0]);
        this.emit("accountChanged", this.galachainAddress);
        this.emit("accountsChanged", accounts);
      } else {
        this.ethAddress = "";
        this.emit("accountChanged", null);
        this.emit("accountsChanged", null);
      }
    });
  }

  public async connectToMetaMask() {
    if (!this.#provider) {
      throw new Error("Ethereum provider not found");
    }
    this.initializeListeners();

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
  }): Promise<T> {
    if (!this.#provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.#ethAddress) {
      throw new Error("No account connected");
    }

    try {
      if (sign === true) {
        const domain = { name: "Galachain" };
        const types = generateEIP712Types(method, payload);

        const prefix = this.calculatePersonalSignPrefix(payload);
        const prefixedPayload = { prefix, ...payload };

        const signer = await this.#provider.getSigner();

        const signature = await signer.signTypedData(domain, types, prefixedPayload);

        return await this.submit(url, method, { ...prefixedPayload, signature, types, domain }, headers);
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

  public calculatePersonalSignPrefix(payload: object): string {
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
