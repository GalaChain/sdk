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

import { currency } from "../testdata/index";
import { validateTokenSwapQuantity } from "./requestTokenSwap";

describe("validateTokenSwapQuantity", () => {
  it("should allow a positive quantity when the supply bound is zero", () => {
    // Given
    const tokenClass = currency.tokenClass();
    tokenClass.maxSupply = new BigNumber("0");
    tokenClass.maxCapacity = new BigNumber("0");

    // When
    const results = validateTokenSwapQuantity(new BigNumber("5"), tokenClass);

    // Then
    expect(results).toEqual([]);
  });

  it("should reject a quantity above a positive supply bound", () => {
    // Given
    const tokenClass = currency.tokenClass();
    tokenClass.maxSupply = new BigNumber("1");
    tokenClass.maxCapacity = new BigNumber("10");

    // When
    const results = validateTokenSwapQuantity(new BigNumber("5"), tokenClass);

    // Then
    expect(results).toEqual(["Token quantity must not exceed Token max supply and max capacity"]);
  });
});
