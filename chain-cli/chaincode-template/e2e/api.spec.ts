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
import { AdminChainClients, TestClients, transactionSuccess } from "@gala-chain/test";

import { AppleTreeDto, AppleTreesDto, FetchTreesDto, PagedTreesDto, PickAppleDto } from "../src/apples";

jest.setTimeout(30000);

describe("API snapshots", () => {
  const contractConfig = {
    apples: {
      name: {
        channelName: "apple-channel",
        chaincodeName: "basic-apple",
        contractName: "apple-contract"
      },
      api: appleContractAPI
    },
    pk: {
      name: {
        channelName: "public-key-channel",
        chaincodeName: "public-key",
        contractName: "public-key"
      },
      api: publicKeyContractAPI
    },
    assets: {
      name: {
        channelName: "product-channel",
        chaincodeName: "basic-product",
        contractName: "product"
      },
      api: commonContractAPI
    }
  };

  let client: AdminChainClients<typeof contractConfig>;

  beforeAll(async () => {
    client = await TestClients.createForAdmin(contractConfig);
  });

  afterAll(async () => {
    await client.disconnect();
  });

  test(`Api of ${contractConfig.pk}`, async () => {
    // When
    const response = await client.pk.GetContractAPI();

    // Then
    expect(response).toEqual(transactionSuccess());
    expect({ ...response.Data, contractVersion: "?.?.?" }).toMatchSnapshot();
  });

  test(`Api of ${contractConfig.assets}`, async () => {
    // When
    const response = await client.assets.GetContractAPI();

    // Then
    expect(response).toEqual(transactionSuccess());
    expect({ ...response.Data, contractVersion: "?.?.?" }).toMatchSnapshot();
  });

  test(`Api of ${contractConfig.apples}`, async () => {
    // When
    const response = await client.apples.GetContractAPI();

    // Then
    expect(response).toEqual(transactionSuccess());
    expect({ ...response.Data, contractVersion: "?.?.?" }).toMatchSnapshot();
  });
});

interface AppleContractAPI {
  PlantTree(dto: AppleTreeDto): Promise<GalaChainResponse<void>>;
  PlantTrees(dto: AppleTreesDto): Promise<GalaChainResponse<void>>;
  FetchTrees(dto: FetchTreesDto): Promise<GalaChainResponse<PagedTreesDto>>;
  PickApple(dto: PickAppleDto): Promise<GalaChainResponse<void>>;
}

function appleContractAPI(client: ChainClient): AppleContractAPI {
  return {
    PlantTree(dto: AppleTreeDto) {
      return client.submitTransaction("PlantTree", dto) as Promise<GalaChainResponse<void>>;
    },

    PlantTrees(dto: AppleTreesDto) {
      return client.submitTransaction("PlantTrees", dto) as Promise<GalaChainResponse<void>>;
    },

    FetchTrees(dto: FetchTreesDto) {
      return client.evaluateTransaction("FetchTrees", dto, PagedTreesDto);
    },

    PickApple(dto: PickAppleDto) {
      return client.submitTransaction("PickApple", dto) as Promise<GalaChainResponse<void>>;
    }
  };
}
