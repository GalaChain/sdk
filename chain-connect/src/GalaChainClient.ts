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
import { ChainCallDTO, serialize, signatures } from "@gala-chain/api";
import { instanceToPlain } from "class-transformer";
import { BrowserProvider, SigningKey, computeAddress, getAddress, getBytes, hashMessage } from "ethers";

import { EventEmitter, Listener, MetaMaskEvents } from "./helpers";

export abstract class GalaChainProvider {
  abstract sign(method: string, dto: any): Promise<any>;
  async submit<T, U>({
    url,
    method,
    payload,
    sign = false,
    headers = {}
  }: {
    url: string;
    method: string;
    payload: ChainCallDTO;
    sign?: boolean;
    headers?: object;
  }): Promise<{ data: T; hash: string; status: number; message?: string }> {
    await payload.validateOrReject();

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
          newPayload = await this.sign(method, instanceToPlain(payload));
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
        ...headers
      }
    });

    const id = response.headers.get("x-transaction-id");

    // Check if the content-length is not zero and try to parse JSON
    if (response.headers.get("content-length") !== "0") {
      try {
        const data = await response.json();
        if (data.error) {
          return Promise.reject(data.message ? new Error(data.message) : data.error);
        }
        return Promise.resolve(id ? { Hash: id, ...data } : data);
      } catch (error) {
        return Promise.reject("Invalid JSON response");
      }
    }
    throw new Error(`Unable to get data. Received response: ${JSON.stringify(response)}`);
  }
}
export abstract class CustomClient extends GalaChainProvider {
  abstract getPublicKey(): Promise<{ publicKey: string; recoveredAddress: string }>;
  abstract walletAddress: string;

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
export abstract class WebSigner extends CustomClient {
  protected address: string;
  protected provider: BrowserProvider | undefined;
  abstract connect(): Promise<string>;

  set walletAddress(val: string) {
    this.address = getAddress(`0x${val.replace(/0x|eth\|/, "")}`);
  }

  get walletAddress(): string {
    return this.address;
  }

  get galachainEthAlias() {
    return this.address.replace("0x", "eth|");
  }

  private eventEmitter = new EventEmitter<MetaMaskEvents>();

  public on(event: keyof MetaMaskEvents, listener: Listener<string | string[] | null>): this {
    this.eventEmitter.on(event, listener);
    return this;
  }

  public off(event: keyof MetaMaskEvents, listener: Listener<string | string[] | null>): this {
    this.eventEmitter.off(event, listener);
    return this;
  }

  public emit(event: keyof MetaMaskEvents, data: string[] | string | null): boolean {
    return this.eventEmitter.emit(event, data);
  }

  async getPublicKey() {
    const message = "Sign this to retrieve your public key";

    const signature = await this.signMessage(message);

    const messageHash = hashMessage(message);

    const publicKey = SigningKey.recoverPublicKey(getBytes(messageHash), signature);

    const recoveredAddress = computeAddress(publicKey);

    return { publicKey, recoveredAddress };
  }

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
