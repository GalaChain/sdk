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
import { serialize, SignatureDto, SigningScheme, signatures } from "@gala-chain/api";
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

/**
 * Browser-based client for connecting to wallets like MetaMask.
 * Handles wallet connection, account management, and transaction signing.
 */
export class BrowserConnectClient extends WebSigner {
  protected isInitialized = false;

  /**
   * Creates a new browser connect client.
   * @param provider - Optional EIP-1193 provider (defaults to window.ethereum)
   * @param options - Configuration options for the provider
   * @throws {Error} If no Ethereum provider is found
   */
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

  /**
   * Handles account changes from the wallet provider.
   * @param accounts - Array of account addresses from the wallet
   */
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

  /**
   * Connects to the wallet and requests account access.
   * @returns Promise resolving to the connected GalaChain address
   * @throws {Error} If no provider is found or connection fails
   */
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

  /**
   * Disconnects from the wallet and cleans up event listeners.
   */
  public disconnect() {
    if (this.isInitialized && window.ethereum) {
      window.ethereum.removeListener("accountsChanged", this.onAccountsChanged);
      this.isInitialized = false;
    }
    this.ethereumAddress = "";
  }

  /**
   * Signs a payload using the connected wallet.
   * @template T - The type of the payload to sign
   * @param method - The method name for EIP-712 signing
   * @param payload - The data to sign
   * @param signingType - The type of signing to use (defaults to signTypedData)
   * @returns Promise resolving to the signed payload with signature
   * @throws {Error} If no provider/account is connected or signing fails
   */
  public async sign<T extends object>(
    method: string,
    payload: T,
    signingType: SigningType = SigningType.SIGN_TYPED_DATA
  ): Promise<T & { signature: string; prefix: string; signatures: SignatureDto[] }> {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }

    try {
      const basePayload = { ...payload } as Record<string, unknown>;
      delete basePayload.types;
      delete basePayload.domain;
      delete (basePayload as any).signature;
      delete (basePayload as any).signatures;
      delete (basePayload as any).signerAddress;
      delete (basePayload as any).signerPublicKey;
      delete (basePayload as any).prefix;

      const domain = { name: "GalaChain" };
      const types = generateEIP712Types(method, basePayload);

      const prefix = this.calculatePersonalSignPrefix(basePayload);
      const prefixedPayload = { ...basePayload, prefix };

      const signer = await this.provider.getSigner();

      let signature: string;
      const additional: Record<string, unknown> = {};

      if (signingType === SigningType.SIGN_TYPED_DATA) {
        signature = await signer.signTypedData(domain, types, prefixedPayload);
        additional.types = types;
        additional.domain = domain;
      } else if (signingType === SigningType.PERSONAL_SIGN) {
        signature = await signer.signMessage(serialize(prefixedPayload));
      } else {
        throw new Error("Unsupported signing type");
      }

      let signerPublicKey: string | undefined;
      try {
        signerPublicKey = signatures.recoverPublicKey(signature, prefixedPayload, prefix);
      } catch {
        signerPublicKey = undefined;
      }

      const existing = Array.isArray((payload as any).signatures)
        ? ((payload as any).signatures as SignatureDto[])
        : [];

      const signatureDto: SignatureDto = {
        signature,
        signerAddress: this.ethereumAddress,
        signerPublicKey,
        signing: SigningScheme.ETH,
        prefix
      };

      return {
        ...payload,
        ...additional,
        prefix,
        signature,
        signatures: [...existing, signatureDto]
      } as T & { signature: string; prefix: string; signatures: SignatureDto[] };
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}
