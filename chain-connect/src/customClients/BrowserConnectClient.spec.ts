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
import { Eip1193Provider, TypedDataField, Wallet, getBytes } from "ethers";

import { SigningType } from "../types";
import { generateEIP712Types } from "../utils";
import { BrowserConnectClient } from "./BrowserConnectClient";

const firstKey = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const secondKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";

/** EIP-1193 provider backed by a local ethers wallet. */
function walletProvider(wallet: Wallet): Eip1193Provider & { on: jest.Mock; removeListener: jest.Mock } {
  return {
    on: jest.fn(),
    removeListener: jest.fn(),
    async request({ method, params }: { method: string; params?: Array<unknown> }) {
      switch (method) {
        case "eth_requestAccounts":
        case "eth_accounts":
          return [wallet.address];
        case "eth_chainId":
          return "0x1";
        case "personal_sign":
          return wallet.signMessage(getBytes(params?.[0] as string));
        case "eth_signTypedData_v4": {
          const typedData = JSON.parse(params?.[1] as string);
          const { EIP712Domain: _domainType, ...types } = typedData.types as Record<string, TypedDataField[]>;
          return wallet.signTypedData(typedData.domain, types, typedData.message);
        }
        default:
          throw new Error(`Method not mocked: ${method}`);
      }
    }
  };
}

function recoveredAddress(signature: string, dto: object): string {
  return "0x" + signatures.getEthAddress(signatures.recoverPublicKey(signature, dto));
}

const multisigPayload = {
  quantity: "1",
  tokenInstances: [{ collection: "GALA", instance: "0" }],
  signerAddress: "eth|63580d94c574ad78b121c267",
  dtoOperation: "asset-channel_basic-asset_GalaChainToken:TransferToken",
  dtoExpiresAt: 4000000000000,
  uniqueKey: "multisig-1"
};

describe("BrowserConnectClient multisig", () => {
  it("adds a typed-data signature that verifies against the first signer's types and domain", async () => {
    // Given
    const first = new Wallet(firstKey);
    const second = new Wallet(secondKey);
    const types = generateEIP712Types("TransferToken", multisigPayload);
    const domain = { name: "GalaChainDev" };
    const firstSignature = await first.signTypedData(domain, types, multisigPayload);
    const signedOnce = {
      ...multisigPayload,
      types,
      domain,
      prefix: "first-prefix",
      signature: firstSignature
    };
    const client = new BrowserConnectClient(walletProvider(second), { network: "STG" });
    await client.connect();

    // When
    const signed = await client.sign("TransferToken", signedOnce);

    // Then
    expect(signed.signature).toBeUndefined();
    expect(signed.types).toEqual(types);
    expect(signed.domain).toEqual(domain);
    expect(signed.prefix).toBe("first-prefix");
    expect(signed.multisig?.[0]).toBe(firstSignature);
    expect(recoveredAddress(signed.multisig?.[0] as string, signed)).toBe(first.address);
    expect(recoveredAddress(signed.multisig?.[1] as string, signed)).toBe(second.address);
  });

  it("adds a personal signature when the existing signatures use personal sign", async () => {
    // Given
    const first = new Wallet(firstKey);
    const second = new Wallet(secondKey);
    const message = signatures.personalSignMessage(multisigPayload);
    const prefix = signatures.ethereumPersonalSignPrefix(message);
    const firstSignature = await first.signMessage(message);
    const client = new BrowserConnectClient(walletProvider(second));
    await client.connect();

    // When
    const signed = await client.sign(
      "TransferToken",
      { ...multisigPayload, prefix, multisig: [firstSignature] },
      SigningType.SIGN_TYPED_DATA
    );

    // Then
    expect("types" in signed).toBe(false);
    expect(signed.prefix).toBe(prefix);
    expect(recoveredAddress(signed.multisig?.[0] as string, signed)).toBe(first.address);
    expect(recoveredAddress(signed.multisig?.[1] as string, signed)).toBe(second.address);
  });

  it("rejects a payload whose signatures a wallet cannot match", async () => {
    // Given
    const client = new BrowserConnectClient(walletProvider(new Wallet(secondKey)));
    await client.connect();

    // When & Then
    await expect(
      client.sign("TransferToken", { ...multisigPayload, signature: "0xexisting" })
    ).rejects.toThrow("Cannot add a wallet signature");
    await expect(
      client.sign("TransferToken", { ...multisigPayload, prefix: "0x1234", signature: "0xexisting" })
    ).rejects.toThrow("Cannot add a wallet signature");
  });
});
