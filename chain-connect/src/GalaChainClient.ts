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
import { ChainCallDTO, ClassConstructor, createValidDTO, serialize, signatures } from "@gala-chain/api";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { BrowserProvider, SigningKey, computeAddress, getBytes, hashMessage } from "ethers";

import { EventEmitter, Listener, MetaMaskEvents } from "./helpers";
import { GalaChainResponseError, GalaChainResponseSuccess, SigningType } from "./types";
import { ConstructorArgs } from "./types/utils";
import { ethereumToGalaChainAddress, galaChainToEthereumAddress } from "./utils";

/**
 * Type utility that extracts the element type constructor from array types,
 * or returns the constructor for non-array types.
 */
type NonArrayClassConstructor<T> = T extends Array<unknown>
  ? ClassConstructor<T[number]>
  : ClassConstructor<T>;

/**
 * Configuration options for GalaChain providers.
 */
export interface GalaChainProviderOptions {
  /** The type of signing to use for transactions */
  signingType?: SigningType;
  /** Legacy authentication credentials for backward compatibility */
  legacyCredentials?: {
    /** Identity lookup key for user identification */
    identityLookupKey: string;
    /** User encryption key for secure operations */
    userEncryptionKey: string;
  };
}

/**
 * Abstract base class for GalaChain providers that handle communication with GalaChain networks.
 * Provides common functionality for signing transactions and submitting requests.
 */
export abstract class GalaChainProvider {
  private legacyCredentials: Record<string, string>;

  /**
   * Creates a new GalaChain provider instance.
   * @param options - Configuration options for the provider
   */
  constructor(protected options?: GalaChainProviderOptions) {
    if (options?.legacyCredentials) {
      this.legacyCredentials = {
        "X-Identity-Lookup-Key": options.legacyCredentials.identityLookupKey,
        "X-User-Encryption-Key": options.legacyCredentials.userEncryptionKey
      };
    }
  }

  /**
   * Signs a payload using the provider's signing mechanism.
   * @param method - The method name being called
   * @param dto - The data transfer object to sign
   * @param signingType - Optional signing type override
   * @returns The signed payload with signature and optional prefix
   */
  abstract sign<T extends object>(
    method: string,
    dto: T,
    signingType?: SigningType
  ): Promise<T & { signature: string; prefix?: string }>;
  /**
   * Submits a request to the GalaChain network.
   * @param params - The submission parameters
   * @param params.url - The base URL for the request
   * @param params.method - The method name to call
   * @param params.payload - The request payload
   * @param params.sign - Whether to sign the request
   * @param params.headers - Additional HTTP headers
   * @param params.requestConstructor - Constructor for request validation
   * @param params.responseConstructor - Constructor for response transformation
   * @param params.signingType - Type of signing to use
   * @returns Promise resolving to a successful response
   * @throws {GalaChainResponseError} When the request fails
   */
  async submit<T, U extends object>({
    url,
    method,
    payload,
    sign,
    headers = {},
    requestConstructor,
    responseConstructor,
    signingType = this.options?.signingType ?? SigningType.SIGN_TYPED_DATA
  }: {
    url: string;
    method: string;
    payload: ConstructorArgs<U>;
    sign?: boolean;
    headers?: Record<string, string>;
    requestConstructor?: ClassConstructor<ChainCallDTO>;
    responseConstructor?: NonArrayClassConstructor<T>;
    signingType?: SigningType;
  }): Promise<GalaChainResponseSuccess<T>> {
    // Throws error if class validation fails
    if (requestConstructor) {
      await createValidDTO(requestConstructor, payload);
    }

    let newPayload = instanceToPlain(payload);

    if (sign === true) {
      //Only try signing if signature is not already present
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("signature" in payload) ||
        payload.signature === null
      ) {
        try {
          newPayload = await this.sign(method, newPayload, signingType);
        } catch (error: unknown) {
          throw new Error((error as Error).message);
        }
      }
    }

    const fullUrl = `${url}/${method}`;
    const response = await fetch(fullUrl, {
      method: "POST",
      body: serialize(newPayload),
      headers: {
        "Content-Type": "application/json",
        ...this.legacyCredentials,
        ...headers
      }
    });

    const hash = response.headers.get("x-transaction-id") ?? undefined;

    // Check if the content-length is not zero and try to parse JSON
    if (response.headers.get("content-length") !== "0") {
      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw new Error("Invalid JSON response");
      }
      if (!response.ok || data.error) {
        throw new GalaChainResponseError<T>(data);
      } else {
        const transformedDataResponse = responseConstructor
          ? plainToInstance(responseConstructor, data.Data)
          : data.Data;
        return new GalaChainResponseSuccess<T>({ ...data, Data: transformedDataResponse }, hash);
      }
    }
    throw new Error(`Unable to get data. Received response: ${JSON.stringify(response)}`);
  }
}

/**
 * Abstract custom client that extends GalaChain provider with additional client-specific functionality.
 * Provides methods for public key management and address handling.
 */
export abstract class CustomClient extends GalaChainProvider {
  /**
   * Creates a new custom client instance.
   * @param options - Configuration options for the provider
   */
  constructor(options?: GalaChainProviderOptions) {
    super(options);
  }

  /**
   * Retrieves the public key and recovered address for the client.
   * @returns Promise resolving to public key and recovered address
   */
  abstract getPublicKey(): Promise<{ publicKey: string; recoveredAddress: string }>;

  /** The Ethereum address associated with this client */
  abstract ethereumAddress: string;

  /** The GalaChain address associated with this client */
  abstract galaChainAddress: string;

  /**
   * Calculates the personal sign prefix for a given payload.
   * This is used for Ethereum personal_sign compatibility.
   * @param payload - The payload to calculate prefix for
   * @returns The calculated prefix string
   */
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

/**
 * Abstract web signer that provides browser-based signing capabilities.
 * Handles connection to web wallets and manages Ethereum addresses.
 */
export abstract class WebSigner extends CustomClient {
  protected address: string;
  protected provider: BrowserProvider | undefined;

  /**
   * Creates a new web signer instance.
   * @param options - Configuration options for the provider
   */
  constructor(options?: GalaChainProviderOptions) {
    super(options);
  }

  /**
   * Connects to the web wallet and returns the connected address.
   * @returns Promise resolving to the connected Ethereum address
   */
  abstract connect(): Promise<string>;

  /**
   * Sets the Ethereum address, converting from GalaChain format if needed.
   * @param val - The address to set
   */
  set ethereumAddress(val: string) {
    this.address = galaChainToEthereumAddress(val);
  }

  /**
   * Gets the current Ethereum address.
   * @returns The Ethereum address
   */
  get ethereumAddress(): string {
    return this.address;
  }

  /**
   * Gets the GalaChain address derived from the Ethereum address.
   * @returns The GalaChain address
   */
  get galaChainAddress() {
    return ethereumToGalaChainAddress(this.address);
  }

  private eventEmitter = new EventEmitter<MetaMaskEvents>();

  /**
   * Adds an event listener for MetaMask events.
   * @param event - The event type to listen for
   * @param listener - The callback function to execute
   * @returns This instance for method chaining
   */
  public on(event: keyof MetaMaskEvents, listener: Listener<string | string[] | null>): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  /**
   * Removes an event listener for MetaMask events.
   * @param event - The event type to stop listening for
   * @param listener - The callback function to remove
   * @returns This instance for method chaining
   */
  public off(event: keyof MetaMaskEvents, listener: Listener<string | string[] | null>): this {
    this.eventEmitter.off(event, listener);
    return this;
  }

  /**
   * Emits a MetaMask event to all registered listeners.
   * @param event - The event type to emit
   * @param data - The data to pass to listeners
   * @returns True if the event had listeners, false otherwise
   */
  public emit(event: keyof MetaMaskEvents, data: string[] | string | null): boolean {
    return this.eventEmitter.emit(event, data);
  }

  /**
   * Retrieves the public key by signing a message and recovering it from the signature.
   * @returns Promise resolving to the public key and recovered address
   */
  async getPublicKey() {
    const message = "Sign this to retrieve your public key";

    const signature = await this.signMessage(message);

    const messageHash = hashMessage(message);

    const publicKey = SigningKey.recoverPublicKey(getBytes(messageHash), signature);

    const recoveredAddress = computeAddress(publicKey);

    return { publicKey, recoveredAddress };
  }

  /**
   * Signs a message using the connected wallet.
   * @param message - The message to sign
   * @returns Promise resolving to the signature
   * @throws {Error} If no provider is found or no account is connected
   */
  public async signMessage(message: string) {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }
    try {
      const signer = await this.provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}
