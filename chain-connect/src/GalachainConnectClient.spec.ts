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
import { TokenInstanceKey } from "@gala-chain/api";
import { TransferTokenDto } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";
import { EventEmitter } from "events";

import { GalachainConnectClient } from "./GalachainConnectClient";

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
  request(request: { method: string; params?: Array<any> | Record<string, any> }): Promise<any> {
    if (request.method === "eth_requestAccounts") {
      return Promise.resolve([sampleAddr]);
    } else if (request.method === "eth_accounts") {
      return Promise.resolve([sampleAddr]);
    } else if (request.method === "personal_sign") {
      return Promise.resolve("sampleSignature");
    } else {
      throw new Error(`Method not mocked: ${request.method}`);
    }
  }
}
window.ethereum = new EthereumMock();

describe("GalachainConnectClient", () => {
  it("test full flow", async () => {
    const dto = plainToInstance(TransferTokenDto, {
      quantity: "1",
      to: "client|63580d94c574ad78b121c267",
      tokenInstance: plainToInstance(TokenInstanceKey, {
        additionalKey: "none",
        category: "Unit",
        collection: "GALA",
        instance: "0",
        type: "none"
      }),
      uniqueKey: "26d4122e-34c8-4639-baa6-4382b398e68e"
    });

    // call connect
    const client = new GalachainConnectClient("https://example.com");
    await client.connectToMetaMask();

    // send dto payload in send function
    const response = await client.send({ method: "TransferToken", payload: dto, sign: true });

    expect(response).toEqual({
      Hash: {
        status: 1
      },
      Request: {
        options: {
          body: '{"prefix":"\\u0019Ethereum Signed Message:\\n279","quantity":{"c":[1],"e":0,"s":1},"signature":"sampleSignature","to":"client|63580d94c574ad78b121c267","tokenInstance":{"additionalKey":"none","category":"Unit","collection":"GALA","instance":"0","type":"none"},"uniqueKey":"26d4122e-34c8-4639-baa6-4382b398e68e"}',
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        },
        url: "https://example.com/TransferToken"
      }
    });
  });

  test("should log accounts changed", () => {
    const consoleSpy = jest.spyOn(console, "log");
    const accounts = [sampleAddr];

    window.ethereum?.on("accountsChanged", () => {
      console.log("Accounts changed:", accounts);
    });
    // Trigger the accountsChanged event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.ethereum as any).emit("accountsChanged", accounts);

    expect(consoleSpy).toHaveBeenCalledWith("Accounts changed:", accounts);
    consoleSpy.mockRestore();
  });
});
