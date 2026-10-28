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
  BatchMintTokenDto,
  BurnToMintConfiguration,
  FeeAccelerationRateType,
  FeeCodeDefinition,
  FeeExemption,
  FeeGateCodes,
  FeePendingBalance,
  FeeThresholdUses,
  GalaChainResponse,
  MintTokenDto,
  TokenClassKey,
  TokenInstanceKey,
  TokenMintConfiguration,
  createValidChainObject
} from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";
import { mintTokenExitGate } from "./exitGateImplementations";
import { percentageOfQuantity } from "./extendedFeeGateProcessing";
import { batchMintTokenFeeGate } from "./feeGateImplementations";

const tokenClass = {
  collection: "GALA",
  category: "Unit",
  type: "none",
  additionalKey: "none"
} as TokenClassKey;

describe("percentageOfQuantity", () => {
  it("charges one unit when a positive percentage rounds to zero", () => {
    const amount = percentageOfQuantity(new BigNumber("1"), 0.25, 0);

    expect(amount.isEqualTo(1)).toBe(true);
  });

  it("keeps a zero percentage at zero", () => {
    const amount = percentageOfQuantity(new BigNumber("4"), 0, 0);

    expect(amount.isEqualTo(0)).toBe(true);
  });
});

describe("batchMintTokenFeeGate", () => {
  it("charges the base fee once per mint", async () => {
    const definition = await createValidChainObject(FeeCodeDefinition, {
      feeCode: FeeGateCodes.BatchMintToken,
      feeThresholdUses: new BigNumber("0"),
      feeThresholdTimePeriod: 0,
      baseQuantity: new BigNumber("5"),
      maxQuantity: new BigNumber("1000"),
      feeAccelerationRateType: FeeAccelerationRateType.Additive,
      feeAccelerationRate: new BigNumber("0"),
      isCrossChannel: true
    });
    const balance = await createValidChainObject(FeePendingBalance, {
      owner: users.testUser1.identityKey,
      quantity: new BigNumber("100")
    });
    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(definition, balance);

    const dto = {
      mintDtos: [
        { tokenClass, quantity: new BigNumber("1") },
        { tokenClass, quantity: new BigNumber("1") }
      ]
    } as BatchMintTokenDto;

    await batchMintTokenFeeGate(ctx, dto);
    await ctx.stub.flushWrites();

    const usageJson = Object.entries(getWrites()).find(([key]) =>
      key.includes(FeeThresholdUses.INDEX_KEY)
    )?.[1];
    const usage = JSON.parse(usageJson ?? "{}") as {
      cumulativeUses?: string;
      cumulativeFeeQuantity?: string;
    };
    expect(usage.cumulativeUses).toBe("2");
    expect(usage.cumulativeFeeQuantity).toBe("10");
  });
});

describe("mintTokenExitGate", () => {
  it("skips the post-mint burn for a user exempt from the mint fee", async () => {
    const configuration = await createValidChainObject(TokenMintConfiguration, {
      ...tokenClass,
      postMintBurn: plainToInstance(BurnToMintConfiguration, { burnPercentage: 0.25 })
    });
    const exemption = await createValidChainObject(FeeExemption, {
      user: users.testUser1.identityKey,
      limitedTo: [FeeGateCodes.MintToken]
    });
    const { ctx, getWrites } = fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(users.testUser1)
      .savedState(configuration, exemption);

    await mintTokenExitGate(
      ctx,
      { tokenClass, quantity: new BigNumber("4") } as MintTokenDto,
      GalaChainResponse.Success([{} as TokenInstanceKey])
    );

    expect(getWrites()).toEqual({});
  });
});
