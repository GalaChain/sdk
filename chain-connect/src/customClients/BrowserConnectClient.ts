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
import { configuredDtoOperation, signatures, withDtoOperation } from "@gala-chain/api";
import {
  BrowserProvider,
  Eip1193Provider,
  JsonRpcSigner,
  TypedDataEncoder,
  TypedDataField,
  getAddress
} from "ethers";

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
  protected activeProvider?: ExtendedEip1193Provider;

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
    const active = provider ?? window.ethereum;
    if (!active) {
      throw new Error("Ethereum provider not found");
    }
    this.useEip1193Provider(active);
  }

  protected useEip1193Provider(provider: Eip1193Provider): void {
    if (this.isInitialized && this.activeProvider) {
      this.activeProvider.removeListener("accountsChanged", this.onAccountsChanged);
      this.isInitialized = false;
    }
    this.activeProvider = provider as ExtendedEip1193Provider;
    this.provider = new BrowserProvider(provider);
  }

  /**
   * Initializes the listeners to watch for events from the provider. Not all providers may support every event
   */
  protected initializeListeners(): void {
    if (!this.activeProvider || this.isInitialized) {
      return;
    }
    this.activeProvider.on("accountsChanged", this.onAccountsChanged);
    this.isInitialized = true;
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
    if (this.isInitialized && this.activeProvider) {
      this.activeProvider.removeListener("accountsChanged", this.onAccountsChanged);
      this.isInitialized = false;
    }
    this.ethereumAddress = "";
  }

  /**
   * Signs a payload using the connected wallet.
   * @template T - The type of the payload to sign
   * @param method - The method name for EIP-712 signing
   * @param payload - The data to sign
   * @param signingType - The type of signing to use (defaults to signTypedData). When the payload
   *   is already signed, the new signature uses the same mode as the existing ones instead.
   * @returns Promise resolving to the signed payload with signature
   * @throws {Error} If no provider/account is connected or signing fails
   */
  public async sign<T extends object>(
    method: string,
    payload: T,
    signingType: SigningType = this.options?.signingType ?? SigningType.SIGN_TYPED_DATA
  ): Promise<T & { prefix: string; signature?: string; multisig?: string[] }> {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }

    try {
      const stamped = withDtoOperation(payload, configuredDtoOperation(this.operationParts(), method));
      const record = stamped as T & Record<string, unknown>;
      const existing = existingSignatures(record);
      const signer = await this.provider.getSigner();

      if (existing.length > 0) {
        assertMultisigReady(record);
        return (await this.appendSignature(signer, record, existing)) as T & {
          prefix: string;
          signature?: string;
          multisig?: string[];
        };
      }

      const message = omitVerificationMetadata(record);

      if (signingType === SigningType.SIGN_TYPED_DATA) {
        const body = omitTypedData(message);
        const domain = this.eip712Domain();
        const types = generateEIP712Types(method, body);
        const prefix = this.calculatePersonalSignPrefix(body);
        const prefixedPayload = { ...body, prefix };
        const signature = await signer.signTypedData(
          domain,
          types,
          valueForTypedDataSigning(types, method, prefixedPayload)
        );
        return { ...prefixedPayload, types, domain, signature } as T & {
          prefix: string;
          signature?: string;
          multisig?: string[];
        };
      } else if (signingType === SigningType.PERSONAL_SIGN) {
        const body = omitTypedData(message);
        const personalMessage = signatures.personalSignMessage(body);
        const prefix = this.calculatePersonalSignPrefix(body);
        const signature = await signer.signMessage(personalMessage);
        return { ...body, prefix, signature } as T & {
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

  /**
   * Adds a signature to a payload that other signers already signed. Every signature
   * is checked against the same types, domain and prefix, so they are reused as they are.
   */
  private async appendSignature(
    signer: JsonRpcSigner,
    record: Record<string, unknown>,
    existing: string[]
  ): Promise<Record<string, unknown>> {
    const { types, domain, prefix } = record;
    const body = omitTypedData(omitVerificationMetadata(record));

    if (isRecord(types) && isRecord(domain)) {
      const { EIP712Domain: _eip712Domain, ...messageTypes } = types as Record<string, TypedDataField[]>;
      const primaryType = TypedDataEncoder.getPrimaryType(messageTypes);
      const signature = await signer.signTypedData(
        domain,
        messageTypes,
        valueForTypedDataSigning(messageTypes, primaryType, body)
      );
      return {
        ...body,
        ...(prefix !== undefined ? { prefix } : {}),
        types,
        domain,
        multisig: [...existing, signature]
      };
    }

    if (types === undefined && domain === undefined && typeof prefix === "string") {
      if (prefix !== this.calculatePersonalSignPrefix(body)) {
        throw new Error(
          "Cannot add a wallet signature: the existing signatures use a prefix a wallet personal sign does not produce"
        );
      }
      const signature = await signer.signMessage(signatures.personalSignMessage(body));
      return { ...body, prefix, multisig: [...existing, signature] };
    }

    throw new Error(
      "Cannot add a wallet signature: the payload must carry the EIP-712 types and domain, " +
        "or the personal sign prefix, used by the existing signatures"
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function omitTypedData<T extends object>(payload: T): Omit<T, "domain" | "types"> {
  const {
    domain: _domain,
    types: _types,
    ...message
  } = payload as T & {
    domain?: unknown;
    types?: unknown;
  };
  return message;
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
