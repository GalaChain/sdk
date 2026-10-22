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
import { Gateway } from "fabric-network";

import { HFClient } from "./HFClient";
import { HFClientBuilder, loadGatewayContract } from "./HFClientBuilder";

const contractConfig = { channel: "product", chaincode: "assets", contract: "GalaChainToken" };

describe("Fabric client startup", () => {
  const builder = { orgMsp: "Org1MSP" } as HFClientBuilder;

  it("retries a failed gateway initialization and lets disconnect clear it", async () => {
    const gateway = { disconnect: jest.fn() };
    const connected = { contract: { name: "assets" }, gateway, network: {} };
    const createContractPromise = jest
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(connected);

    const client = new HFClient(builder, "admin", contractConfig, createContractPromise);

    await expect(client.contract).rejects.toThrow("network down");
    await expect(client.disconnect()).resolves.toBeUndefined();
    await expect(client.contract).resolves.toEqual(connected.contract);
    expect(createContractPromise).toHaveBeenCalledTimes(2);
  });

  it("disconnects the gateway when contract setup fails", async () => {
    const gateway = {
      disconnect: jest.fn(),
      getNetwork: jest.fn().mockRejectedValue(new Error("missing channel"))
    };

    await expect(loadGatewayContract(gateway as unknown as Gateway, contractConfig)).rejects.toThrow(
      "missing channel"
    );
    expect(gateway.disconnect).toHaveBeenCalledTimes(1);
  });
});
