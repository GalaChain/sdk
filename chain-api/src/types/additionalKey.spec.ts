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
import { plainToInstance } from "class-transformer";

import { createValidDTO } from "../types";
import { TokenSwapRequestInstanceOffered } from "./TokenSwapRequestInstanceOffered";
import { FetchBurnsDto } from "./burn";
import { FetchMintRequestsDto } from "./mint";

describe("empty additional key", () => {
  it("should accept an empty additional key on a mint request query", async () => {
    // Given
    const valid = {
      collection: "CC",
      category: "Currency",
      type: "Unit",
      additionalKey: "",
      startTimestamp: 1,
      endTimestamp: 2
    };

    // When
    const dto = await createValidDTO(FetchMintRequestsDto, valid);

    // Then
    expect(dto.additionalKey).toEqual("");
  });

  it("should accept an empty additional key on an exact burn query", async () => {
    // Given
    const valid = {
      burnedBy: "client|testUser1",
      collection: "CC",
      category: "Currency",
      type: "Unit",
      additionalKey: "",
      instance: "1"
    };

    // When
    const dto = await createValidDTO(FetchBurnsDto, valid as any);

    // Then
    expect(dto.additionalKey).toEqual("");
  });

  it("should accept an empty additional key on a swap offer index", async () => {
    // Given
    const offered = plainToInstance(TokenSwapRequestInstanceOffered, {
      collection: "CC",
      category: "Currency",
      type: "Unit",
      additionalKey: "",
      instance: new BigNumber(0),
      swapRequestId: "swap"
    });

    // When
    const errors = await offered.validate();

    // Then
    expect(errors).toEqual([]);
  });
});
