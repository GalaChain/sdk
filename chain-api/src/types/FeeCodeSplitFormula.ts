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
import { BigNumber } from "bignumber.js";
import { Exclude, Type, plainToInstance } from "class-transformer";
import { ArrayMinSize, IsNotEmpty, IsNumber, IsString, Max, Min, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey } from "../utils";
import { ValidationFailedError } from "../utils";
import { BigNumberIsPositive, IsBigNumber, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

@JSONSchema({
  description: "Define an address/identity to which a percentage of Fees should be transferred."
})
export class FeeCodeTransferPercentage extends ChainObject {
  @JSONSchema({
    description:
      "User identity / GalaChain address representing the address to which this " +
      "portion of the fee should be transferred."
  })
  @IsUserAlias()
  transferToUser: string;

  @JSONSchema({
    description:
      "A number between 0 and 1 that represents the percentage / proportion " +
      "of the total fee which should be transferred to the accompany user identity / address. " +
      "e.g 0.1 for '10%'. "
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  transferPercentage: number;
}

export class FeeCodeTransferQuantity extends ChainObject {
  @IsNotEmpty()
  transferToUser: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  transferPercentage: number;

  @IsBigNumber()
  @BigNumberIsPositive()
  transferQuantity: BigNumber;
}

export class FeeCodeSplitFormula extends ChainObject {
  public static INDEX_KEY = "GCFS";

  @ChainKey({ position: 0 })
  @IsString()
  @IsNotEmpty()
  public feeCode: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  public burnPercentage: number;

  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => FeeCodeTransferPercentage)
  public transferPercentages: FeeCodeTransferPercentage[];

  @Exclude()
  public calculateAmounts(
    totalFeeQuantity: BigNumber,
    tokenDecimals: number
  ): [BigNumber, FeeCodeTransferQuantity[]] {
    const burnPercentage = this.burnPercentage;
    const transferPercentages: FeeCodeTransferPercentage[] = this.transferPercentages;
    const transferQuantities: FeeCodeTransferQuantity[] = [];

    let remainingFeeQuantity = totalFeeQuantity.decimalPlaces(tokenDecimals);

    for (let i = 0; i < transferPercentages.length; i++) {
      let amount: BigNumber;
      if (burnPercentage === 0 && i + 1 === transferPercentages.length) {
        // last one, assign remainder, avoid roundings errors from multiplication
        amount = remainingFeeQuantity.decimalPlaces(tokenDecimals);
      } else {
        amount = totalFeeQuantity
          .times(transferPercentages[i].transferPercentage)
          .decimalPlaces(tokenDecimals);

        remainingFeeQuantity = remainingFeeQuantity.minus(amount);
      }

      const transferQuantity = plainToInstance(FeeCodeTransferQuantity, {
        transferToUser: transferPercentages[i].transferToUser,
        transferPercentage: transferPercentages[i].transferPercentage,
        transferQuantity: amount
      });

      transferQuantities.push(transferQuantity);
    }

    const burnQuantity = remainingFeeQuantity;

    return [burnQuantity, transferQuantities];
  }

  @Exclude()
  public async validatePercentages(): Promise<FeeCodeSplitFormula> {
    let percentageTotal = this.burnPercentage;
    const transferPercentages: number[] = [];
    for (const t of this.transferPercentages) {
      percentageTotal = percentageTotal + t.transferPercentage;
      transferPercentages.push(t.transferPercentage);
    }

    if (percentageTotal !== 1) {
      throw new ValidationFailedError(
        `FeeCodeSplitFormula's burnPercentage and transferPercentages must add up to exactly 1.0. ` +
          `Calculated ${percentageTotal} from burnPercentage ${this.burnPercentage} and ` +
          `transferPercentages ${transferPercentages.join(",")}`
      );
    }

    return this;
  }
}
