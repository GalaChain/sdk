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
import { BrowserProvider, Eip1193Provider } from "ethers";

import { ExtendedEip1193Provider } from "../helpers";
import { BrowserConnectClient } from "./BrowserConnectClient";

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
  }
}

type WindowWithTrustWallet = Window & {
  ethereum?: ExtendedEip1193Provider;
  trustwallet?: ExtendedEip1193Provider;
};

export async function getTrustWalletInjectedProvider({ timeout } = { timeout: 3000 }) {
  const provider = getTrustWalletFromWindow();

  if (provider) {
    return new BrowserProvider(provider);
  }

  return listenForTrustWalletInitialized({ timeout });
}

async function listenForTrustWalletInitialized(
  { timeout } = { timeout: 3000 }
): Promise<BrowserProvider | undefined> {
  return new Promise((resolve) => {
    const handleInitialization = () => {
      const provider = getTrustWalletFromWindow();
      resolve(provider ? new BrowserProvider(provider) : undefined);
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

function getTrustWalletFromWindow(): ExtendedEip1193Provider | undefined {
  const isTrustWallet = (ethereum: Eip1193Provider): ethereum is ExtendedEip1193Provider => {
    return !!(ethereum as ExtendedEip1193Provider).isTrust;
  };

  const injectedProviderExist = typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  // No injected providers exist.
  if (!injectedProviderExist) {
    return undefined;
  }

  const ethereumProvider = (window as WindowWithTrustWallet).ethereum;

  if (!ethereumProvider) {
    return undefined;
  }

  // Trust Wallet was injected into window.ethereum.
  if (isTrustWallet(ethereumProvider)) {
    return ethereumProvider;
  }

  // Trust Wallet provider might be replaced by another
  // injected provider, check the providers array.
  const providers = (
    ethereumProvider as ExtendedEip1193Provider & {
      providers?: Eip1193Provider[];
    }
  ).providers;
  if (providers) {
    // ethereum.providers array is a non-standard way to
    // preserve multiple injected providers. Eventually, EIP-5749
    // will become a living standard and we will have to update this.
    return providers.find(isTrustWallet) ?? undefined;
  }

  // Trust Wallet injected provider is available in the global scope.
  // There are cases that some cases injected providers can replace window.ethereum
  // without updating the ethereum.providers array. To prevent issues where
  // the TW connector does not recognize the provider when TW extension is installed,
  // we begin our checks by relying on TW's global object.
  return (window as WindowWithTrustWallet).trustwallet ?? undefined;
}

export class TrustWalletConnectClient extends BrowserConnectClient {
  constructor() {
    super();
    this.address = "";
  }

  public async connect() {
    this.provider = await getTrustWalletInjectedProvider();
    return super.connect();
  }
}
