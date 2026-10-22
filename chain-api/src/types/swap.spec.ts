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
import { validate } from "class-validator";

import { RequestTokenSwapDto } from "./swap";

const leg = (
  collection: string,
  category: string,
  type: string,
  additionalKey: string,
  id: string,
  quantity: string
) => ({
  tokenInstance: {
    collection,
    category,
    type,
    additionalKey,
    instance: new BigNumber(id)
  },
  quantity: new BigNumber(quantity)
});

async function validationErrors(offered: unknown[], wanted: unknown[]) {
  const dto = plainToInstance(RequestTokenSwapDto, {
    uniqueKey: "swap-legs",
    uses: new BigNumber("1"),
    expires: 0,
    offered,
    wanted
  });
  return validate(dto);
}

describe("RequestTokenSwapDto swap legs", () => {
  it("accepts distinct offered and wanted token instances", async () => {
    const errors = await validationErrors(
      [leg("Game", "Item", "Sword", "a_b", "1", "1")],
      [leg("Game", "Currency", "Gold", "b_c", "0", "5")]
    );

    expect(errors).toHaveLength(0);
  });

  it("rejects duplicate offered token instances", async () => {
    const errors = await validationErrors(
      [leg("Game", "Item", "Sword", "none", "1", "1"), leg("Game", "Item", "Sword", "none", "1", "2")],
      [leg("Game", "Currency", "Gold", "none", "0", "5")]
    );

    expect(errors.map((error) => error.property)).toContain("offered");
  });

  it("rejects duplicate wanted token instances", async () => {
    const errors = await validationErrors(
      [leg("Game", "Item", "Sword", "none", "1", "1")],
      [leg("Game", "Currency", "Gold", "none", "0", "5"), leg("Game", "Currency", "Gold", "none", "0", "7")]
    );

    expect(errors.map((error) => error.property)).toContain("wanted");
  });

  it("does not treat underscore partitions of different instances as duplicates", async () => {
    const errors = await validationErrors(
      [leg("a_b", "c", "t", "k", "0", "1"), leg("a", "b_c", "t", "k", "0", "1")],
      [leg("Game", "Currency", "Gold", "none", "0", "5")]
    );

    expect(errors).toHaveLength(0);
  });
});
