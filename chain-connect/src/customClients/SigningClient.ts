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
import { SigningKey, computeAddress, ethers, hashMessage } from "ethers";

import { CustomClient } from "../GalaChainClient";
import { calculatePersonalSignPrefix } from "../helpers";
import { generateEIP712Types } from "../utils";

export class SigningClient extends CustomClient {
  get walletAddress(): string {
    return this.wallet.address;
  }
  async getPublicKey(): Promise<{ publicKey: string; recoveredAddress: string }> {
    const message = "I <3 GalaChain";
    const signedMessage = await this.wallet.signMessage(message);
    const publicKey = SigningKey.recoverPublicKey(hashMessage(message), signedMessage);
    const recoveredAddress = computeAddress(publicKey);
    return { publicKey, recoveredAddress };
  }

  private wallet: ethers.Wallet;

  constructor(privateKey: string) {
    super();
    this.wallet = new ethers.Wallet(privateKey);
  }

  public async sign<U extends object>(
    method: string,
    payload: U
  ): Promise<U & { signature: string; prefix: string }> {
    try {
      const domain = { name: "GalaChain" };
      const types = generateEIP712Types(method, payload);

      const prefix = calculatePersonalSignPrefix(payload);
      const prefixedPayload = { ...payload, prefix };

      const signature = await this.wallet.signTypedData(domain, types, prefixedPayload);

      return { ...prefixedPayload, signature, types, domain };
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}
