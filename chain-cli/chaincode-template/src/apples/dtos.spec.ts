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
import { plainToInstance } from "class-transformer";

import { FetchTreesDto } from "./dtos";
import { Variety } from "./types";

it("should validate FetchTreesDto", async () => {
  // Given
  const valid1 = {};
  const valid2 = { plantedBy: "somebody" };
  const valid3 = { plantedBy: "somebody", variety: Variety.GALA };
  const valid4 = { plantedBy: "somebody", variety: Variety.GALA, index: 1 };
  const missingPlantedBy = { variety: Variety.GALA };
  const missingVariety = { plantedBy: "somebody", index: 1 };
  const wrongVariety = { plantedBy: "somebody", variety: "wrong" };

  const expectValid = [];
  const expectInvalid = (key: string, error: string) => [
    expect.objectContaining({ constraints: { [key]: expect.stringContaining(error) } })
  ];

  // When
  const results = [valid1, valid2, valid3, valid4, missingPlantedBy, missingVariety, wrongVariety].map((o) =>
    plainToInstance(FetchTreesDto, o).validate()
  );

  // Then
  expect(await Promise.all(results)).toEqual([
    expectValid,
    expectValid,
    expectValid,
    expectValid,
    expectInvalid("isString", "plantedBy must be a string"),
    expectInvalid(
      "isIn",
      "variety must be one of the following values: HONEYCRISP, GALA, GOLDEN_DELICIOUS, MCINTOSH"
    ),
    expectInvalid(
      "isIn",
      "variety must be one of the following values: HONEYCRISP, GALA, GOLDEN_DELICIOUS, MCINTOSH"
    )
  ]);
});
