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
import { LockTokenDto, LockTokensDto, TokenInstanceKey, createValidSubmitDTO } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ethers } from "ethers";

import { SigningClient } from "../customClients/SigningClient";
import { generateEIP712Types, valueForTypedDataSigning } from "./CommonUtils";

describe("EIP-712 Signing", () => {
  it("should correctly generate EIP-712 types and values and sign the data for single types", async () => {
    const dto: LockTokenDto = await createValidSubmitDTO(LockTokenDto, {
      quantity: new BigNumber("1"),
      tokenInstance: plainToInstance(TokenInstanceKey, {
        collection: "GALA",
        category: "Unit",
        additionalKey: "none",
        instance: "0",
        type: "none"
      })
    });

    const params = instanceToPlain(dto);

    const types = generateEIP712Types("LockTokenRequest", params);

    const expectedTypes = {
      LockTokenRequest: [
        { name: "quantity", type: "string" },
        { name: "tokenInstance", type: "tokenInstance" },
        { name: "uniqueKey", type: "string" }
      ],
      tokenInstance: [
        { name: "collection", type: "string" },
        { name: "category", type: "string" },
        { name: "additionalKey", type: "string" },
        { name: "instance", type: "string" },
        { name: "type", type: "string" }
      ]
    };

    expect(types).toMatchObject(expectedTypes);

    console.log("EIP-712 Types:", types);

    const subchainRpcUrl = "https://rpc.foo";
    const privateKey = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const provider = new ethers.JsonRpcProvider(subchainRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const signature = await wallet.signTypedData({}, types, params);

    console.log("Signature:", signature);

    // Assert that the signature is a valid string
    expect(typeof signature).toBe("string");
    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/); // Simple regex to match the format of a signature
  });
  it("should correctly generate EIP-712 types and values and sign the data for arrays", async () => {
    const dto: LockTokensDto = await createValidSubmitDTO(LockTokensDto, {
      tokenInstances: [
        {
          quantity: new BigNumber("1"),
          tokenInstanceKey: plainToInstance(TokenInstanceKey, {
            collection: "GALA",
            category: "Unit",
            additionalKey: "none",
            instance: "0",
            type: "none"
          })
        }
      ]
    });

    const params = instanceToPlain(dto);

    const types = generateEIP712Types("LockTokensRequest", params);

    const expectedTypes = {
      LockTokensRequest: [
        { name: "tokenInstances", type: "tokenInstances[]" },
        { name: "uniqueKey", type: "string" }
      ],
      tokenInstances: [
        { name: "quantity", type: "string" },
        { name: "tokenInstanceKey", type: "tokenInstanceKey" }
      ],
      tokenInstanceKey: [
        { name: "collection", type: "string" },
        { name: "category", type: "string" },
        { name: "additionalKey", type: "string" },
        { name: "instance", type: "string" },
        { name: "type", type: "string" }
      ]
    };

    expect(types).toMatchObject(expectedTypes);

    console.log("EIP-712 Types:", types);

    const subchainRpcUrl = "https://rpc.foo";
    const privateKey = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const provider = new ethers.JsonRpcProvider(subchainRpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const signature = await wallet.signTypedData({}, types, params);

    console.log("Signature:", signature);

    // Assert that the signature is a valid string
    expect(typeof signature).toBe("string");
    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/); // Simple regex to match the format of a signature
  });
  it("should correctly generate EIP-712 types and values and sign the data for arrays with multiple values", async () => {
    const dto: LockTokensDto = await createValidSubmitDTO(LockTokensDto, {
      tokenInstances: [
        {
          quantity: new BigNumber("1"),
          tokenInstanceKey: plainToInstance(TokenInstanceKey, {
            collection: "GALA",
            category: "Unit",
            additionalKey: "none",
            instance: "0",
            type: "none"
          })
        },
        {
          quantity: new BigNumber("1"),
          tokenInstanceKey: plainToInstance(TokenInstanceKey, {
            collection: "GALA",
            category: "Unit",
            additionalKey: "none",
            instance: "0",
            type: "none"
          })
        }
      ]
    });

    const params = instanceToPlain(dto);

    const types = generateEIP712Types("LockTokensRequest", params);

    const expectedTypes = {
      LockTokensRequest: [
        { name: "tokenInstances", type: "tokenInstances[]" },
        { name: "uniqueKey", type: "string" }
      ],
      tokenInstances: [
        { name: "quantity", type: "string" },
        { name: "tokenInstanceKey", type: "tokenInstanceKey" }
      ],
      tokenInstanceKey: [
        { name: "collection", type: "string" },
        { name: "category", type: "string" },
        { name: "additionalKey", type: "string" },
        { name: "instance", type: "string" },
        { name: "type", type: "string" }
      ]
    };

    expect(types).toMatchObject(expectedTypes);
  });

  it("encodes an empty array and numbers that are not uint256", async () => {
    const params = {
      feeCode: "SPLIT",
      burnPercentage: 0.9,
      counts: [1, 0.5],
      deltas: [1, -2],
      transferPercentages: [] as unknown[],
      whole: 2
    };

    const types = generateEIP712Types("FeeSplit", params);

    expect(types.FeeSplit).toEqual([
      { name: "feeCode", type: "string" },
      { name: "burnPercentage", type: "string" },
      { name: "counts", type: "string[]" },
      { name: "deltas", type: "int256[]" },
      { name: "transferPercentages", type: "string[]" },
      { name: "whole", type: "uint256" }
    ]);

    const domain = { name: "GalaChain" };
    const signingValue = valueForTypedDataSigning(types, "FeeSplit", params);
    const wallet = new ethers.Wallet("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    const signature = await wallet.signTypedData(domain, types, signingValue);

    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    expect(signingValue.burnPercentage).toBe("0.9");
    expect(signingValue.counts).toEqual(["1", "0.5"]);
    expect(params.burnPercentage).toBe(0.9);
    expect(ethers.verifyTypedData(domain, types, signingValue, signature)).toBe(wallet.address);
  });

  it("does not treat inherited property names as existing types", async () => {
    const params = {
      constructor: { label: "kept" },
      toString: "text"
    };

    const types = generateEIP712Types("toString", params);

    expect(types.toString).toEqual([
      { name: "constructor", type: "constructor" },
      { name: "toString", type: "string" }
    ]);
    expect(types.constructor).toEqual([{ name: "label", type: "string" }]);

    const domain = { name: "GalaChain" };
    const wallet = new ethers.Wallet("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    const signature = await wallet.signTypedData(domain, types, params);
    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
  });

  it("signs the original numeric value through the signing client", async () => {
    const client = new SigningClient("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    const signed = (await client.sign("FeeSplit", {
      feeCode: "SPLIT",
      burnPercentage: 0.9,
      transferPercentages: [] as unknown[]
    })) as unknown as {
      burnPercentage: number;
      signature: string;
      types: { FeeSplit: Array<{ name: string; type: string }> };
    };

    expect(signed.burnPercentage).toBe(0.9);
    expect(signed.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    expect(signed.types.FeeSplit).toEqual(
      expect.arrayContaining([
        { name: "burnPercentage", type: "string" },
        { name: "transferPercentages", type: "string[]" }
      ])
    );
  });
});
