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

import { createValidDTO } from "../types";
import { TokenClassKey } from "./TokenClass";

describe("token class additional key", () => {
  it("should reject an empty additional key", async () => {
    // Given
    const key = plainToInstance(TokenClassKey, {
      collection: "GALA",
      category: "Unit",
      type: "none",
      additionalKey: ""
    });

    // When
    const errors = await key.validate();

    // Then
    expect(errors.some((e) => e.property === "additionalKey")).toBe(true);
    expect(key.allKeysPresent()).toBe(false);
  });

  it("should accept the none additional key", async () => {
    // Given
    const valid = {
      collection: "GALA",
      category: "Unit",
      type: "none",
      additionalKey: "none"
    };

    // When
    const key = await createValidDTO(TokenClassKey, valid);

    // Then
    expect(key.additionalKey).toEqual("none");
    expect(key.allKeysPresent()).toBe(true);
  });
});
