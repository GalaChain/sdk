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
import { GalaContract } from "@gala-chain/chaincode";
import { ChainUser } from "@gala-chain/client";
import { fixture, writesMap } from "@gala-chain/test";

import { AppleTree } from "./AppleTree";
import { AppleTreeDto, AppleTreesDto } from "./dtos";
import { plantTrees } from "./plantTrees";
import { Variety } from "./types";

class TestContract extends GalaContract {
  constructor() {
    super("TestContract", "0.0.1");
  }
}

it("should allow to plant trees", async () => {
  // Given
  const user = ChainUser.withRandomKeys();

  const { ctx, writes } = fixture(TestContract).callingUser(user);

  const dto = new AppleTreesDto([new AppleTreeDto(Variety.GALA, 1), new AppleTreeDto(Variety.MCINTOSH, 2)]);

  const expectedTrees = dto.trees.map(
    (t) => new AppleTree(user.identityKey, t.variety, t.index, ctx.txUnixTime)
  );

  // When
  const response = await plantTrees(ctx, dto);

  // Then
  expect(response).toEqual(expectedTrees);

  await ctx.stub.flushWrites();
  expect(writes).toEqual(writesMap(...expectedTrees));
});
