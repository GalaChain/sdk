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
import { serialize, SignatureDto, SigningScheme } from "@gala-chain/api";
import { SigningKey, computeAddress, ethers, hashMessage } from "ethers";

import { CustomClient, GalaChainProviderOptions } from "../GalaChainClient";
import { calculatePersonalSignPrefix } from "../helpers";
import { SigningType } from "../types";
import { ethereumToGalaChainAddress, generateEIP712Types } from "../utils";

export class SigningClient extends CustomClient {
  get ethereumAddress(): string {
    return this.wallet.address;
  }

  get galaChainAddress() {
    return ethereumToGalaChainAddress(this.wallet.address);
  }

  async getPublicKey(): Promise<{ publicKey: string; recoveredAddress: string }> {
    const message = "I <3 GalaChain";
    const signedMessage = await this.wallet.signMessage(message);
    const publicKey = SigningKey.recoverPublicKey(hashMessage(message), signedMessage);
    const recoveredAddress = computeAddress(publicKey);
    return { publicKey, recoveredAddress };
  }

  private wallet: ethers.Wallet;

  constructor(privateKey: string, options?: GalaChainProviderOptions) {
    super(options);
    this.wallet = new ethers.Wallet(privateKey);
  }

  public async sign<U extends object>(
    method: string,
    payload: U,
    signingType: SigningType = this.options?.signingType ?? SigningType.SIGN_TYPED_DATA
  ): Promise<U & { signature: string; prefix?: string; signatures: SignatureDto[] }> {
    try {
      const basePayload = { ...payload } as Record<string, unknown>;
      delete basePayload.types;
      delete basePayload.domain;

      const prefix = calculatePersonalSignPrefix(basePayload);
      const prefixedPayload = { ...basePayload, prefix };

      let signature: string;
      const additional: Record<string, unknown> = {};

      if (signingType === SigningType.SIGN_TYPED_DATA) {
        const domain = { name: "GalaChain" };
        const types = generateEIP712Types(method, basePayload);
        signature = await this.wallet.signTypedData(domain, types, prefixedPayload);
        additional.types = types;
        additional.domain = domain;
      } else if (signingType === SigningType.PERSONAL_SIGN) {
        signature = await this.wallet.signMessage(serialize(prefixedPayload));
      } else {
        throw new Error("Unsupported signing type");
      }

      const existing = Array.isArray((payload as any).signatures)
        ? ((payload as any).signatures as SignatureDto[])
        : [];

      const signatureDto: SignatureDto = {
        signature,
        signerPublicKey: this.wallet.signingKey.publicKey,
        signerAddress: this.ethereumAddress,
        signing: SigningScheme.ETH,
        prefix
      };

      return {
        ...prefixedPayload,
        ...additional,
        signature,
        signatures: [...existing, signatureDto]
      } as U & { signature: string; prefix?: string; signatures: SignatureDto[] };
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}
