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
import { RegisterUserDto, TokenInstanceKey, TransferTokenDto, createValidDTO } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { EventEmitter } from "events";

import { createRandomHash, mockFetch } from "../test/test-utils";
import { PublicKeyApi, TokenApi } from "./chainApis";
import { BrowserConnectClient } from "./customClients";

// https://privatekeys.pw/key/1d3cc061492016bcd5e7ea2c31b1cf3dec584e07a38e21df7ef3049c6b224e70#addresses
const sampleAddr = "0x3bb75c2Da3B669E253C338101420CC8dEBf0a777";

class EthereumMock extends EventEmitter {
  send(method: string, params?: Array<any> | Record<string, any>): Promise<any> {
    if (method === "eth_requestAccounts") {
      return Promise.resolve([sampleAddr]);
    } else if (method === "eth_accounts") {
      return Promise.resolve([sampleAddr]);
    } else if (method === "personal_sign") {
      return Promise.resolve("sampleSignature");
    } else {
      throw new Error(`Method not mocked: ${method}`);
    }
  }
  request(request: { method: string; params?: Array<any> | Record<string, any> }): Promise<any> {
    if (request.method === "eth_requestAccounts") {
      return Promise.resolve([sampleAddr]);
    } else if (request.method === "eth_accounts") {
      return Promise.resolve([sampleAddr]);
    } else if (request.method === "personal_sign") {
      return Promise.resolve("sampleSignature");
    } else if (request.method === "eth_signTypedData_v4") {
      return Promise.resolve("sampleSignature");
    } else {
      throw new Error(`Method not mocked: ${request.method}`);
    }
  }
}
window.ethereum = new EthereumMock();

describe("API tests", () => {
  it("test transfer", async () => {
    const dto: TransferTokenDto = await createValidDTO(TransferTokenDto, {
      quantity: new BigNumber("1"),
      to: "client|63580d94c574ad78b121c267",
      tokenInstance: plainToInstance(TokenInstanceKey, {
        additionalKey: "none",
        category: "Unit",
        collection: "GALA",
        instance: new BigNumber("0"),
        type: "none"
      }),
      uniqueKey: "26d4122e-34c8-4639-baa6-4382b398e68e"
    });

    // call connect
    const connection = new BrowserConnectClient();
    await connection.connect();

    const tokenApi = new TokenApi("https://example.com", connection);

    // send dto payload in send function
    const mockResponse = {
      Data: [
        {
          additionalKey: "none",
          category: "Unit",
          collection: "GALA",
          owner: "string",
          quantity: "1",
          type: "none"
        }
      ],
      Status: 1
    };
    const mockHash = createRandomHash();
    mockFetch(mockResponse, { "x-transaction-id": mockHash });

    const response = await tokenApi.TransferToken(dto);

    expect(instanceToPlain(response)).toEqual({
      Hash: mockHash,
      Data: mockResponse.Data,
      Status: mockResponse.Status
    });
  });
  it("test register", async () => {
    const dto: RegisterUserDto = await createValidDTO(RegisterUserDto, {
      publicKey: "3",
      user: "client|4"
    });

    // call connect
    const connection = new BrowserConnectClient();
    await connection.connect();

    const publicKeyApi = new PublicKeyApi("https://example.com", connection);

    // send dto payload in send function
    const mockResponse = {
      Data: "test",
      Status: 1
    };
    const mockHash = createRandomHash();
    mockFetch(mockResponse, { "x-transaction-id": mockHash });
    const response = await publicKeyApi.RegisterUser(dto);

    expect(response).toEqual({
      Hash: mockHash,
      Data: mockResponse.Data,
      Status: mockResponse.Status
    });
  });
  it("test both using same connection", async () => {
    const dto: RegisterUserDto = await createValidDTO(RegisterUserDto, {
      publicKey: "3",
      user: "client|4"
    });

    // call connect
    const connection = new BrowserConnectClient();
    await connection.connect();

    const tokenApi = new PublicKeyApi("https://example.com", connection);

    const mockResponse = {
      Data: "test",
      Status: 1
    };
    const mockHash = createRandomHash();
    mockFetch(mockResponse, { "x-transaction-id": mockHash });
    let response = await tokenApi.RegisterUser(dto);

    expect(response).toEqual({
      Hash: mockHash,
      Data: mockResponse.Data,
      Status: mockResponse.Status
    });

    const publicKeyApi = new PublicKeyApi("https://example.com", connection);

    // send dto payload in send function
    const mockResponse2 = {
      Data: "test2",
      Status: 1
    };
    const mockHash2 = createRandomHash();
    mockFetch(mockResponse2, { "x-transaction-id": mockHash2 });
    response = await publicKeyApi.RegisterUser(dto);

    expect(response).toEqual({
      Hash: mockHash2,
      Data: mockResponse2.Data,
      Status: mockResponse2.Status
    });
  });
});
