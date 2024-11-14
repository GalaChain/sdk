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
import {
  LockTokenDto,
  TokenInstanceKey,
  TransferTokenDto,
  createValidDTO,
  signatures
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ethers } from "ethers";
import { EventEmitter } from "events";

import { createRandomHash, mockFetch } from "../test/test-utils";
import { BrowserConnectClient, TrustWalletConnectClient } from "./customClients";
import { generateEIP712Types } from "./utils";

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

describe("BrowserConnectClient", () => {
  it("test full flow (success)", async () => {
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
    const client = new BrowserConnectClient();
    await client.connect();

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

    // send dto payload in send function
    const response = await client.submit({
      method: "TransferToken",
      payload: dto,
      sign: true,
      url: "https://example.com"
    });

    expect(response).toEqual({
      Hash: mockHash,
      Data: mockResponse.Data,
      Status: mockResponse.Status
    });
  });
  it("test full flow (server error)", async () => {
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
    const client = new BrowserConnectClient();
    await client.connect();

    const mockResponse = {
      statusCode: 400,
      message: "Unexpected token } in JSON at position 117",
      error: "Bad Request"
    };
    mockFetch(mockResponse, {}, false);

    // send dto payload in send function
    await client
      .submit({
        method: "TransferToken",
        payload: dto,
        sign: true,
        url: "https://example.com"
      })
      .catch((error) => {
        expect(error).toEqual({
          Error: mockResponse.error,
          Message: mockResponse.message,
          ErrorCode: mockResponse.statusCode
        });
      });
  });
  it("test full flow (chain error)", async () => {
    const dto: TransferTokenDto = await createValidDTO(TransferTokenDto, {
      quantity: new BigNumber("1"),
      to: "client|63580d94c574ad78b121c267",
      tokenInstance: plainToInstance(TokenInstanceKey, {
        additionalKey: "none",
        category: "none",
        collection: "none",
        instance: new BigNumber("0"),
        type: "none"
      }),
      uniqueKey: "26d4122e-34c8-4639-baa6-4382b398e68e"
    });

    // call connect
    const client = new BrowserConnectClient();
    await client.connect();

    const mockResponse = {
      message: "Token class not found: none$none$none$none",
      dto: {
        tokenClasses: [
          {
            additionalKey: "none",
            category: "none",
            collection: "none",
            type: "none"
          }
        ]
      },
      method: "TransferToken",
      transactionId: createRandomHash(),
      error: {
        Status: 0,
        Message: "Token class not found: none$none$none$none",
        ErrorPayload: {
          tokenClassKey: "none$none$none$none"
        },
        ErrorCode: 404,
        ErrorKey: "TOKEN_CLASS_NOT_FOUND"
      }
    };
    mockFetch(mockResponse);

    // send dto payload in send function
    await client
      .submit({
        method: "TransferToken",
        payload: dto,
        sign: true,
        url: "https://example.com"
      })
      .catch((error) => {
        expect(error).toEqual({
          Error: mockResponse.error.ErrorKey,
          Message: mockResponse.message,
          ErrorCode: mockResponse.error.ErrorCode
        });
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

  it("should properly recover signature", async () => {
    const dto: LockTokenDto = await createValidDTO(LockTokenDto, {
      quantity: new BigNumber("1"),
      tokenInstance: plainToInstance(TokenInstanceKey, {
        collection: "GALA",
        category: "Unit",
        additionalKey: "none",
        instance: new BigNumber("0"),
        type: "none"
      })
    });

    await dto.validateOrReject();

    const params = instanceToPlain(dto);

    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";

    const client = new BrowserConnectClient();
    await client.connect();

    const prefix = client.calculatePersonalSignPrefix(params);
    const prefixedPayload = { prefix, ...params };
    const wallet = new ethers.Wallet(privateKey);
    const payload = signatures.getPayloadToSign(prefixedPayload);

    const signature = await wallet.signMessage(payload);
    console.log(signature);

    const publickKey = signatures.recoverPublicKey(signature, { ...prefixedPayload, signature }, prefix);
    const ethAddress = signatures.getEthAddress(publickKey);
    expect(ethAddress).toBe("e737c4D3072DA526f3566999e0434EAD423d06ec");
  });
  it("should properly recover signature", async () => {
    const params: LockTokenDto = await createValidDTO(LockTokenDto, {
      quantity: new BigNumber("1"),
      tokenInstance: plainToInstance(TokenInstanceKey, {
        collection: "GALA",
        category: "Unit",
        additionalKey: "none",
        instance: new BigNumber("0"),
        type: "none"
      })
    });

    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";

    const client = new BrowserConnectClient();
    await client.connect();

    const prefix = client.calculatePersonalSignPrefix(params);
    const prefixedPayload = { prefix, ...params };
    const wallet = new ethers.Wallet(privateKey);
    const dto = signatures.getPayloadToSign(prefixedPayload);

    const signature = await wallet.signMessage(dto);
    console.log(signature);

    const publickKey = signatures.recoverPublicKey(signature, { ...prefixedPayload, signature }, prefix);
    const ethAddress = signatures.getEthAddress(publickKey);
    expect(ethAddress).toBe("e737c4D3072DA526f3566999e0434EAD423d06ec");
  });
  it("should properly recover signature for typed signing", async () => {
    const dto: LockTokenDto = await createValidDTO(LockTokenDto, {
      quantity: new BigNumber("1"),
      tokenInstance: plainToInstance(TokenInstanceKey, {
        collection: "GALA",
        category: "Unit",
        additionalKey: "none",
        instance: new BigNumber("0"),
        type: "none"
      })
    });

    await dto.validateOrReject();

    const params = instanceToPlain(dto);

    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";

    const client = new BrowserConnectClient();
    await client.connect();

    const prefix = client.calculatePersonalSignPrefix(params);
    const prefixedPayload = { prefix, ...params };
    const wallet = new ethers.Wallet(privateKey);

    const types = generateEIP712Types("LockTokenRequest", prefixedPayload);

    const signature = await wallet.signTypedData({}, types, prefixedPayload);

    const publicKey = ethers.verifyTypedData({}, types, prefixedPayload, signature);
    expect(publicKey).toBe("0xe737c4D3072DA526f3566999e0434EAD423d06ec");
  });
  it("should properly recover signature for typed signing using signature utils", async () => {
    const dto: LockTokenDto = await createValidDTO(LockTokenDto, {
      quantity: new BigNumber("1"),
      tokenInstance: plainToInstance(TokenInstanceKey, {
        collection: "GALA",
        category: "Unit",
        additionalKey: "none",
        instance: new BigNumber("0"),
        type: "none"
      })
    });

    await dto.validateOrReject();

    const params = instanceToPlain(dto);

    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";

    const client = new BrowserConnectClient();
    await client.connect();

    const prefix = client.calculatePersonalSignPrefix(params);
    const prefixedPayload = { prefix, ...params };
    const wallet = new ethers.Wallet(privateKey);

    const types = generateEIP712Types("LockTokenRequest", params);

    const domain = {};

    const signature = await wallet.signTypedData(domain, types, prefixedPayload);

    const publicKey = signatures.recoverPublicKey(signature, { ...prefixedPayload, types, domain });
    const ethAddress = signatures.getEthAddress(publicKey);
    expect(ethAddress).toBe("e737c4D3072DA526f3566999e0434EAD423d06ec");
  });

  it("should only attach listeners once", async () => {
    const client = new BrowserConnectClient();
    const spy = jest.spyOn(client, "emit");
    // connect multiple times to ensure that the listener is only attached once.
    await client.connect();
    await client.connect();
    await client.connect();
    // Trigger the accountsChanged event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.ethereum as any).emit("accountsChanged", [sampleAddr]);
    // the client should emit two events (accountChanged and accountsChanged)
    // for each window.ethereum accountsChanged event
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("should disconnect and remove listeners", async () => {
    const client = new BrowserConnectClient();
    const spy = jest.spyOn(client, "emit");
    await client.connect();
    client.disconnect();
    // Trigger the accountsChanged event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.ethereum as any).emit("accountsChanged", [sampleAddr]);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it("should set address to empty string when disconnecting", async () => {
    const client = new BrowserConnectClient();
    await client.connect();
    client.disconnect();
    expect(client.ethereumAddress).toBe("");
  });

  it("should attach listeners when connecting after disconnecting", async () => {
    const client = new BrowserConnectClient();
    const spy = jest.spyOn(client, "emit");
    await client.connect();
    client.disconnect();
    await client.connect();
    // Trigger the accountsChanged event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.ethereum as any).emit("accountsChanged", [sampleAddr]);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("TrustConnectClient", () => {
  it("test full flow", async () => {
    window.ethereum = new EthereumMock();
    window.ethereum.isTrust = true;
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
    const client = new TrustWalletConnectClient();
    await client.connect();

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

    // send dto payload in send function
    const response = await client.submit({
      method: "TransferToken",
      payload: dto,
      sign: true,
      url: "https://example.com"
    });

    expect(response).toEqual({
      Hash: mockHash,
      Data: mockResponse.Data,
      Status: mockResponse.Status
    });
  });
});
