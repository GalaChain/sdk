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

import { WebSigner } from "../GalachainClient";
import { generateEIP712Types } from "../Utils";
import { ExtendedEip1193Provider } from "../helpers";

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
  }
}

export class MetamaskConnectClient extends WebSigner {
  constructor() {
    super();
    this.address = "";
    if (window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum);
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
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    this.initializeListeners();

    try {
      const accounts = (await this.provider.send("eth_requestAccounts", [])) as string[];
      this.setWalletAddress = getAddress(accounts[0]);
      return this.getGalachainAddress;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  public async sign<U extends ConstructorArgs<ChainCallDTO>>(
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
      const domain = { name: "Galachain" };
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
