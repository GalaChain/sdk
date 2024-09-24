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
import { ChainCallDTO, ConstructorArgs } from "@gala-chain/api";
import { BrowserProvider, getAddress } from "ethers";

import { CustomClient, WebSigner } from "../GalachainClient";
import { generateEIP712Types } from "../Utils";
import { ExtendedEip1193Provider } from "../helpers";

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
  }
}

export async function getTrustWalletInjectedProvider({ timeout } = { timeout: 3000 }) {
  const provider = new BrowserProvider(getTrustWalletFromWindow());

  if (provider) {
    return provider;
  }

  return listenForTrustWalletInitialized({ timeout });
}

async function listenForTrustWalletInitialized(
  { timeout } = { timeout: 3000 }
): Promise<BrowserProvider | undefined> {
  return new Promise((resolve) => {
    const handleInitialization = () => {
      resolve(getTrustWalletFromWindow());
    };

    window.addEventListener("trustwallet#initialized", handleInitialization, {
      once: true
    });

    setTimeout(() => {
      window.removeEventListener("trustwallet#initialized", handleInitialization, false);
      resolve(undefined);
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

export class GalachainConnectTrustClient extends WebSigner {
  constructor() {
    super();
    this.address = "";
  }

  private initializeListeners(): void {
    if (!window.ethereum) {
      return;
    }
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        this.walletAddress = getAddress(accounts[0]);
        this.emit("accountChanged", this.galachainEthAlias);
        this.emit("accountsChanged", accounts);
      } else {
        this.walletAddress = "";
        this.emit("accountChanged", null);
        this.emit("accountsChanged", null);
      }
    });
  }

  public async connect() {
    this.provider = await getTrustWalletInjectedProvider();
    if (!this.provider) {
      throw new Error("Trust Wallet provider not found");
    }
    this.initializeListeners();

    try {
      const accounts = (await this.provider.send("eth_requestAccounts", [])) as string[];
      this.walletAddress = getAddress(accounts[0]);
      return this.galachainEthAlias;
    } catch (error: any) {
      if (error.code === 4001) {
        console.error("User denied connection.");
      }
      throw new Error((error as Error).message);
    }
  }

  public async sign<U extends ConstructorArgs<ChainCallDTO>>(
    method: string,
    payload: U
  ): Promise<U & { signature: string; prefix: string }> {
    if (!this.provider) {
      throw new Error("Trust Wallet provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }

    try {
      const domain = { name: "GalaChain" };
      const types = generateEIP712Types(method, payload);

      const prefix = this.calculatePersonalSignPrefix(payload);
      const prefixedPayload = { ...payload, prefix };

      const signer = await this.provider.getSigner();
      const signature = await signer.signTypedData(domain, types, prefixedPayload);

      return { ...prefixedPayload, signature, types, domain };
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}
