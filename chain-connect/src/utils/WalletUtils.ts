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
import { ethers } from "ethers";

import { ethereumToGalaChainAddress } from "./CommonUtils";

export class WalletUtils {
  static createRandom() {
    const wallet = ethers.Wallet.createRandom();
    return {
      galachainAddress: ethereumToGalaChainAddress(wallet.address),
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
      ethAddress: wallet.address,
      mnemonic: wallet.mnemonic
    };
  }

  /**
   * Registers a new wallet.
   *
   * @param {string} uri - The URI to register the wallet.
   * @param {string} walletPublicKey - The public key of the wallet to be registered.
   *
   * Usage:
   *
   * - For Stage: `https://dex-api-platform-dex-stage-gala.gala.com/v1/CreateHeadlessWallet`
   * - For Prod: `https://api-galaswap.gala.com/v1/CreateHeadlessWallet`
   *
   * @returns {Promise<string>} - A promise that resolves to a success message if the wallet is registered successfully, or an error message otherwise.
   */
  static async registerWallet(uri: string, walletPublicKey: string): Promise<string> {
    try {
      const response = await fetch(uri, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ publicKey: walletPublicKey })
      });
      if (response.status === 201) {
        return "Wallet registered successfully";
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      return `Error registering wallet: ${error.message}`;
    }
  }

  /**
   * Registers a new wallet.
   *
   * @param {string} uri - The URI to register the wallet.
   *
   * Usage:
   *
   * - For Stage: `https://stage-galaswap.gala.com/v1/CreateHeadlessWallet`
   * - For Prod: `https://api-galaswap.gala.com/v1/CreateHeadlessWallet`
   *
   */
  static async createAndRegisterRandomWallet(uri: string) {
    const wallet = WalletUtils.createRandom();
    await WalletUtils.registerWallet(uri, wallet.publicKey);
    return wallet;
  }
}
