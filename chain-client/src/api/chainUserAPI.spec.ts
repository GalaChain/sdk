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
import { GetMyProfileDto } from "@gala-chain/api";

import {
  ChainClient,
  ChainClientBuilder,
  ChainUser,
  ClassType,
  ContractConfig,
  Inferred,
  Serializable
} from "../generic";
import { GalaChainResponse } from "../wire";
import { buildChainUserAPI } from "./chainUserAPI";

class FakeClient extends ChainClient {
  constructor(config: ContractConfig) {
    super(Promise.resolve(undefined as unknown as ChainClientBuilder), "user", config, "CuratorOrg");
  }

  public submitTransaction<T>(
    _method: string,
    _dtoOrResp?: Serializable | ClassType<Inferred<T>>,
    _resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    return Promise.reject(new Error("unused"));
  }

  public evaluateTransaction<T>(
    _method: string,
    _dtoOrResp?: Serializable | ClassType<Inferred<T>>,
    _resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    return Promise.reject(new Error("unused"));
  }

  public disconnect(): Promise<void> {
    return Promise.resolve();
  }
}

describe("signFor", () => {
  it("signs the operation for the client's contract", () => {
    const user = ChainUser.withRandomKeys("signer");
    const client = new FakeClient({
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract"
    }).extendAPI(buildChainUserAPI(user));

    const signed = client.signFor("GetMyProfile", new GetMyProfileDto());

    expect(signed.dtoOperation).toBe("product-channel_basic-product_PublicKeyContract:GetMyProfile");
    expect(signed.signature?.length).toBeGreaterThan(0);
  });

  it("keeps an operation that is already set", () => {
    const user = ChainUser.withRandomKeys("signer");
    const client = new FakeClient({
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract"
    }).extendAPI(buildChainUserAPI(user));

    const signed = client.signFor("GetMyProfile", new GetMyProfileDto().withOperation("already-set"));

    expect(signed.dtoOperation).toBe("already-set");
  });
});
