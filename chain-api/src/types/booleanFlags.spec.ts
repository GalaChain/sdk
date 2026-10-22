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

import { BatchDto } from "./dtos";
import { UpdateTokenClassDto } from "./token";

describe("boolean flags", () => {
  it("rejects a string where overwriteAuthorities requires a boolean", async () => {
    const dto = plainToInstance(UpdateTokenClassDto, {
      tokenClass: {
        collection: "CC",
        category: "Currency",
        type: "TEST",
        additionalKey: "none"
      },
      overwriteAuthorities: "false",
      uniqueKey: "flag-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "overwriteAuthorities")).toBe(true);
  });

  it("rejects a string where noPartialSuccess requires a boolean", async () => {
    const dto = plainToInstance(BatchDto, {
      operations: [{ method: "PutKv", dto: { key: "k", value: "v", uniqueKey: "u" } }],
      noPartialSuccess: "false",
      uniqueKey: "batch-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "noPartialSuccess")).toBe(true);
  });
});
