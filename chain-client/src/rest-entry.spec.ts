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
import { createRequire } from "module";

const nodeRequire = createRequire(__filename);

describe("REST package entry", () => {
  const missingFabric = () => {
    throw new Error("optional Fabric package loaded");
  };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock("fabric-network", missingFabric);
    jest.doMock("fabric-ca-client", missingFabric);
  });

  afterEach(() => {
    jest.dontMock("fabric-network");
    jest.dontMock("fabric-ca-client");
    jest.resetModules();
  });

  it("loads the package root without Fabric packages", () => {
    expect(() => nodeRequire("./index")).not.toThrow();
  });

  it("loads Fabric packages only when a Fabric export is read", () => {
    const client = nodeRequire("./index") as { HFClient: unknown };

    expect(() => client.HFClient).toThrow("optional Fabric package loaded");
  });
});
