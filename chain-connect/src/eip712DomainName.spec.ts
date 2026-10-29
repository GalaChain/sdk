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
  it("uses the dev name when no network is selected", () => {
    // When & Then
    expect(eip712DomainName()).toBe("GalaChainDev");
    expect(eip712DomainName({})).toBe("GalaChainDev");
  });

  it("uses the name for each network", () => {
    // When & Then
    expect(eip712DomainName({ network: "MNT" })).toBe("GalaChain");
    expect(eip712DomainName({ network: "STG" })).toBe("GalaChainStage");
    expect(eip712DomainName({ network: "DEV" })).toBe("GalaChainDev");
    expect(eip712DomainName({ network: "OTHER" })).toBe("GalaChainDev");
  });

  it("lets an explicit name override the network", () => {
    // When & Then
    expect(eip712DomainName({ network: "STG", domainName: "GalaChain" })).toBe("GalaChain");
    expect(eip712DomainName({ domainName: "GalaChain" })).toBe("GalaChain");
  });
});
