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
import { validate } from "class-validator";

import { FetchBurnsDto } from "./burn";

describe("FetchBurnsDto", () => {
  it("rejects created when a preceding key field is missing", async () => {
    // Given
    const dto = plainToInstance(FetchBurnsDto, {
      burnedBy: "client|user1",
      collection: "Test",
      created: 1700000000000
    });

    // When
    const errors = await validate(dto);

    // Then
    expect(errors.map((e) => e.property)).toEqual(
      expect.arrayContaining(["category", "type", "additionalKey", "instance"])
    );
  });

  it("accepts created when all preceding key fields are present", async () => {
    // Given
    const dto = plainToInstance(FetchBurnsDto, {
      burnedBy: "client|user1",
      collection: "Test",
      category: "Item",
      type: "Sword",
      additionalKey: "none",
      instance: "1",
      created: 1700000000000
    });

    // When
    const errors = await validate(dto);

    // Then
    expect(errors).toHaveLength(0);
  });
});
