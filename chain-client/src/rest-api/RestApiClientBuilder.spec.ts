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
import axios from "axios";

import { RestApiClientBuilder } from "./RestApiClientBuilder";

const contract = { channel: "product", chaincode: "assets", contract: "GalaChainToken" };
const credentials = { adminKey: "admin", adminSecret: "secret" };

describe("REST protocol probe", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not enroll when the probe status is not 400", async () => {
    const url = "http://ambiguous-rest.example";
    jest
      .spyOn(axios, "get")
      .mockRejectedValue(Object.assign(new Error("denied"), { response: { status: 401 } }));
    const post = jest.spyOn(axios, "post");
    const builder = new RestApiClientBuilder(url, "Org1", credentials, { channels: [] });

    await expect(builder.forContract(contract).evaluateTransaction("Ping")).rejects.toThrow(
      `Failed to identify REST API at ${url}: 401`
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("does not enroll when the probe fails without a status", async () => {
    const url = "http://offline-rest.example";
    jest.spyOn(axios, "get").mockRejectedValue(new Error("connect ECONNREFUSED"));
    const post = jest.spyOn(axios, "post");
    const builder = new RestApiClientBuilder(url, "Org1", credentials, { channels: [] });

    await expect(builder.forContract(contract).evaluateTransaction("Ping")).rejects.toThrow(
      `Failed to identify REST API at ${url}: connect ECONNREFUSED`
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("uses the chain REST API when the identities route is missing and contract metadata loads", async () => {
    const url = "http://gcrest.example";
    jest
      .spyOn(axios, "get")
      .mockRejectedValue(Object.assign(new Error("missing"), { response: { status: 404 } }));
    const post = jest.spyOn(axios, "post").mockResolvedValue({
      data: { Status: 1, Data: { methods: [{ methodName: "Ping", isWrite: false }] } }
    });
    const builder = new RestApiClientBuilder(url, "Org1", credentials, {
      channels: [
        {
          channelName: "product",
          pathFragment: "product",
          contracts: [{ chaincodeName: "assets", contractName: "GalaChainToken", pathFragment: "assets" }]
        }
      ]
    });

    await builder.forContract(contract).evaluateTransaction("Ping");

    const urls = post.mock.calls.map((call) => String(call[0]));
    expect(urls).toContain(`${url}/product/assets/GetContractAPI`);
    expect(urls.some((called) => called.includes("/user/enroll"))).toBe(false);
  });

  it("does not enroll when a missing identities route is not the chain REST API", async () => {
    const url = "http://unknown-rest.example";
    jest
      .spyOn(axios, "get")
      .mockRejectedValue(Object.assign(new Error("missing"), { response: { status: 404 } }));
    const post = jest
      .spyOn(axios, "post")
      .mockRejectedValue(Object.assign(new Error("missing"), { response: { status: 404 } }));
    const builder = new RestApiClientBuilder(url, "Org1", credentials, {
      channels: [
        {
          channelName: "product",
          pathFragment: "product",
          contracts: [{ chaincodeName: "assets", contractName: "GalaChainToken", pathFragment: "assets" }]
        }
      ]
    });

    await expect(builder.forContract(contract).evaluateTransaction("Ping")).rejects.toThrow(
      `Failed to identify REST API at ${url}: 404`
    );
    expect(post.mock.calls.some((call) => String(call[0]).includes("/user/enroll"))).toBe(false);
  });
});
