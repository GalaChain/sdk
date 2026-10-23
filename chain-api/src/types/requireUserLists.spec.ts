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

import { UpdateSignersDto } from "./dtos";

describe("UpdateSignersDto", () => {
  it("rejects a single signer where a list is required", async () => {
    const dto = plainToInstance(UpdateSignersDto, {
      toAdd: "client|second-signer",
      toRemove: "client|old-signer",
      uniqueKey: "signers-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "toAdd")).toBe(true);
    expect(errors.some((error) => error.property === "toRemove")).toBe(true);
  });
});
