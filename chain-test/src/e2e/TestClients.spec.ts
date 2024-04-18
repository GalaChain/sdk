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
import { GalaChainResponse } from "@gala-chain/api";
import { ChainClient, commonContractAPI, publicKeyContractAPI } from "@gala-chain/client";

import { TestClients } from "./TestClients";
import { createChainClient } from "./createChainClient";

jest.mock("./createChainClient");

beforeAll(() => {
  (createChainClient as jest.Mock).mockImplementation(() => new ChainClientMock());
});

afterAll(() => {
  jest.restoreAllMocks();
});

it("should create client for default config", async () => {
  // When
  const clients = await TestClients.create();

  // Then (some random checks verifying that the clients are created, and compilation succeeds)
  expect(typeof clients.pk).toEqual("object");
  expect(typeof clients.pk.RegisterUser).toEqual("function");
  expect(typeof clients.assets.GetContractVersion).toEqual("function");
  expect(typeof clients.disconnect).toEqual("function");
});

it("should create client for custom config", async () => {
  // Given
  const customConfig = {
    token: { name: "GalaChainToken", api: commonContractAPI },
    auth: { name: "PublicKeyContract", api: publicKeyContractAPI }
  };

  // When
  const clients = await TestClients.create(customConfig);

  // Then
  expect(typeof clients.token).toEqual("object");
  expect(typeof clients.token.GetContractVersion).toEqual("function");
  expect(typeof clients.auth).toEqual("object");
  expect(typeof clients.auth.RegisterUser).toEqual("function");
  expect(typeof clients.disconnect).toEqual("function");
});

it("should use common contract API if no API is defined", async () => {
  // Given
  const customConfig = {
    token: "GalaChainToken"
  };

  // When
  const clients = await TestClients.create(customConfig);

  // Then
  expect(typeof clients.token).toEqual("object");
  expect(typeof clients.token.GetContractVersion).toEqual("function");
  expect(typeof clients.disconnect).toEqual("function");
});

it("should include and admin API for admin client", async () => {
  // Given
  const customConfig = {
    token: { name: "GalaChainToken", api: commonContractAPI }
  };

  // When
  const clients = await TestClients.createForAdmin(customConfig);

  // Then
  expect(typeof clients.token).toEqual("object");
  expect(typeof clients.token.GetContractVersion).toEqual("function");
  expect(typeof clients.createRegisteredUser).toEqual("function");
});

class ChainClientMock extends ChainClient {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(undefined, undefined, undefined);
  }

  disconnect(): Promise<void> {
    return Promise.resolve(undefined);
  }

  evaluateTransaction(): Promise<GalaChainResponse<unknown>> {
    return Promise.resolve(GalaChainResponse.Success({}));
  }

  submitTransaction(): Promise<GalaChainResponse<unknown>> {
    return Promise.resolve(GalaChainResponse.Success({}));
  }

  forUser(): ChainClient {
    throw new Error("Not Implemented");
  }
}
