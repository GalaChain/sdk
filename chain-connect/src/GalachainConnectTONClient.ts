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
import { ChainCallDTO, ConstructorArgs, serialize, signatures } from "@gala-chain/api";
import { Address, beginCell } from "@ton/core";
import { getSecureRandomBytes, keyPairFromSeed, sign, signVerify } from "@ton/crypto";
import { TonProofItemReplySuccess } from "@tonconnect/protocol";
import { Account, TonConnect } from "@tonconnect/sdk";

export class GalachainConnectTONClient {
  #tonAddress: string;
  #tonPublicKey: string;
  #chainCodeUrl: string;
  #accessToken: string | null = null;

  get galachainAddress() {
    return this.#tonAddress.replace("0x", "ton|");
  }

  get tonAddress() {
    return this.#tonAddress;
  }

  get accessToken() {
    return this.#accessToken;
  }

  constructor(chainCodeUrl: string, manifestUrl: string) {
    // super();
    const connector = new TonConnect({ manifestUrl });

    this.#chainCodeUrl = chainCodeUrl;
    this.initializeTONListeners(connector);
  }

  private initializeTONListeners(connector): void {
    connector.onStatusChange((wallet) => {
      if (!wallet) {
        this.#accessToken = null;
        return;
      }

      const tonProof = wallet.connectItems?.tonProof;

      if (tonProof) {
        if ("proof" in tonProof) {
          this.#tonAddress = wallet.account.address;
          this.#tonPublicKey = wallet.account.publicKey;
          this.checkProof(tonProof.proof, wallet.account);
          return;
        }

        console.error(tonProof.error);
      }

      if (!this.#accessToken) {
        connector.disconnect();
      }
    });
  }

  private async checkProof(proof: TonProofItemReplySuccess["proof"], account: Account) {
    // send proof to your backend
    // e.g. myBackendCheckProof(tonProof.proof, wallet.account);
    try {
      const reqBody = {
        address: account.address,
        network: account.chain,
        proof: {
          ...proof,
          state_init: account.walletStateInit
        }
      };

      // Build function based on proof service at:
      // https://github.com/ton-connect/demo-dapp-with-react-ui/blob/master/src/server/services/ton-proof-service.ts
      const response = await (
        await fetch(`${this.#chainCodeUrl}/ton-proof/checkProof`, {
          method: "POST",
          body: JSON.stringify(reqBody)
        })
      ).json();

      if (response?.token) {
        this.#accessToken = response.token;
      }
    } catch (e) {
      console.log("checkProof error:", e);
    }
  }

  public async send<T, U extends ConstructorArgs<ChainCallDTO>>({
    url = this.#chainCodeUrl,
    method,
    payload,
    sign = false,
    headers = {}
  }: {
    url?: string;
    method: string;
    payload: U;
    sign?: boolean;
    headers?: object;
  }): Promise<T> {
    if (!this.#tonAddress) {
      throw new Error("No account connected");
    }

    try {
      if (sign === true) {
        const dto = signatures.getPayloadToSign(payload);
        // const dtoBuff = Buffer.from(dto)
        // const messageCell = beginCell()
        // .storeBuffer(dtoBuff)
        // .endCell();

        // const signer = await this.#provider.getSigner();
        // const signature = await signer.provider.send("personal_sign", [this.#tonAddress, dto]);

        // const signature =

        // return await this.submit(url, method, { ...prefixedPayload, signature }, headers);
      }

      return await this.submit(url, method, payload, headers);
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }

  private async submit<T, U extends ConstructorArgs<ChainCallDTO>>(
    chainCodeUrl: string,
    method: string,
    signedPayload: U,
    headers: object
  ): Promise<T> {
    if (signedPayload instanceof ChainCallDTO) {
      await signedPayload.validateOrReject();
    }

    const url = `${chainCodeUrl}/${method}`;
    const response = await fetch(url, {
      method: "POST",
      body: serialize(signedPayload),
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    });

    const id = response.headers.get("x-transaction-id");
    const data = await response.json();

    if (data.error) {
      return data.error;
    }

    return id ? { Hash: id, ...data } : data;
  }

  private calculatePersonalSignPrefix(payload: object): string {
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
