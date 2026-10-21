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

describe("chain REST client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads contract metadata and does not call user enrollment", async () => {
    const url = "http://gcrest.example";
    const get = jest.spyOn(axios, "get");
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
    expect(get).not.toHaveBeenCalled();
  });
});
