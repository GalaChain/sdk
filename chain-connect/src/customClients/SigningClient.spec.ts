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
import { Wallet } from "ethers";

import { mockFetch } from "../../test/test-utils";
import { PublicKeyApi } from "../chainApis";
import { SigningType } from "../types";
import { SigningClient } from "./SigningClient";

describe("SigningClient personal sign", () => {
  it("recovers through the chain verifier and drops typed-data metadata", async () => {
    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";
    const client = new SigningClient(privateKey, { signingType: SigningType.PERSONAL_SIGN });

    const signed = await client.sign("TransferToken", {
      quantity: "1",
      domain: { name: "GalaChain" },
      types: { TransferToken: [{ name: "quantity", type: "string" }] }
    });

    expect(signed).not.toHaveProperty("domain");
    expect(signed).not.toHaveProperty("types");
    const recovered = signatures.recoverPublicKey(signed.signature, signed);
    expect("0x" + signatures.getEthAddress(recovered)).toBe(new Wallet(privateKey).address);
  });

  it("uses the stage domain name and does not set chainId", async () => {
    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";
    const client = new SigningClient(privateKey, { network: "STG" });

    const signed = await client.sign("TransferToken", { quantity: "1" });

    expect((signed as { domain?: { name?: string; chainId?: unknown } }).domain).toEqual({
      name: "GalaChainStage"
    });
  });

  it("names the operation before it signs", async () => {
    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";
    const client = new SigningClient(privateKey, {
      signingType: SigningType.PERSONAL_SIGN,
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract"
    });

    const signed = await client.sign("GetMyProfile", {});

    expect((signed as { dtoOperation?: string }).dtoOperation).toBe(
      "product-channel_basic-product_PublicKeyContract:GetMyProfile"
    );
    const recovered = signatures.recoverPublicKey(signed.signature, signed);
    expect("0x" + signatures.getEthAddress(recovered)).toBe(new Wallet(privateKey).address);
  });

  it("uses the api contract instead of the signer contract", async () => {
    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";
    const connection = new SigningClient(privateKey, {
      signingType: SigningType.PERSONAL_SIGN,
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "GalaChainToken"
    });
    const api = new PublicKeyApi("https://example.com", connection, "PublicKeyContract");
    mockFetch({ Data: {}, Status: 1 });

    await api.GetMyProfile();

    const raw = (global.fetch as jest.Mock).mock.calls[0][1].body as string;
    expect(JSON.parse(raw).dtoOperation).toBe("product-channel_basic-product_PublicKeyContract:GetMyProfile");
  });
});
