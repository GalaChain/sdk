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
  FeeAccelerationRateType,
  FeeCodeDefinition,
  FeeCodeDefinitionDto,
  GalaChainResponse,
  TokenBalance,
  TokenClass,
  TokenInstance,
  createValidDTO
} from "@gala-chain/api";
import { GalaChainContext } from "../types";
import { currency, fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("defineFeeSchedule", () => {
  it("should save FeeCodeDefinitions on chain", async () => {
    // Given
    const currencyInstance: TokenInstance = currency.tokenInstance();
    const currencyClass: TokenClass = currency.tokenClass();
    const userBalance: TokenBalance = currency.tokenBalance();
    const authorizedFeeQuantity = new BigNumber("100");

    const { ctx, contract, writes } = fixture<GalaChainContext, GalaChainTokenContract>(
      GalaChainTokenContract
    )
      .callingUser(users.testUser1Id)
      .savedState(currencyInstance, currencyClass, userBalance)
      .savedRangeState([]);

    const dto = await createValidDTO(FeeCodeDefinitionDto, {
      feeCode: "TestFeeContractFunction",
      feeThresholdUses: new BigNumber("10"),
      feeThresholdTimePeriod: 1,
      baseQuantity: new BigNumber("1"),
      maxQuantity: new BigNumber("1000"),
      feeAccelerationRateType: FeeAccelerationRateType.CuratorDefined,
      feeAccelerationRate: new BigNumber("1")
    });

    // When
    const response = await contract.DefineFeeSchedule(ctx, dto);

    // Then
    const {
      feeCode,
      feeThresholdUses,
      feeThresholdTimePeriod,
      baseQuantity,
      maxQuantity,
      feeAccelerationRate,
      feeAccelerationRateType
    } = dto;

    const resDto = plainToInstance(FeeCodeDefinition, {
      feeCode,
      feeThresholdUses,
      feeThresholdTimePeriod,
      baseQuantity,
      maxQuantity,
      feeAccelerationRate,
      feeAccelerationRateType
    });

    expect(response).toEqual(GalaChainResponse.Success(resDto));
  });
});
