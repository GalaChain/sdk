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

import { CustomEventEmitter, ExtendedEip1193Provider, MetaMaskEvents } from "../helpers";
import { CustomClient } from "../types/CustomClient";

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
  }
}

export async function getTrustWalletInjectedProvider({ timeout } = { timeout: 3000 }) {
  const provider = getTrustWalletFromWindow();

  if (provider) {
    return provider;
  }

  return listenForTrustWalletInitialized({ timeout });
}

async function listenForTrustWalletInitialized({ timeout } = { timeout: 3000 }) {
  return new Promise((resolve) => {
    const handleInitialization = () => {
      resolve(getTrustWalletFromWindow());
    };

    window.addEventListener("trustwallet#initialized", handleInitialization, {
      once: true
    });

    setTimeout(() => {
      window.removeEventListener("trustwallet#initialized", handleInitialization, false);
      resolve(null);
    }, timeout);
  });
}

function getTrustWalletFromWindow() {
  const isTrustWallet = (ethereum: ExtendedEip1193Provider | undefined) => {
    // Identify if Trust Wallet injected provider is present.
    const trustWallet = !!ethereum?.isTrust;

    return trustWallet;
  };

  const injectedProviderExist = typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  // No injected providers exist.
  if (!injectedProviderExist) {
    return null;
  }

  // Trust Wallet was injected into window.ethereum.
  if (isTrustWallet(window.ethereum)) {
    return window.ethereum;
  }

  // Trust Wallet provider might be replaced by another
  // injected provider, check the providers array.
  if (window.ethereum?.providers) {
    // ethereum.providers array is a non-standard way to
    // preserve multiple injected providers. Eventually, EIP-5749
    // will become a living standard and we will have to update this.
    return window.ethereum.providers.find(isTrustWallet) ?? null;
  }

  // Trust Wallet injected provider is available in the global scope.
  // There are cases that some cases injected providers can replace window.ethereum
  // without updating the ethereum.providers array. To prevent issues where
  // the TW connector does not recognize the provider when TW extension is installed,
  // we begin our checks by relying on TW's global object.
  return window["trustwallet"] ?? null;
}

export class GalachainConnectTrustClient extends CustomEventEmitter<MetaMaskEvents> implements CustomClient {
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
  }

  private initializeListeners(): void {
    if (!this.#provider) {
      return;
    }
    this.#provider.addListener("accountsChanged", (accounts: string[]) => {
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

  public async connectToTrust() {
    this.#provider = await getTrustWalletInjectedProvider();
    if (!this.#provider) {
      throw new Error("Ethereum provider not found");
    }
    this.initializeListeners();

    try {
      const accounts = (await this.#provider.send("eth_requestAccounts", [])) as string[];
      this.ethAddress = getAddress(accounts[0]);
      return this.galachainAddress;
    } catch (error: any) {
      if (error.code === 4001) {
        console.error("User denied connection.");
      }
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
