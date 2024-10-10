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
import { FeeExemption, FeeExemptionDto } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";

/**
 * @description
 *
 * Write a new (or overwrite an existing) `FeeExemption` entry.
 *
 * `FeeExemption` entries are intended for use cases where the calling user
 * should not be expected to cover fees, possibly when users have paid fees
 * through some other means.
 *
 * Typically these identities would
 * represent game server identities, application services, or other
 * channel-operator defined entities that need a special-case exemption.
 *
 * @param ctx
 * @param dto
 * @returns
 */
export async function authorizeExemptionForUser(ctx: GalaChainContext, dto: FeeExemptionDto) {
  const exemption: FeeExemption = plainToInstance(FeeExemption, {
    user: dto.user
  });

  if (dto.limitTo) {
    exemption.limitedTo = dto.limitTo;
  }

  await putChainObject(ctx, exemption);

  return exemption;
}
