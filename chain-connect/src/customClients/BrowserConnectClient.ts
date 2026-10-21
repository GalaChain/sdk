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
import { generateEIP712Types, valueForTypedDataSigning } from "../utils";

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
  ): Promise<T & { prefix: string; signature?: string; multisig?: string[] }> {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }

    try {
      const record = payload as T & Record<string, unknown>;
      const existing = existingSignatures(record);
      if (existing.length > 0) {
        assertMultisigReady(record);
      }

      const message = omitVerificationMetadata(record);
      const domain = { name: "GalaChain" };
      const types = generateEIP712Types(method, message);
      const prefix = this.calculatePersonalSignPrefix(message);
      const prefixedPayload = { ...message, prefix };
      const signer = await this.provider.getSigner();

      if (signingType === SigningType.SIGN_TYPED_DATA) {
        const signature = await signer.signTypedData(
          domain,
          types,
          valueForTypedDataSigning(types, method, prefixedPayload)
        );
        return withSignature(prefixedPayload, existing, signature, { types, domain }) as T & {
          prefix: string;
          signature?: string;
          multisig?: string[];
        };
      } else if (signingType === SigningType.PERSONAL_SIGN) {
        const signature = await signer.signMessage(serialize(prefixedPayload));
        return withSignature(prefixedPayload, existing, signature) as T & {
          prefix: string;
          signature?: string;
          multisig?: string[];
        };
      } else {
        throw new Error("Unsupported signing type");
      }
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}

function existingSignatures(payload: object): string[] {
  const record = payload as { signature?: unknown; multisig?: unknown };
  if (Array.isArray(record.multisig) && record.multisig.length > 0) {
    return record.multisig.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof record.signature === "string" && record.signature.length > 0) {
    return [record.signature];
  }
  return [];
}

function assertMultisigReady(payload: object): void {
  const record = payload as {
    signerAddress?: unknown;
    dtoOperation?: unknown;
    dtoExpiresAt?: unknown;
    signerPublicKey?: unknown;
  };
  if (!record.signerAddress) {
    throw new Error("signerAddress is required for multisignature DTOs");
  }
  if (!record.dtoOperation) {
    throw new Error("dtoOperation is required for multisignature DTOs");
  }
  if (!record.dtoExpiresAt) {
    throw new Error("dtoExpiresAt is required for multisignature DTOs");
  }
  if (record.signerPublicKey) {
    throw new Error("signerPublicKey is not allowed for multisignature DTOs");
  }
}

function omitVerificationMetadata<T extends object>(
  payload: T
): Omit<T, "signature" | "multisig" | "trace" | "prefix"> {
  const {
    signature: _signature,
    multisig: _multisig,
    trace: _trace,
    prefix: _prefix,
    ...message
  } = payload as T & {
    signature?: unknown;
    multisig?: unknown;
    trace?: unknown;
    prefix?: unknown;
  };
  return message;
}

function withSignature<T extends object>(
  payload: T,
  existing: string[],
  signature: string,
  typedData?: { types: unknown; domain: unknown }
): T & { signature?: string; multisig?: string[] } {
  if (existing.length > 0) {
    return { ...payload, ...typedData, multisig: [...existing, signature] };
  }
  return { ...payload, ...typedData, signature };
}
