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
import { signatures } from "@gala-chain/api";
import { BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: BrowserProvider;
  }
}

export class GalachainConnectClient {
  private address: string;
  private provider: any;

  async connectToMetaMask() {
    this.provider = window.ethereum;
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    try {
      const accounts = (await this.provider.send("eth_requestAccounts", [])) as string[];
      this.address = accounts[0];
      return this.address;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async sendTransaction(payload: Record<string, any>, chaincodeUrl: string, method: string) {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }

    try {
      const prefix = this.calculatePersonalSignPrefix(payload);
      const prefixedPayload = { ...payload, prefix };
      const dto = signatures.getPayloadToSign(prefixedPayload);

      const signer = await this.provider.getSigner();
      const signature = await signer.provider.send("personal_sign", [this.address, dto]);

      return await this.submit({ ...prefixedPayload, signature }, chaincodeUrl, method);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private async submit(signedPayload: Record<string, any>, chaincodeUrl: string, method: string) {
    // TODO: use gateway rather than ops

    // Note: GalaChain Uri maybe should be constructed based on channel and method,
    // rather than passing full url as arg
    // ie `${baseUri}/api/${channel}/token-contract/${method}`
    const url = `${chaincodeUrl}/${method}`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(signedPayload),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const id = response.headers.get("x-transaction-id");
    const data = await response.json();

    if (data.error) {
      return data.error;
    }

    return id ? { Hash: id, ...data } : data;
  }

  private calculatePersonalSignPrefix(payload: Record<string, any>): string {
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
