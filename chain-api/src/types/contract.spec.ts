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
import BigNumber from "bignumber.js";

import { NotFoundError } from "../utils";
import { BigNumberProperty } from "../validators";
import { ChainObject } from "./ChainObject";
import { GalaChainResponse } from "./contract";

class DummyClass extends ChainObject {
  @BigNumberProperty()
  maxSupply: BigNumber;
}

it("should deserialize response", () => {
  // Given
  const responseString = `{"Status":1,"Data":{"collection":"Platform","category":"Currency","type":"GALA","additionalKey":"none","network":"GC","totalMintAllowance":"0","maxSupply":"50000000000","maxCapacity":"50000000000","authorities":["org1|curatorUser"],"name":"GALA","symbol":"GALA","description":"This is a test description!","image":"https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png","isNonFungible":false,"totalBurned":"0","totalSupply":"0","decimals":8}}`;

  // When
  const deserialized = GalaChainResponse.deserialize(DummyClass, responseString);

  // Then
  expect(deserialized.Data?.maxSupply).toEqual(new BigNumber("50000000000"));
});

it("should deserialize array response", async () => {
  // Given
  const responseString = `{"Status":1,"Data":[{"collection":"Platform","category":"Currency","type":"GALA","additionalKey":"none","network":"GC","totalMintAllowance":"0","maxSupply":"50000000000","maxCapacity":"50000000000","authorities":["org1|curatorUser"],"name":"GALA","symbol":"GALA","description":"This is a test description!","image":"https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png","isNonFungible":false,"totalBurned":"0","totalSupply":"0","decimals":8}]}`;

  // When
  const deserialized: GalaChainResponse<DummyClass[]> = GalaChainResponse.deserialize<DummyClass[]>(
    DummyClass,
    responseString
  );

  // Then
  expect(deserialized.Data?.[0]?.maxSupply).toEqual(new BigNumber("50000000000"));
});

it("should deserialize single string response", () => {
  // Given
  const responseString = `{"Status":1,"Data":"GALA"}`;

  // When
  const deserialized = GalaChainResponse.deserialize(String, responseString);

  // Then
  expect(deserialized.Data).toEqual("GALA");
});

it("should deserialize string array response", () => {
  // Given
  const responseString = `{"Status":1,"Data":["GALA1","GALA2"]}`;

  // When
  // eslint-disable-next-line @typescript-eslint/ban-types
  const deserialized = GalaChainResponse.deserialize<String[]>(String, responseString);

  // Then
  expect(deserialized.Data).toEqual(["GALA1", "GALA2"]);
});

it("should deserialize error response", () => {
  // Given
  const responseString = `{"Status":0,"Message":"No object found","ErrorCode":404,"ErrorKey":"NOT_FOUND"}`;

  // When
  const deserialized = GalaChainResponse.deserialize(DummyClass, responseString);

  // Then
  expect(deserialized).toEqual(GalaChainResponse.Error(new NotFoundError("No object found")));
});
