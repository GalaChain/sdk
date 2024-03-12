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
import { gcclient } from "./gcclient";
import { loadJson } from "./generic/loadJson";
import { HFClientBuilder } from "./hf";
import { RestApiClientBuilder } from "./rest-api";
import { loadRestApiConfig } from "./rest-api/loadRestApiConfig";

jest.mock("./generic/loadJson");
jest.mock("./rest-api/loadRestApiConfig");

describe("forConnectionProfile", () => {
  beforeAll(() => {
    (loadJson as jest.Mock).mockReturnValue(sampleConnectionProfile());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should create builder for connection profile", () => {
    // Given
    const org = {
      orgMsp: "CuratorOrg",
      userId: "admin",
      userSecret: "adminpw",
      connectionProfilePath: "some/path"
    };

    // When
    const builder = gcclient.forConnectionProfile(org);

    // Then
    expect(builder).toBeInstanceOf(HFClientBuilder);
  });

  it("should fail if org is missing from connection profile", () => {
    // Given
    const org = {
      orgMsp: "MissingOrg",
      userId: "admin",
      userSecret: "adminpw",
      connectionProfilePath: "some/path"
    };

    // When
    const builder = () => gcclient.forConnectionProfile(org);

    // Then
    expect(builder).toThrow(
      `Organization ${org.orgMsp} not found in connection profile. Allowed orgs: CuratorOrg`
    );
  });
});

describe("forApiConfig", () => {
  beforeAll(() => {
    (loadRestApiConfig as jest.Mock).mockReturnValue(sampleApiConfig());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should create builder for api config", () => {
    // Given
    const api = {
      orgMsp: "CuratorOrg",
      apiUrl: "http://localhost:3000",
      userId: "GC_ADMIN_ID",
      userSecret: "GC_ADMIN_SECRET",
      configPath: "some/path"
    };

    // When
    const builder = gcclient.forApiConfig(api);

    // Then
    expect(builder).toBeInstanceOf(RestApiClientBuilder);
  });
});

function sampleConnectionProfile() {
  return {
    name: "test-network-CuratorOrg",
    version: "1.0.0",
    client: {
      organization: "CuratorOrg"
    },
    organizations: {
      CuratorOrg: {
        mspid: "CuratorOrg",
        peers: ["peer0.curator.local"],
        certificateAuthorities: ["ca.curator.local"]
      }
    },
    peers: {
      "peer0.curator.local": {
        url: "grpc://localhost:7041"
      },
      "peer0.partner1.local": {
        url: "grpc://localhost:7061"
      }
    },
    certificateAuthorities: {
      "ca.curator.local": {
        url: "http://localhost:7040",
        caName: "ca.curator.local",
        httpOptions: {
          verify: false
        }
      }
    },
    orderers: {
      "orderer0.group1.orderer.local": {
        url: "grpc://localhost:7030"
      }
    },
    channels: {
      "product-channel": {
        orderers: ["orderer0.group1.orderer.local"],
        peers: {
          "peer0.curator.local": {
            endorsingPeer: true,
            chaincodeQuery: true,
            ledgerQuery: true,
            eventSource: true
          },
          "peer0.partner1.local": {
            endorsingPeer: true,
            chaincodeQuery: true,
            ledgerQuery: true,
            eventSource: true
          }
        }
      }
    }
  };
}

function sampleApiConfig() {
  return {
    channels: [
      {
        pathFragment: "asset",
        channelName: "asset-channel",
        contracts: [
          {
            pathFragment: "public-key-contract",
            chaincodeName: "basic-asset",
            contractName: "PublicKeyContract"
          },
          {
            pathFragment: "token-contract",
            chaincodeName: "basic-asset",
            contractName: "GalaChainToken"
          }
        ]
      }
    ]
  };
}
