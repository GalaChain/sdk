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
import { ChainError, ErrorCode, OracleDefinition, UnauthorizedError } from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { plainToInstance } from "class-transformer";

export interface IOracleDefinition {
  name: string;
  authorities: string[];
}

export async function saveOracleDefinition(
  ctx: GalaChainContext,
  data: IOracleDefinition
): Promise<OracleDefinition> {
  const existingOracle = await getObjectByKey(
    ctx,
    OracleDefinition,
    OracleDefinition.getCompositeKeyFromParts(OracleDefinition.INDEX_KEY, [data.name])
  ).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  if (existingOracle !== undefined && !existingOracle.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(
      `Oracle ${data.name} exists and callingUser ${ctx.callingUser} is not ` +
        `an authority: ${existingOracle.authorities.join(", ")}`
    );
  }

  if (data.authorities.length < 1) {
    data.authorities.push(ctx.callingUser);
  }

  const oracle = plainToInstance(OracleDefinition, {
    name: data.name,
    authorities: data.authorities
  });

  await oracle.validateOrReject();

  await putChainObject(ctx, oracle);

  return oracle;
}
