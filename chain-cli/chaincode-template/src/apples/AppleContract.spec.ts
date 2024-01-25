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
import { ChainUser } from "@gala-chain/client";
import { fixture, transactionErrorMessageContains, transactionSuccess, writesMap } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import { AppleTree, AppleTreeDto, PickAppleDto, Variety } from "../apples";
import { AppleContract } from "./AppleContract";

it("should allow to plant a tree", async () => {
  // Given
  const { contract, ctx, writes } = fixture(AppleContract);
  const dto = new AppleTreeDto(Variety.GALA, 1);
  const expectedTree = new AppleTree(ctx.callingUser, dto.variety, dto.index, ctx.txUnixTime);

  // When
  const response = await contract.PlantTree(ctx, dto);

  // Then
  expect(response).toEqual(transactionSuccess());
  expect(writes).toEqual(writesMap(expectedTree));
});

it("should fail to plant a tree if tree already exists", async () => {
  // Given
  const user = ChainUser.withRandomKeys();

  const { contract, ctx, writes } = fixture(AppleContract)
    .callingUser(user)
    .savedState(new AppleTree(user.identityKey, Variety.GOLDEN_DELICIOUS, 1, 0));

  // When
  const response = await contract.PlantTree(ctx, new AppleTreeDto(Variety.GOLDEN_DELICIOUS, 1));

  // Then
  expect(response).toEqual(transactionErrorMessageContains("Tree already exists"));
  expect(writes).toEqual({});
});

it("should allow to pick apples", async () => {
  // Given
  const twoYearsAgo = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 2).getTime();
  const existingTree = new AppleTree("client|some-user", Variety.GALA, 1, twoYearsAgo);
  const { contract, ctx, writes } = fixture(AppleContract).savedState(existingTree);

  const dto = new PickAppleDto(existingTree.plantedBy, existingTree.variety, existingTree.index);

  // When
  const response = await contract.PickApple(ctx, dto);

  // Then
  expect(response).toEqual(transactionSuccess());
  expect(writes).toEqual(
    writesMap(
      plainToInstance(AppleTree, {
        ...existingTree,
        applesPicked: existingTree.applesPicked.plus(1)
      })
    )
  );
});
