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
import path from "path";

import { SingleArg, chaincodeDirsForChannels, createConfigtxProfiles, customValidation } from "./index";

function flags(overrides: Record<string, unknown> = {}): {
  channel: string[];
  channelType: string[];
  chaincodeName: string[];
  fabloRoot: string;
  watch: boolean;
  chaincodeDir?: string[];
} {
  return {
    channel: ["product-channel", "asset-channel"],
    channelType: ["curator", "partner"],
    chaincodeName: ["product", "asset"],
    fabloRoot: "/tmp/gala-network-root",
    watch: false,
    ...overrides
  };
}

describe("network path checks", () => {
  it("repeats the default chaincode directory once per chaincode", () => {
    const networkFlags = flags();

    customValidation(networkFlags);

    expect(networkFlags.chaincodeDir).toEqual([".", "."]);
    expect(chaincodeDirsForChannels(["a", "b", "c"], undefined)).toEqual([".", ".", "."]);
  });

  it("keeps an explicit chaincode directory list in the count check", () => {
    expect(() => customValidation(flags({ chaincodeDir: ["chain-cli"] }))).toThrow(
      /2 channel names, 2 channel types, 2 chaincodes and 1 chaincode directories/
    );
  });

  it("rejects a network root equal to a chaincode directory", () => {
    expect(() =>
      customValidation(
        flags({
          channel: ["product-channel"],
          channelType: ["curator"],
          chaincodeName: ["product"],
          chaincodeDir: ["."],
          fabloRoot: "."
        })
      )
    ).toThrow(/must not equal chaincode directory/);
  });

  it("allows the default network directory inside the chaincode project", () => {
    expect(() =>
      customValidation(
        flags({
          channel: ["product-channel"],
          channelType: ["curator"],
          chaincodeName: ["product"],
          chaincodeDir: ["."],
          fabloRoot: "./test-network"
        })
      )
    ).not.toThrow();
  });

  it("rejects a chaincode directory inside the network root", () => {
    const networkRoot = path.resolve(__dirname, "..");

    expect(() =>
      customValidation(
        flags({
          channel: ["product-channel"],
          channelType: ["curator"],
          chaincodeName: ["product"],
          chaincodeDir: [__dirname],
          fabloRoot: networkRoot
        })
      )
    ).toThrow(networkRoot);
  });
});

function arg(channel: string, channelType: SingleArg["channelType"] = "curator"): SingleArg {
  return {
    channel,
    channelType,
    chaincodeName: "basic",
    chaincodeDir: "."
  };
}

describe("createConfigtxProfiles", () => {
  it("keeps profile names unique for distinct channels", () => {
    const yaml = createConfigtxProfiles([arg("product-channel"), arg("other-channel", "partner")]);

    expect(yaml).toContain("  ProductChannel:\n    <<: *CuratorChannelDefaults");
    expect(yaml).toContain("  OtherChannel:\n    <<: *PartnerChannelDefaults");
  });

  it("rejects channel names that would share a configtx profile", () => {
    expect(() => createConfigtxProfiles([arg("foo-bar"), arg("fooBar", "partner")])).toThrow(
      'Channel names "foo-bar" and "fooBar" produce the same configtx profile "FooBar".'
    );
  });

  it("emits a profile once when the same channel is listed more than once", () => {
    const yaml = createConfigtxProfiles([arg("product-channel"), arg("product-channel")]);

    expect(yaml.match(/ProductChannel:/g)).toHaveLength(1);
  });
});
