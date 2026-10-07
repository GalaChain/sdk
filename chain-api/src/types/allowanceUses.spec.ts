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

import { GrantAllowanceDto, HighThroughputGrantAllowanceDto, RefreshAllowanceDto } from "./allowance";
import { AllowanceType } from "./common";

const grant = {
  tokenInstance: {
    collection: "TEST",
    category: "Item",
    type: "Potion",
    additionalKey: "Elixir",
    instance: "1"
  },
  quantities: [{ user: "client|testUser1", quantity: "1" }],
  allowanceType: AllowanceType.Lock,
  uses: "1",
  uniqueKey: "test-key"
};

it("should reject a grant expiration that is not a non-negative integer", async () => {
  for (const dtoClass of [GrantAllowanceDto, HighThroughputGrantAllowanceDto]) {
    const negative = await validate(plainToInstance(dtoClass, { ...grant, expires: -1 }));
    const text = await validate(plainToInstance(dtoClass, { ...grant, expires: "soon" }));
    const never = await validate(plainToInstance(dtoClass, { ...grant, expires: 0 }));

    expect(negative.map((error) => error.property)).toContain("expires");
    expect(text.map((error) => error.property)).toContain("expires");
    expect(never.map((error) => error.property)).not.toContain("expires");
  }
});

it("should allow a refresh that sets uses to zero", async () => {
  const zero = await validate(plainToInstance(RefreshAllowanceDto, { uses: "0", expires: 0 }));
  const negative = await validate(plainToInstance(RefreshAllowanceDto, { uses: "-1", expires: 0 }));

  expect(zero.map((error) => error.property)).not.toContain("uses");
  expect(negative.map((error) => error.property)).toContain("uses");
});
