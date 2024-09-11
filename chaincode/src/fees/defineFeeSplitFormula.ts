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
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { plainToClass as plainToInstance } from "class-transformer";

import { FeeCodeSplitFormula, FeeCodeSplitFormulaDto } from "@gala-chain/api";

export async function defineFeeSplitFormula(
  ctx: GalaChainContext,
  dto: FeeCodeSplitFormulaDto
): Promise<FeeCodeSplitFormula> {
  const { feeCode, burnPercentage, transferPercentages } = dto;

  const splitFormula = plainToInstance(FeeCodeSplitFormula, {
    feeCode,
    burnPercentage,
    transferPercentages
  });

  await splitFormula.validate();

  await splitFormula.validatePercentages();

  // todo: consider an additional security validation that:
  //   a) look up Fee currency token class ($GALA),
  //   b) if found, verify calling user is a token authority
  //   c) if not found, proceed without a token authority check.
  // this may or may not be too restrictive. Using this logic could add an extra security check in the
  // assets channel, while still giving cross-channel fee curators freedom to define their own fee terms.

  await putChainObject(ctx, splitFormula);

  return splitFormula;
}
