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
import axios, { AxiosError } from "axios";

import { RestApiClient } from "./RestApiClient";
import { catchAxiosError } from "./catchAxiosError";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "./requestTimeout";

describe("REST request timeout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("bounds a contract call", async () => {
    const post = jest.spyOn(axios, "post").mockResolvedValue({ data: { Status: 1 } });
    const client = new RestApiClient(
      Promise.resolve({} as never),
      "https://rest.example",
      { channel: "product", chaincode: "basic", contract: "GalaChainToken" },
      "Org1"
    );

    await client.post("http://rest.example/product/GalaChainToken/Ping");

    expect(post).toHaveBeenCalledWith(
      "http://rest.example/product/GalaChainToken/Ping",
      {},
      expect.objectContaining({ timeout: DEFAULT_REQUEST_TIMEOUT_MS })
    );
  });

  it("bounds contract discovery", async () => {
    const post = jest.spyOn(axios, "post").mockResolvedValue({
      data: { Status: 1, Data: { methods: [] } }
    });

    await RestApiClient.getContractApis({ adminKey: "key", adminSecret: "secret" }, "https://rest.example", {
      channels: [
        {
          channelName: "product",
          pathFragment: "product",
          contracts: [
            {
              chaincodeName: "basic",
              contractName: "GalaChainToken",
              pathFragment: "GalaChainToken"
            }
          ]
        }
      ]
    });

    expect(post).toHaveBeenCalledWith(
      "https://rest.example/product/GalaChainToken/GetContractAPI",
      undefined,
      expect.objectContaining({ timeout: DEFAULT_REQUEST_TIMEOUT_MS })
    );
  });

  it("rejects a timed out request instead of treating it as a chain response", () => {
    const error = new AxiosError<{ error?: { Status?: number } }>(
      "timeout of 30000ms exceeded",
      "ECONNABORTED"
    );

    expect(() => catchAxiosError(error)).toThrow(error);
  });
});
