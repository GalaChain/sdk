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
import {
  GalaChainResponse,
  GetMyProfileDto,
  RegisterUserDto,
  UserProfile,
  signatures
} from "@gala-chain/api";
import {
  ChainClient,
  ChainUser,
  ContractConfig,
  HFClientConfig,
  PublicKeyContractAPI,
  RestApiClientConfig,
  gcclient,
  publicKeyContractAPI
} from "@gala-chain/client";
import * as fs from "fs";
import * as path from "path";

/*
 * The test is to show how to use chaincode client without test utilities.
 * You may want to use similar code in your client application.
 */

jest.setTimeout(30000);

describe("Chaincode client (PartnerOrg1)", () => {
  let client: ChainClient & CustomAPI;

  beforeAll(() => {
    const params = {
      orgMsp: "PartnerOrg1",
      userId: "admin",
      userSecret: "adminpw",
      connectionProfilePath: path.resolve(networkRoot(), "connection-profiles/cpp-partner.json")
    };

    const contract = {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract"
    };

    client = gcclient.forConnectionProfile(params).forContract(contract).extendAPI(customAPI);
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it("should get user profile", async () => {
    // Given
    const adminPrivateKey = getAdminPrivateKey();
    const adminEthAddress = signatures.getEthAddress(signatures.getPublicKey(adminPrivateKey));

    // When
    const profile = await client.GetProfile(adminPrivateKey);

    // Then
    expect(profile).toEqual(expect.objectContaining({ alias: "client|admin", ethAddress: adminEthAddress }));
  });
});

describe("Chaincode client (CuratorOrg)", () => {
  let client: ChainClient & CustomAPI & PublicKeyContractAPI;

  beforeAll(() => {
    const params: HFClientConfig = {
      orgMsp: "CuratorOrg",
      userId: "admin",
      userSecret: "adminpw",
      connectionProfilePath: path.resolve(networkRoot(), "connection-profiles/cpp-curator.json")
    };

    const contract: ContractConfig = {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract"
    };

    client = gcclient
      .forConnectionProfile(params)
      .forContract(contract)
      .extendAPI(publicKeyContractAPI)
      .extendAPI(customAPI);
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it("should register another user", async () => {
    // Given
    const newUser = ChainUser.withRandomKeys();

    const dto = new RegisterUserDto();
    dto.publicKey = newUser.publicKey;
    dto.sign(getAdminPrivateKey(), false);

    // When
    const response = await client.RegisterEthUser(dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success(newUser.identityKey));

    const newUserProfile = await client.GetProfile(newUser.privateKey);
    expect(newUserProfile).toEqual(
      expect.objectContaining({ alias: newUser.identityKey, ethAddress: newUser.ethAddress })
    );
  });
});

// The test requires running REST API server for GalaChain
describe.skip("REST API client", () => {
  let client: ChainClient & CustomAPI;

  beforeAll(() => {
    const params: RestApiClientConfig = {
      orgMsp: "CuratorOrg",
      userId: "GC_ADMIN_CURATOR",
      userSecret: "abc",
      apiUrl: "http://localhost:3000/api",
      configPath: path.resolve(__dirname, "api-config.json")
    };

    const contract: ContractConfig = {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract"
    };

    client = gcclient.forApiConfig(params).forContract(contract).extendAPI(customAPI);
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it("should get user profile", async () => {
    // Given
    const adminPrivateKey = getAdminPrivateKey();
    const adminEthAddress = signatures.getEthAddress(signatures.getPublicKey(adminPrivateKey));

    // When
    const profile = await client.GetProfile(adminPrivateKey);

    // Then
    expect(profile).toEqual(expect.objectContaining({ alias: "client|admin", ethAddress: adminEthAddress }));
  });
});

let adminPrivateKeyString: string | undefined;

function getAdminPrivateKey() {
  if (adminPrivateKeyString === undefined) {
    adminPrivateKeyString = fs
      .readFileSync(path.resolve(networkRoot(), "dev-admin-key/dev-admin.priv.hex.txt"))
      .toString();
  }

  return adminPrivateKeyString;
}

function networkRoot() {
  const fromEnv = process.env.GALA_NETWORK_ROOT_PATH;

  if (!fromEnv) {
    throw new Error("GALA_NETWORK_ROOT_PATH is not set");
  }

  return fromEnv;
}

interface CustomAPI {
  GetProfile(privateKey: string): Promise<UserProfile>;
}

function customAPI(client: ChainClient): CustomAPI {
  return {
    async GetProfile(privateKey: string) {
      const dto = new GetMyProfileDto().signed(privateKey, false);
      const response = await client.evaluateTransaction("GetMyProfile", dto, UserProfile);
      if (GalaChainResponse.isError(response)) {
        throw new Error(`Cannot get profile: ${response.Message} (${response.ErrorKey})`);
      } else {
        return response.Data as UserProfile;
      }
    }
  };
}
