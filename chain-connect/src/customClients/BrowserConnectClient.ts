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
import { ChainCallDTO, NonFunctionProperties } from "@gala-chain/api";
import { BrowserProvider, Eip1193Provider, getAddress } from "ethers";

import { WebSigner } from "../GalaChainClient";
import { ExtendedEip1193Provider } from "../helpers";
import { generateEIP712Types } from "../utils";

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
  }
}

export class BrowserConnectClient extends WebSigner {
  protected isInitialized = false;

  constructor(provider?: Eip1193Provider) {
    super();
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
      this.walletAddress = getAddress(accounts[0]);
      this.emit("accountChanged", this.galachainEthAlias);
      this.emit("accountsChanged", accounts);
    } else {
      this.walletAddress = "";
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
      this.walletAddress = getAddress(accounts[0]);
      return this.galachainEthAlias;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  public disconnect() {
    if (this.isInitialized && window.ethereum) {
      window.ethereum.removeListener("accountsChanged", this.onAccountsChanged);
      this.isInitialized = false;
    }
    this.walletAddress = "";
  }

  public async sign<U extends NonFunctionProperties<ChainCallDTO>>(
    method: string,
    payload: U
  ): Promise<U & { signature: string; prefix: string }> {
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
      const signature = await signer.signTypedData(domain, types, prefixedPayload);

      return { ...prefixedPayload, signature, types, domain };
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}
