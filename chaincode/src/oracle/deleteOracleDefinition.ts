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
import { OracleDefinition, UnauthorizedError } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { deleteChainObject, getObjectByKey } from "../utils";

export interface IDeleteOracleDefinition {
  name: string;
}

const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

export async function deleteOracleDefinition(ctx: GalaChainContext, data: IDeleteOracleDefinition) {
  const oracle = await getObjectByKey(
    ctx,
    OracleDefinition,
    OracleDefinition.getCompositeKeyFromParts(OracleDefinition.INDEX_KEY, [data.name])
  );

  if (ctx.clientIdentity.getMSPID() !== curatorOrgMsp && !oracle.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(
      `callingUser ${ctx.callingUser} attempted to delete ` +
        `OracleDefinition ${oracle.name}, but is not listed as an authority: ` +
        `${oracle.authorities.join(", ")}`
    );
  }

  await deleteChainObject(ctx, oracle);

  return oracle;
}
