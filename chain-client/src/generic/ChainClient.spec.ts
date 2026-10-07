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
import { GalaChainResponse } from "../wire";
import { ChainClient } from "./ChainClient";
import { ChainClientBuilder } from "./ChainClientBuilder";

class RecordingClient extends ChainClient {
  constructor() {
    super(
      Promise.resolve({} as ChainClientBuilder),
      "admin",
      { channel: "product", chaincode: "assets", contract: "GalaChainToken" },
      "Org1MSP"
    );
  }

  public forUser(): ChainClient {
    return this;
  }

  public disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public submitTransaction(): Promise<GalaChainResponse<unknown>> {
    return Promise.resolve({} as GalaChainResponse<unknown>);
  }

  public evaluateTransaction(): Promise<GalaChainResponse<unknown>> {
    return Promise.resolve({} as GalaChainResponse<unknown>);
  }
}

describe("extendAPI", () => {
  it("ignores inherited property names on the extension object", () => {
    const client = new RecordingClient();
    const extended = client.extendAPI(() => ({ ping: () => "pong" }));

    expect(extended.ping()).toBe("pong");
    expect(extended.constructor).toBe(RecordingClient);
    expect(extended.toString).toBe(client.toString);
  });
});
