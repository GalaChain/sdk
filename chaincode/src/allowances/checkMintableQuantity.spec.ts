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
import { currency } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import { MintCapacityExceededError, TotalSupplyExceededError } from "./AllowanceError";
import { ensureQuantityCanBeMinted } from "./grantAllowance";

describe("CheckMintableQuantity", () => {
  it("should CheckMintableQuantity", async () => {
    // Given
    const currencyClass = currency.tokenClass();

    // When
    const response = ensureQuantityCanBeMinted(
      currencyClass,
      new BigNumber("10"),
      new BigNumber("0"),
      new BigNumber("0")
    );

    // Then
    expect(response).toEqual(true);
  });

  it("should report Invalid_Supply", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    currencyClass.maxSupply = new BigNumber("100");

    // When
    const response = () =>
      ensureQuantityCanBeMinted(
        currencyClass,
        new BigNumber("10000"),
        new BigNumber("0"),
        new BigNumber("0")
      );

    // Then
    expect(response).toThrow(
      new TotalSupplyExceededError(
        currencyClass.getCompositeKey(),
        currencyClass.maxSupply,
        new BigNumber("10000")
      )
    );
  });

  it("should report Invalid_Capacity", async () => {
    // Given
    const currencyClass = currency.tokenClass();
    currencyClass.maxCapacity = new BigNumber("100");

    // When
    const response = () =>
      ensureQuantityCanBeMinted(
        currencyClass,
        new BigNumber("10000"),
        new BigNumber("0"),
        new BigNumber("0")
      );

    // Then
    expect(response).toThrow(
      new MintCapacityExceededError(
        currencyClass.getCompositeKey(),
        currencyClass.maxCapacity,
        new BigNumber("10000")
      )
    );
  });
});
