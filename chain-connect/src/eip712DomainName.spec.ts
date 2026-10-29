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
import { eip712DomainName } from "./eip712DomainName";

describe("eip712DomainName", () => {
  it("stays GalaChain when no deployment is selected", () => {
    expect(eip712DomainName()).toBe("GalaChain");
    expect(eip712DomainName({ network: "MNT" })).toBe("GalaChain");
  });

  it("uses the stage and dev names", () => {
    expect(eip712DomainName({ network: "STG" })).toBe("GalaChainStage");
    expect(eip712DomainName({ network: "DEV" })).toBe("GalaChainDev");
  });

  it("lets an explicit name override the network", () => {
    expect(eip712DomainName({ network: "STG", domainName: "GalaChain" })).toBe("GalaChain");
  });
});
