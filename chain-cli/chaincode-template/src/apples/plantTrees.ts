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
import { ConflictError } from "@gala-chain/api";
import { GalaChainContext, ObjectNotFoundError, getObjectByKey, putChainObject } from "@gala-chain/chaincode";

import { AppleTree } from "./AppleTree";
import { AppleTreeDto, PlantAppleTreesDto } from "./dtos";

export async function plantTrees(ctx: GalaChainContext, dto: PlantAppleTreesDto): Promise<AppleTree[]> {
  const planted: AppleTree[] = [];
  const seen = new Set<string>();

  for (const tree of dto.trees) {
    const key = `${tree.variety}:${tree.index}`;
    if (seen.has(key)) {
      throw new ConflictError("Duplicate tree in request", { variety: tree.variety, index: tree.index });
    }
    seen.add(key);
    planted.push(await plantTree(ctx, tree));
  }

  return planted;
}

export async function plantTree(ctx: GalaChainContext, dto: AppleTreeDto): Promise<AppleTree> {
  const tree = new AppleTree(ctx.callingUser, dto.variety, dto.index, ctx.txUnixTime);

  const existingTree = await getObjectByKey(ctx, AppleTree, tree.getCompositeKey()).catch(
    (error: unknown) => {
      if (error instanceof ObjectNotFoundError) {
        return undefined;
      }
      throw error;
    }
  );

  if (existingTree !== undefined) {
    throw new ConflictError("Tree already exists on chain", existingTree.toPlainObject());
  }

  await putChainObject(ctx, tree);

  return tree;
}
