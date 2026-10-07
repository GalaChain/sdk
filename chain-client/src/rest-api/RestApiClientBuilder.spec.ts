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

import { RestApiStatus, globalRestApiConfig } from "./GlobalRestApiConfig";
import { RestApiClientBuilder } from "./RestApiClientBuilder";

const contract = { channel: "product", chaincode: "assets", contract: "GalaChainToken" };
const credentials = { adminKey: "admin", adminSecret: "secret" };

function fabloProbeRejection(): Error {
  return Object.assign(new Error("probe"), { response: { status: 400 } });
}

describe("REST client startup", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("retries initialization after a failed attempt", async () => {
    const url = "http://retry-init.example";
    jest.spyOn(axios, "get").mockRejectedValue(fabloProbeRejection());
    jest
      .spyOn(axios, "post")
      .mockRejectedValueOnce(new Error("enroll down"))
      .mockResolvedValueOnce({ data: { token: "enrolled" } });

    globalRestApiConfig.setContractApi({
      channelName: contract.channel,
      chaincodeName: contract.chaincode,
      contractName: contract.contract,
      contractPath: "product/assets",
      api: { methods: [] }
    });
    const builder = new RestApiClientBuilder(url, "Org1", credentials, { channels: [] });
    const first = builder.forContract(contract);
    await expect(first.evaluateTransaction("Ping")).rejects.toThrow(/User enrollment failed/);
    expect(globalRestApiConfig.getStatus(url)).toBe(RestApiStatus.NONE);

    const second = builder.forContract(contract);
    await expect(second.evaluateTransaction("Ping")).rejects.toThrow(/Cannot find method API/);
    expect(globalRestApiConfig.getStatus(url)).toBe(RestApiStatus.INITIALIZED);
  });

  it("does not mark initialization failed when a waiter times out", async () => {
    jest.useFakeTimers();
    const url = "http://slow-init.example";
    jest.spyOn(axios, "get").mockImplementation(() => new Promise(() => undefined));

    const builder = new RestApiClientBuilder(url, "Org1", credentials, { channels: [] });
    const client = builder.forContract(contract);
    const pending = client.evaluateTransaction("Ping");
    const assertion = expect(pending).rejects.toThrow(
      `Failed to initialize Rest API at ${url} after 50 retries`
    );

    await jest.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(globalRestApiConfig.getStatus(url)).toBe(RestApiStatus.PENDING);
  });
});
