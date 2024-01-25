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
import {
  GalaChainContext,
  getObjectsByPartialCompositeKeyWithPagination,
  takeUntilUndefined
} from "@gala-chain/chaincode";

import { AppleTree } from "./AppleTree";
import { FetchTreesDto, PagedTreesDto } from "./dtos";

export async function fetchTrees(ctx: GalaChainContext, dto: FetchTreesDto): Promise<PagedTreesDto> {
  const keyParts = takeUntilUndefined(dto.plantedBy, dto.variety, dto.index?.toString());

  const { results, metadata } = await getObjectsByPartialCompositeKeyWithPagination(
    ctx,
    AppleTree.INDEX_KEY,
    keyParts,
    AppleTree,
    dto.bookmark,
    dto.limit
  );

  return new PagedTreesDto(results, metadata.bookmark);
}
