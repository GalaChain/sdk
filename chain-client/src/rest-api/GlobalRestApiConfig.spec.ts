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

import { FabloRestClient } from "./FabloRestClient";
import { globalRestApiConfig } from "./GlobalRestApiConfig";
import { RestApiClientBuilder } from "./RestApiClientBuilder";

const contract = { channel: "product", chaincode: "assets", contract: "GalaChainToken" };

function settle(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("REST cache scope", () => {
  let post: jest.SpyInstance;

  beforeEach(() => {
    post = jest.spyOn(axios, "post").mockResolvedValue({ data: { token: "enrolled" } });
  });

  afterEach(() => {
    post.mockRestore();
  });

  it("keeps contract metadata per endpoint", () => {
    const first = "http://one.example";
    const second = "http://two.example";

    globalRestApiConfig.setContractApi(first, {
      channelName: contract.channel,
      chaincodeName: contract.chaincode,
      contractName: contract.contract,
      contractPath: "product/assets",
      api: { methods: [] }
    });
    globalRestApiConfig.setContractApi(`${second}/`, {
      channelName: contract.channel,
      chaincodeName: contract.chaincode,
      contractName: contract.contract,
      contractPath: "other/assets",
      api: { methods: [{ methodName: "Other", isWrite: false }] }
    });

    expect(globalRestApiConfig.getContractApi(first, contract).contractPath).toBe("product/assets");
    expect(globalRestApiConfig.getContractApi(second, contract).contractPath).toBe("other/assets");
  });

  it("keeps Fablo tokens per credentials and organization", () => {
    const url = "http://fablo.example";
    const admin = { adminKey: "admin", adminSecret: "one" };
    const other = { adminKey: "admin", adminSecret: "two" };

    globalRestApiConfig.setAuthorizedFabloRest(url, admin, "Org1", "token-a");
    globalRestApiConfig.setAuthorizedFabloRest(`${url}/`, other, "Org1", "token-b");
    globalRestApiConfig.setAuthorizedFabloRest(url, admin, "Org2", "token-c");

    expect(globalRestApiConfig.getAuthorizedFabloRest(url, admin, "Org1")).toBe("token-a");
    expect(globalRestApiConfig.getAuthorizedFabloRest(url, other, "Org1")).toBe("token-b");
    expect(globalRestApiConfig.getAuthorizedFabloRest(url, admin, "Org2")).toBe("token-c");
  });

  it("gives each forUser call its own client", async () => {
    const credentials = { adminKey: "admin", adminSecret: "secret" };
    const client = new FabloRestClient(
      Promise.resolve({} as never),
      "http://fablo-user.example",
      contract,
      credentials,
      Promise.resolve("admin-token"),
      "Org1"
    );

    const alice = client.forUser("alice", "alice-secret");
    const bob = client.forUser("bob", "bob-secret");
    await settle();

    expect(alice).toBe(client);
    expect(bob).toBe(client);
    expect(post).not.toHaveBeenCalled();
  });

  it("does not retarget the shared proxy when selecting a user", async () => {
    const url = "http://proxy.example";
    const credentials = { adminKey: "admin", adminSecret: "secret" };
    globalRestApiConfig.markInitialized(url);
    globalRestApiConfig.setAuthorizedFabloRest(url, credentials, "Org1", "admin-token");
    const builder = new RestApiClientBuilder(url, "Org1", credentials, { channels: [] });
    const client = builder.forContract(contract);
    const alice = client.forUser("alice", "alice-secret");
    const bob = client.forUser("bob", "bob-secret");
    await settle();

    expect(alice).not.toBe(client);
    expect(bob).not.toBe(alice);
    expect(client.userId).toBe("admin");
    expect(alice.userId).toBe("alice");
    expect(bob.userId).toBe("bob");
    expect(post).not.toHaveBeenCalled();
  });

  it("loads a later builder's identity and contracts on an initialized endpoint", async () => {
    const url = "http://later-builder.example";
    const firstCredentials = { adminKey: "admin", adminSecret: "one" };
    const secondCredentials = { adminKey: "admin", adminSecret: "two" };
    const channel = {
      channelName: "product",
      pathFragment: "product",
      contracts: [{ chaincodeName: "assets", contractName: "GalaChainToken", pathFragment: "token" }]
    };
    const extra = { channel: "product", chaincode: "assets", contract: "ExtraContract" };
    post.mockResolvedValue({
      data: { Status: 1, Data: { methods: [{ methodName: "Ping", isWrite: false }] } }
    });

    const first = new RestApiClientBuilder(url, "Org1", firstCredentials, { channels: [channel] });
    const second = new RestApiClientBuilder(url, "Org1", secondCredentials, {
      channels: [
        {
          ...channel,
          contracts: [
            ...channel.contracts,
            { chaincodeName: "assets", contractName: "ExtraContract", pathFragment: "extra" }
          ]
        }
      ]
    });

    await first.forContract(contract).disconnect();
    await second.forContract(extra).disconnect();

    const urls = post.mock.calls.map((call) => String(call[0]));
    expect(urls.some((called) => called.includes("/user/enroll"))).toBe(false);
    expect(globalRestApiConfig.getContractApi(url, extra).contractPath).toBe("product/extra");
  });
});

describe("getContractApi", () => {
  it("throws when contract metadata is missing", () => {
    const params = { channel: "missing", chaincode: "assets", contract: "Unknown" };

    expect(() => globalRestApiConfig.getContractApi("http://missing.example", params)).toThrow(
      'Cannot find contract API for key ["http://missing.example","missing","assets","Unknown"]'
    );
  });
});
