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
import { MintRequestDto, UserAlias } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { GalaChainContext } from "../types";
import { MintOperationParams, indexMintOperations } from "./batchMintToken";
import { indexMintRequests } from "./indexMintRequests";

const classA = { collection: "a_b", category: "c", type: "d", additionalKey: "e" };
const classB = { collection: "a", category: "b_c", type: "d", additionalKey: "e" };

describe("mint group keys", () => {
  it("keeps token classes distinct when their names contain underscores", () => {
    const indexed = indexMintRequests([{ ...classA } as MintRequestDto, { ...classB } as MintRequestDto]);

    expect(Object.keys(indexed)).toHaveLength(2);
    expect(indexed[Object.keys(indexed)[0]][0].collection).not.toEqual(
      indexed[Object.keys(indexed)[1]][0].collection
    );
  });

  it("groups mint operations for one token class and separates underscore collisions", () => {
    const ctx = { callingUser: "client|minter" as UserAlias } as GalaChainContext;
    const operation = (tokenClassKey: typeof classA): MintOperationParams => ({
      tokenClassKey: tokenClassKey as MintOperationParams["tokenClassKey"],
      owner: "client|owner" as UserAlias,
      quantity: new BigNumber("1"),
      authorizedOnBehalf: undefined
    });

    const indexed = indexMintOperations(ctx, [operation(classA), operation(classA), operation(classB)]);

    const groups = Object.values(indexed);
    expect(groups).toHaveLength(2);
    const counts = groups.map((group) =>
      Object.values(group.mintOperationsIndex).reduce((sum, entry) => sum + entry.mintOperations.length, 0)
    );
    expect(counts.sort()).toEqual([1, 2]);
  });
});
