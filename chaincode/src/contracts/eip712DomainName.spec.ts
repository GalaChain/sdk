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
import { ChainCallDTO, UnauthorizedError } from "@gala-chain/api";

import { assertEip712DomainName, expectedEip712DomainName } from "./eip712DomainName";

describe("expectedEip712DomainName", () => {
  const original = process.env.GC_NETWORK;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.GC_NETWORK;
    } else {
      process.env.GC_NETWORK = original;
    }
  });

  it("uses GalaChainDev unless the network is mainnet or stage", () => {
    delete process.env.GC_NETWORK;
    expect(expectedEip712DomainName()).toBe("GalaChainDev");
    process.env.GC_NETWORK = "DEV";
    expect(expectedEip712DomainName()).toBe("GalaChainDev");
    process.env.GC_NETWORK = "MNT";
    expect(expectedEip712DomainName()).toBe("GalaChain");
    process.env.GC_NETWORK = "STG";
    expect(expectedEip712DomainName()).toBe("GalaChainStage");
  });
});

describe("assertEip712DomainName", () => {
  const original = process.env.GC_NETWORK;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.GC_NETWORK;
    } else {
      process.env.GC_NETWORK = original;
    }
  });

  function eip712(name?: string): ChainCallDTO {
    return {
      domain: name === undefined ? {} : { name },
      types: { Message: [{ name: "uniqueKey", type: "string" }] }
    } as unknown as ChainCallDTO;
  }

  it("ignores a payload that is not EIP-712", () => {
    delete process.env.GC_NETWORK;
    expect(() => assertEip712DomainName({} as ChainCallDTO)).not.toThrow();
  });

  it("accepts the name for this deployment", () => {
    delete process.env.GC_NETWORK;
    expect(() => assertEip712DomainName(eip712("GalaChainDev"))).not.toThrow();
    process.env.GC_NETWORK = "MNT";
    expect(() => assertEip712DomainName(eip712("GalaChain"))).not.toThrow();
    process.env.GC_NETWORK = "STG";
    expect(() => assertEip712DomainName(eip712("GalaChainStage"))).not.toThrow();
  });

  it("rejects a name from another deployment", () => {
    delete process.env.GC_NETWORK;
    expect(() => assertEip712DomainName(eip712("GalaChain"))).toThrow(UnauthorizedError);
    try {
      assertEip712DomainName(eip712("GalaChain"));
    } catch (error) {
      const unauthorized = error as UnauthorizedError;
      expect(unauthorized.message).toBe(
        "EIP-712 domain name must be GalaChainDev for this deployment. Received GalaChain."
      );
      expect(unauthorized.payload).toEqual({ expected: "GalaChainDev", received: "GalaChain" });
    }
    expect(() => assertEip712DomainName(eip712())).toThrow(
      "EIP-712 domain name must be GalaChainDev for this deployment. Received none."
    );
    process.env.GC_NETWORK = "STG";
    expect(() => assertEip712DomainName(eip712("GalaChain"))).toThrow(
      "EIP-712 domain name must be GalaChainStage for this deployment. Received GalaChain."
    );
  });
});
