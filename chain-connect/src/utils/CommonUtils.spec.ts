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
<<<<<<<< HEAD:chain-connect/src/Utils.spec.ts
import { LockTokenRequestParams, LockTokensParams } from "@gala-chain/api";
========
import {
  LockTokenDto,
  LockTokensDto,
  TokenInstanceKey,
  createValidDTO,
  createValidSubmitDTO
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
>>>>>>>> origin/main-v2:chain-connect/src/utils/CommonUtils.spec.ts
import { ethers } from "ethers";

import { generateEIP712Types } from "./CommonUtils";

describe("EIP-712 Signing", () => {
  it("should correctly generate EIP-712 types and values and sign the data for single types", async () => {
<<<<<<<< HEAD:chain-connect/src/Utils.spec.ts
    const params: LockTokenRequestParams = {
      quantity: "1",
      tokenInstance: {
========
    const dto: LockTokenDto = await createValidSubmitDTO(LockTokenDto, {
      quantity: new BigNumber("1"),
      tokenInstance: plainToInstance(TokenInstanceKey, {
>>>>>>>> origin/main-v2:chain-connect/src/utils/CommonUtils.spec.ts
        collection: "GALA",
        category: "Unit",
        additionalKey: "none",
        instance: "0",
        type: "none"
      },
      uniqueKey: "uniqueKey-123"
    };
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
<<<<<<<< HEAD:chain-connect/src/Utils.spec.ts
    const params: LockTokensParams = {
========
    const dto: LockTokensDto = await createValidSubmitDTO(LockTokensDto, {
>>>>>>>> origin/main-v2:chain-connect/src/utils/CommonUtils.spec.ts
      tokenInstances: [
        {
          quantity: "1",
          tokenInstanceKey: {
            collection: "GALA",
            category: "Unit",
            additionalKey: "none",
            instance: "0",
            type: "none"
          }
        }
      ],
      uniqueKey: "uniqueKey-123"
    };
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
<<<<<<<< HEAD:chain-connect/src/Utils.spec.ts
    const params: LockTokensParams = {
========
    const dto: LockTokensDto = await createValidSubmitDTO(LockTokensDto, {
>>>>>>>> origin/main-v2:chain-connect/src/utils/CommonUtils.spec.ts
      tokenInstances: [
        {
          quantity: "1",
          tokenInstanceKey: {
            collection: "GALA",
            category: "Unit",
            additionalKey: "none",
            instance: "0",
            type: "none"
          }
        },
        {
          quantity: "1",
          tokenInstanceKey: {
            collection: "GALA",
            category: "Unit",
            additionalKey: "none",
            instance: "0",
            type: "none"
          }
        }
      ],
      uniqueKey: "uniqueKey-123"
    };
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
});
