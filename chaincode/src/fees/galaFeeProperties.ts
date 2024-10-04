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
import { ChainError, ChainObject, FeeProperties, FeePropertiesDto } from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

/**
 * features like Fees are anticipated to *only* support $GALA as the currency of choice.
 * Current plans are for all fees to be paid in $GALA.
 * This hardcoded id here gives us something to use as a ChainKey for the properties
 * while keeping it effectively immutable
 * from outside assets-chaincode calls without a code change.
 */
export const galaFeePropertiesIdentifier = "galachain";

export async function fetchGalaFeeProperties(ctx: GalaChainContext): Promise<FeeProperties | ChainError> {
  const feePropertiesKey = ChainObject.getCompositeKeyFromParts(FeeProperties.INDEX_KEY, [
    galaFeePropertiesIdentifier
  ]);

  const feeProperties: FeeProperties | ChainError = await getObjectByKey(
    ctx,
    FeeProperties,
    feePropertiesKey
  ).catch((e) => e);

  return feeProperties;
}

export async function setGalaFeeProperties(ctx: GalaChainContext, dto: FeePropertiesDto) {
  const { collection, category, type, additionalKey, instance } = dto;

  const feeProperties = plainToInstance(FeeProperties, {
    id: galaFeePropertiesIdentifier,
    collection,
    category,
    type,
    additionalKey,
    instance
  });

  await feeProperties.validate();

  await putChainObject(ctx, feeProperties);

  return feeProperties;
}
