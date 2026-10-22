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

import { TokenInstanceQueryKey } from "./TokenInstance";
import { FetchBurnsDto } from "./burn";
import { FetchFeeAuthorizationsDto } from "./fee";
import { FetchNftCollectionAuthorizationsWithPaginationDto } from "./nftCollection";
import { FetchOracleDefinitionsDto } from "./oracle";

it("should reject a token query key that skips a component", async () => {
  const gapped = plainToInstance(TokenInstanceQueryKey, { collection: "TEST", type: "Potion" });
  const errors = await validate(gapped);

  expect(errors.map((error) => error.property)).toContain("category");
  expect(() => gapped.toQueryParams()).toThrow(/omitted component/);

  const prefix = plainToInstance(TokenInstanceQueryKey, { collection: "TEST", category: "Item" });
  expect(await validate(prefix)).toEqual([]);
  expect(prefix.toQueryParams()).toEqual(["TEST", "Item"]);
});

it("should reject a burn query that skips a component or uses a non-string instance", async () => {
  const gapped = await validate(
    plainToInstance(FetchBurnsDto, { burnedBy: "client|testUser1", type: "Potion" })
  );
  const instance = await validate(
    plainToInstance(FetchBurnsDto, {
      burnedBy: "client|testUser1",
      collection: "TEST",
      category: "Item",
      type: "Potion",
      additionalKey: "Elixir",
      instance: 12
    })
  );
  const prefix = await validate(
    plainToInstance(FetchBurnsDto, { burnedBy: "client|testUser1", collection: "TEST" })
  );

  expect(gapped.map((error) => error.property)).toEqual(expect.arrayContaining(["collection", "category"]));
  expect(instance.map((error) => error.property)).toContain("instance");
  expect(prefix).toEqual([]);
});

it("should reject a page size outside 1 to 10000", async () => {
  const dtoClasses = [
    FetchFeeAuthorizationsDto,
    FetchNftCollectionAuthorizationsWithPaginationDto,
    FetchOracleDefinitionsDto
  ];

  for (const dtoClass of dtoClasses) {
    const zero = await validate(plainToInstance(dtoClass, { limit: 0 }));
    const fraction = await validate(plainToInstance(dtoClass, { limit: 1.5 }));
    const tooLarge = await validate(plainToInstance(dtoClass, { limit: 10001 }));
    const allowed = await validate(plainToInstance(dtoClass, { limit: 100 }));

    expect(zero.map((error) => error.property)).toContain("limit");
    expect(fraction.map((error) => error.property)).toContain("limit");
    expect(tooLarge.map((error) => error.property)).toContain("limit");
    expect(allowed.map((error) => error.property)).not.toContain("limit");
  }
});
