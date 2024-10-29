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
import { LockTokenDto, LockTokensDto, TokenInstanceKey, createValidDTO } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ethers } from "ethers";

import { generateEIP712Types } from "./CommonUtils";

describe("EIP-712 Signing", () => {
  it("should correctly generate EIP-712 types and values and sign the data for single types", async () => {
    const dto: LockTokenDto = await createValidDTO(LockTokenDto, {
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
        { name: "tokenInstance", type: "tokenInstance" }
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
    const dto: LockTokensDto = await createValidDTO(LockTokensDto, {
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
      LockTokensRequest: [{ name: "tokenInstances", type: "tokenInstances[]" }],
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
    const dto: LockTokensDto = await createValidDTO(LockTokensDto, {
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
      LockTokensRequest: [{ name: "tokenInstances", type: "tokenInstances[]" }],
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
});
