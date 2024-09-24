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
import { RegisterUserParams, TransferTokenParams } from "@gala-chain/api";
import { EventEmitter } from "events";

import { PublicKeyApi, TokenApi } from "./chainApis";
import { MetamaskConnectClient } from "./customClients";

global.fetch = jest.fn((url: string, options?: Record<string, unknown>) =>
  Promise.resolve({
    json: () => Promise.resolve({ Request: { url, options } }),
    headers: {
      get: () => ({ status: 1 })
    }
  })
) as jest.Mock;

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
    const dto: TransferTokenParams = {
      quantity: "1",
      to: "client|63580d94c574ad78b121c267",
      tokenInstance: {
        additionalKey: "none",
        category: "Unit",
        collection: "GALA",
        instance: "0",
        type: "none"
      },
      uniqueKey: "26d4122e-34c8-4639-baa6-4382b398e68e"
    };

    // call connect
    const connection = new MetamaskConnectClient();
    await connection.connect();

    const tokenApi = new TokenApi("https://example.com", connection);
    // send dto payload in send function
    const response = await tokenApi.TransferToken(dto);

    expect(response).toEqual({
      Hash: {
        status: 1
      },
      Request: {
        options: {
          body: '{"domain":{"name":"GalaChain"},"prefix":"\\u0019Ethereum Signed Message:\\n261","quantity":"1","signature":"sampleSignature","to":"client|63580d94c574ad78b121c267","tokenInstance":{"additionalKey":"none","category":"Unit","collection":"GALA","instance":"0","type":"none"},"types":{"TransferToken":[{"name":"quantity","type":"string"},{"name":"to","type":"string"},{"name":"tokenInstance","type":"tokenInstance"},{"name":"uniqueKey","type":"string"}],"tokenInstance":[{"name":"additionalKey","type":"string"},{"name":"category","type":"string"},{"name":"collection","type":"string"},{"name":"instance","type":"string"},{"name":"type","type":"string"}]},"uniqueKey":"26d4122e-34c8-4639-baa6-4382b398e68e"}',
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        },
        url: "https://example.com/TransferToken"
      }
    });
  });
  it("test register", async () => {
    const dto: RegisterUserParams = {
      publicKey: "3",
      user: "4"
    };

    // call connect
    const connection = new MetamaskConnectClient();
    await connection.connect();

    const publicKeyApi = new PublicKeyApi("https://example.com", connection);
    // send dto payload in send function
    const response = await publicKeyApi.RegisterUser(dto);

    expect(response).toEqual({
      Hash: {
        status: 1
      },
      Request: {
        options: {
          body: '{"domain":{"name":"GalaChain"},"prefix":"\\u0019Ethereum Signed Message:\\n74","publicKey":"3","signature":"sampleSignature","types":{"RegisterUser":[{"name":"publicKey","type":"string"},{"name":"user","type":"string"}]},"user":"4"}',
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        },
        url: "https://example.com/RegisterUser"
      }
    });
  });
  it("test both using same connection", async () => {
    const dto: RegisterUserParams = {
      publicKey: "3",
      user: "4"
    };

    // call connect
    const connection = new MetamaskConnectClient();
    await connection.connect();

    const tokenApi = new PublicKeyApi("https://example.com", connection);
    let response = await tokenApi.RegisterUser(dto);

    expect(response).toEqual({
      Hash: {
        status: 1
      },
      Request: {
        options: {
          body: '{"domain":{"name":"GalaChain"},"prefix":"\\u0019Ethereum Signed Message:\\n74","publicKey":"3","signature":"sampleSignature","types":{"RegisterUser":[{"name":"publicKey","type":"string"},{"name":"user","type":"string"}]},"user":"4"}',
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        },
        url: "https://example.com/RegisterUser"
      }
    });

    const publicKeyApi = new PublicKeyApi("https://example.com", connection);
    // send dto payload in send function
    response = await publicKeyApi.RegisterUser(dto);

    expect(response).toEqual({
      Hash: {
        status: 1
      },
      Request: {
        options: {
          body: '{"domain":{"name":"GalaChain"},"prefix":"\\u0019Ethereum Signed Message:\\n74","publicKey":"3","signature":"sampleSignature","types":{"RegisterUser":[{"name":"publicKey","type":"string"},{"name":"user","type":"string"}]},"user":"4"}',
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        },
        url: "https://example.com/RegisterUser"
      }
    });
  });
});
