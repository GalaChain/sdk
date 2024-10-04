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
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { ValidationFailedError } from "../utils";
import {
  FeeCodeSplitFormula,
  FeeCodeTransferPercentage,
  FeeCodeTransferQuantity
} from "./FeeCodeSplitFormula";

test("calculateAmounts() method calculates correct amounts and respects TokenClass decimal limits", () => {
  // Given
  const transferDetails = plainToInstance(FeeCodeTransferPercentage, {
    transferToUser: "client|test-user",
    transferPercentage: 0.1
  });

  const splitFormula = plainToInstance(FeeCodeSplitFormula, {
    feeCode: "TestFeeCode",
    burnPercentage: 0.9,
    transferPercentages: [transferDetails]
  });

  const simpleIntegerFee = new BigNumber("100");

  const decimalFee = new BigNumber(
    "3.14159265358979323846264338327950288419716939937510582097" +
      "49445923078164062862089986280348253421170679"
  );

  const tokenClassDecimalPlaces = 8;

  // When
  const [simpleBurnQuantity, [simpleTransferQuantity]] = splitFormula.calculateAmounts(
    simpleIntegerFee,
    tokenClassDecimalPlaces
  );

  const [decimalBurnQuantity, [decimalTransferQuantity]] = splitFormula.calculateAmounts(
    decimalFee,
    tokenClassDecimalPlaces
  );

  // Then
  const expectedSimpleBurnQuantity = new BigNumber("90");
  const expectedSimpleFeeSplit = plainToInstance(FeeCodeTransferQuantity, {
    transferToUser: "client|test-user",
    transferPercentage: 0.1,
    transferQuantity: new BigNumber("10")
  });

  expect(simpleBurnQuantity.toNumber()).toBe(expectedSimpleBurnQuantity.toNumber());
  expect(simpleTransferQuantity).toEqual(expectedSimpleFeeSplit);

  const expectedDecimalTransferQuantity = decimalFee
    .times(transferDetails.transferPercentage)
    .decimalPlaces(tokenClassDecimalPlaces);

  const expectedDecimalBurnQuantity = decimalFee
    .decimalPlaces(tokenClassDecimalPlaces)
    .minus(expectedDecimalTransferQuantity);

  // illustrate rounding error introduced when simply multiplying the total fee
  // by all the defined percentages
  const roundedDecimalQuantity = decimalFee.times(0.9).decimalPlaces(tokenClassDecimalPlaces);
  const roundedSum = roundedDecimalQuantity.plus(expectedDecimalTransferQuantity);

  const expectedDecimalFeeSplit = plainToInstance(FeeCodeTransferQuantity, {
    transferToUser: "client|test-user",
    transferPercentage: 0.1,
    transferQuantity: expectedDecimalTransferQuantity
  });

  expect(decimalBurnQuantity.toNumber()).toBe(expectedDecimalBurnQuantity.toNumber());
  expect(decimalBurnQuantity.plus(decimalTransferQuantity.transferQuantity).toNumber()).toBe(
    decimalFee.decimalPlaces(8).toNumber()
  );

  expect(decimalTransferQuantity).toEqual(expectedDecimalFeeSplit);

  expect(roundedSum.toNumber()).toBeGreaterThan(decimalFee.decimalPlaces(8).toNumber());
});

test("calculateAmounts() supports multiple transfer identities", async () => {
  // Given
  const transferPercentage1 = plainToInstance(FeeCodeTransferPercentage, {
    transferToUser: "client|test-pool-1",
    transferPercentage: 0.1
  });

  const transferPercentage2 = plainToInstance(FeeCodeTransferPercentage, {
    transferToUser: "client|test-pool-2",
    transferPercentage: 0.25
  });

  const transferPercentage3 = plainToInstance(FeeCodeTransferPercentage, {
    transferToUser: "client|test-pool-3",
    transferPercentage: 0.35
  });

  const splitFormula = plainToInstance(FeeCodeSplitFormula, {
    feeCode: "TestFeeCode",
    burnPercentage: 0.3,
    transferPercentages: [transferPercentage1, transferPercentage2, transferPercentage3]
  });

  const fee = new BigNumber("100");

  const tokenClassDecimalPlaces = 8;

  // When
  const [burnQty, [transfer1, transfer2, transfer3]] = splitFormula.calculateAmounts(
    fee,
    tokenClassDecimalPlaces
  );

  // Then
  const expectedSimpleBurnQuantity = new BigNumber("30");
  const expectedTransfer1 = plainToInstance(FeeCodeTransferQuantity, {
    transferToUser: "client|test-pool-1",
    transferPercentage: 0.1,
    transferQuantity: new BigNumber("10")
  });

  const expectedTransfer2 = plainToInstance(FeeCodeTransferQuantity, {
    transferToUser: "client|test-pool-2",
    transferPercentage: 0.25,
    transferQuantity: new BigNumber("25")
  });

  const expectedTransfer3 = plainToInstance(FeeCodeTransferQuantity, {
    transferToUser: "client|test-pool-3",
    transferPercentage: 0.35,
    transferQuantity: new BigNumber("35")
  });

  expect(burnQty.toNumber()).toBe(expectedSimpleBurnQuantity.toNumber());
  expect(transfer1).toEqual(expectedTransfer1);
  expect(transfer2).toEqual(expectedTransfer2);
  expect(transfer3).toEqual(expectedTransfer3);
});

test("validatePercentages() method fails if percentages don't add up to 1.0", async () => {
  // Given
  const transferPercentage = plainToInstance(FeeCodeTransferPercentage, {
    transferToUser: "client|test-user",
    transferPercentage: 0.2
  });

  const splitFormula = plainToInstance(FeeCodeSplitFormula, {
    feeCode: "TestFeeCode",
    burnPercentage: 0.9,
    transferPercentages: [transferPercentage]
  });

  // When
  const validationResult = await splitFormula.validatePercentages().catch((e) => e);

  // Then
  expect(validationResult).toEqual(
    new ValidationFailedError(
      `FeeCodeSplitFormula's burnPercentage and transferPercentages must add up to exactly 1.0. ` +
        `Calculated 1.1 from burnPercentage 0.9 and transferPercentages 0.2`
    )
  );
});

test("validatePercentages() method succeeds if percentages do add up to 1.0", async () => {
  // Given
  const transferPercentage = plainToInstance(FeeCodeTransferPercentage, {
    transferToUser: "client|test-user",
    transferPercentage: 0.1
  });

  const splitFormula = plainToInstance(FeeCodeSplitFormula, {
    feeCode: "TestFeeCode",
    burnPercentage: 0.9,
    transferPercentages: [transferPercentage]
  });

  // When
  const validationResult = await splitFormula.validatePercentages().catch((e) => e);

  // Then
  expect(validationResult).toBe(splitFormula);
});
