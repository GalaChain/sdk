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
import { DeleteOracleAssertionsDto, OraclePriceAssertion, ValidationFailedError } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { deleteChainObject, getObjectsByKeys } from "../utils";

export interface IDeleteOraclePriceAssertions {
  chainKeys: string[];
}

export async function deleteOraclePriceAssertions(ctx: GalaChainContext, data: IDeleteOraclePriceAssertions) {
  if (data.chainKeys.length > DeleteOracleAssertionsDto.MAX_LIMIT) {
    throw new ValidationFailedError(
      `chainKeys length exceeds allowed maximum: ${DeleteOracleAssertionsDto.MAX_LIMIT}`
    );
  }

  const assertions = await getObjectsByKeys(ctx, OraclePriceAssertion, data.chainKeys);

  for (const assertion of assertions) {
    await deleteChainObject(ctx, assertion);
  }

  return assertions;
}
