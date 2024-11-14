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
import { serialize } from "@gala-chain/api";
import { BrowserProvider, Eip1193Provider, getAddress } from "ethers";

import { GalaChainProviderOptions, WebSigner } from "../GalaChainClient";
import { ExtendedEip1193Provider } from "../helpers";
import { SigningType } from "../types";
import { generateEIP712Types } from "../utils";

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
  }
}

export class BrowserConnectClient extends WebSigner {
  protected isInitialized = false;

  constructor(provider?: Eip1193Provider, options?: GalaChainProviderOptions) {
    super(options);
    this.address = "";
    this.onAccountsChanged = this.onAccountsChanged.bind(this);
    if (provider) {
      this.provider = new BrowserProvider(provider);
    } else if (window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum);
    } else {
      throw new Error("Ethereum provider not found");
    }
  }

  /**
   * Initializes the listeners to watch for events from the provider. Not all providers may support every event
   */
  protected initializeListeners(): void {
    if (!window.ethereum) {
      return;
    }
    if (!this.isInitialized) {
      window.ethereum.on("accountsChanged", this.onAccountsChanged);
      this.isInitialized = true;
    }
  }

  protected onAccountsChanged(accounts: string[]) {
    if (accounts.length > 0) {
      this.ethereumAddress = getAddress(accounts[0]);
      this.emit("accountChanged", this.galaChainAddress);
      this.emit("accountsChanged", accounts);
    } else {
      this.ethereumAddress = "";
      this.emit("accountChanged", null);
      this.emit("accountsChanged", null);
    }
  }

  public async connect() {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }

    this.initializeListeners();

    try {
      const accounts = (await this.provider.send("eth_requestAccounts", [])) as string[];
      this.ethereumAddress = getAddress(accounts[0]);
      return this.galaChainAddress;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  public disconnect() {
    if (this.isInitialized && window.ethereum) {
      window.ethereum.removeListener("accountsChanged", this.onAccountsChanged);
      this.isInitialized = false;
    }
    this.ethereumAddress = "";
  }

  public async sign<T extends object>(
    method: string,
    payload: T,
    signingType: SigningType = SigningType.SIGN_TYPED_DATA
  ): Promise<T & { signature: string; prefix: string }> {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
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
      if (signingType === SigningType.SIGN_TYPED_DATA) {
        const signature = await signer.signTypedData(domain, types, prefixedPayload);
        return { ...prefixedPayload, signature, types, domain };
      } else if (signingType === SigningType.PERSONAL_SIGN) {
        const signature = await signer.signMessage(serialize(prefixedPayload));
        return { ...prefixedPayload, signature };
      } else {
        throw new Error("Unsupported signing type");
      }
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}
