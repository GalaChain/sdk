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
import { Evaluate, GalaChainContext, GalaContract, Submit } from "@gala-chain/chaincode";

import { version } from "../../package.json";
import { AppleTreeDto, AppleTreesDto, FetchTreesDto, PagedTreesDto, PickAppleDto } from "./dtos";
import { fetchTrees } from "./fetchTrees";
import { pickApple } from "./pickApple";
import { plantTree, plantTrees } from "./plantTrees";

export class AppleContract extends GalaContract {
  constructor() {
    super("AppleContract", version);
  }

  @Submit({
    in: AppleTreeDto
  })
  public async PlantTree(ctx: GalaChainContext, dto: AppleTreeDto): Promise<void> {
    await plantTree(ctx, dto);
  }

  @Submit({
    in: AppleTreesDto
  })
  public async PlantTrees(ctx: GalaChainContext, dto: AppleTreesDto): Promise<void> {
    await plantTrees(ctx, dto);
  }

  @Evaluate({
    in: FetchTreesDto,
    out: PagedTreesDto
  })
  public async FetchTrees(ctx: GalaChainContext, dto: FetchTreesDto): Promise<PagedTreesDto> {
    return await fetchTrees(ctx, dto);
  }

  @Submit({
    in: PickAppleDto
  })
  public async PickApple(ctx: GalaChainContext, dto: PickAppleDto): Promise<void> {
    return await pickApple(ctx, dto);
  }
}
