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
import { createValidChainObject, randomUniqueKey } from "@gala-chain/api";
import {
  fixture,
  transactionErrorMessageContains,
  transactionSuccess,
  users,
  writesMap
} from "@gala-chain/test";

import { AppleTree, PickAppleDto, Variety } from "../apples";
import { AppleContract } from "./AppleContract";
import { PlantAppleTreeDto } from "./dtos";

it("should allow to plant a tree", async () => {
  // Given
  const user = users.random();
  const { contract, ctx, getWrites } = fixture(AppleContract).registeredUsers(user);
  const dto = new PlantAppleTreeDto(Variety.GALA, 1, randomUniqueKey()).signed(user.privateKey);
  const expectedTree = new AppleTree(user.identityKey, dto.variety, dto.index, ctx.txUnixTime);

  // When
  const response = await contract.PlantTree(ctx, dto);

  // Then
  expect(response).toEqual(transactionSuccess());
  expect(getWrites()).toEqual(writesMap(expectedTree));
});

it("should fail to plant a tree if tree already exists", async () => {
  // Given
  const user = users.random();

  const { contract, ctx, getWrites } = fixture(AppleContract)
    .registeredUsers(user)
    .savedState(new AppleTree(user.identityKey, Variety.GOLDEN_DELICIOUS, 1, 0));

  const dto = new PlantAppleTreeDto(Variety.GOLDEN_DELICIOUS, 1, randomUniqueKey()).signed(user.privateKey);

  // When
  const response = await contract.PlantTree(ctx, dto);

  // Then
  expect(response).toEqual(transactionErrorMessageContains("Tree already exists"));
  expect(getWrites()).toEqual({});
});

it("should allow to pick apples", async () => {
  // Given
  const twoYearsAgo = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 2).getTime();
  const tree = new AppleTree("client|some-user", Variety.GALA, 1, twoYearsAgo);
  const user = users.random();
  const { contract, ctx, getWrites } = fixture(AppleContract).registeredUsers(user).savedState(tree);

  const dto = new PickAppleDto(tree.plantedBy, tree.variety, tree.index, randomUniqueKey()).signed(
    user.privateKey
  );

  // When
  const response = await contract.PickApple(ctx, dto);

  // Then
  expect(response).toEqual(transactionSuccess());
  expect(getWrites()).toEqual(
    writesMap(
      await createValidChainObject(AppleTree, {
        ...tree,
        applesPicked: tree.applesPicked.plus(1)
      })
    )
  );
});
