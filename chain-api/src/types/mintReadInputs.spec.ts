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
import { TokenMintRequest } from "./TokenMintRequest";
import { MintRequestDto } from "./common";
import { createValidDTO } from "./dtos";
import { FetchMintRequestsDto, FetchTokenMintConfigurationsDto } from "./mint";

describe("mint read inputs", () => {
  it("rejects a time key that is not a finite integer", () => {
    for (const timeKey of ["NaN", "Infinity", "-Infinity", "1.5", "nope", ""]) {
      const request = new MintRequestDto();
      request.timeKey = timeKey;
      expect(request.isTimeKeyValid()).toBe(false);

      const stored = new TokenMintRequest();
      stored.timeKey = timeKey;
      expect(stored.isTimeKeyValid()).toBe(false);
    }

    const padded = new MintRequestDto();
    padded.timeKey = "000123";
    expect(padded.isTimeKeyValid()).toBe(true);
  });

  it("requires an ordered integer timestamp range", async () => {
    const valid = await createValidDTO(FetchMintRequestsDto, {
      collection: "GALA",
      category: "Unit",
      type: "none",
      additionalKey: "none",
      startTimestamp: 1_000,
      endTimestamp: 2_000
    });
    expect(valid).toBeInstanceOf(FetchMintRequestsDto);

    await expect(
      createValidDTO(FetchMintRequestsDto, {
        collection: "GALA",
        category: "Unit",
        type: "none",
        additionalKey: "none",
        startTimestamp: 2_000,
        endTimestamp: 1_000
      })
    ).rejects.toThrow(/startTimestamp must be less than or equal to endTimestamp/);

    await expect(
      createValidDTO(FetchMintRequestsDto, {
        collection: "GALA",
        category: "Unit",
        type: "none",
        additionalKey: "none",
        startTimestamp: Number.NaN,
        endTimestamp: 1_000
      })
    ).rejects.toThrow(/startTimestamp/);
  });

  it("allows a mint configuration query to stop at a leading prefix", async () => {
    const collectionOnly = await createValidDTO(FetchTokenMintConfigurationsDto, {
      collection: "GALA",
      bookmark: ""
    });
    expect(collectionOnly.collection).toEqual("GALA");
    expect(collectionOnly.category).toBeUndefined();

    const collectionAndCategory = await createValidDTO(FetchTokenMintConfigurationsDto, {
      collection: "GALA",
      category: "Unit",
      bookmark: ""
    });
    expect(collectionAndCategory.type).toBeUndefined();

    await expect(
      createValidDTO(FetchTokenMintConfigurationsDto, {
        category: "Unit",
        bookmark: ""
      })
    ).rejects.toThrow(/collection/);
  });
});
