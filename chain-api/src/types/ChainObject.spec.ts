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
import { Transform } from "class-transformer";
import { IsString } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberProperty } from "../validators";
import { ChainObject } from "./ChainObject";

class TestClass extends ChainObject {
  static INDEX_KEY = "test";

  @ChainKey({ position: 0 })
  @BigNumberProperty()
  bigNum: BigNumber;

  @ChainKey({ position: 1 })
  @Transform(({ value }) => `category.${value}`)
  category: string;

  constructor(bigNum: BigNumber, category: string) {
    super();
    this.bigNum = bigNum;
    this.category = category;
  }
}

class TestClassWithConstructorField extends ChainObject {
  static INDEX_KEY = "test-ctor";

  @ChainKey({ position: 0 })
  @IsString()
  owner: string;

  plantedAt: number;

  constructor() {
    super();
    this.plantedAt = 0;
  }
}

it("should drop undeclared fields when deserializing a chain object", () => {
  // Given
  const stored = {
    bigNum: "123",
    category: "legendary",
    quantityLocked: "5",
    leftoverField: true
  };

  // When
  const obj = ChainObject.deserialize(TestClass, stored);

  // Then
  expect(obj).toBeInstanceOf(TestClass);
  expect(obj.bigNum).toEqual(new BigNumber("123"));
  expect(obj).not.toHaveProperty("quantityLocked");
  expect(obj).not.toHaveProperty("leftoverField");
});

it("should keep constructor-initialized fields that have no validator", () => {
  // Given
  const stored = {
    owner: "client|user1",
    plantedAt: 1_700_000_000_000,
    leftoverField: true
  };

  // When
  const obj = ChainObject.deserialize(TestClassWithConstructorField, stored);

  // Then
  expect(obj.plantedAt).toEqual(1_700_000_000_000);
  expect(obj.owner).toEqual("client|user1");
  expect(obj).not.toHaveProperty("leftoverField");
});

it("should use custom serializers while constructing composite key", () => {
  // Given
  const bigNumStr = "730750818665451215712927172538123444058715062271"; // MAX_SAFE_INTEGER^3
  const bigNum = new BigNumber(bigNumStr);
  expect(bigNum.toString()).toEqual(expect.stringContaining("e+")); // by default converted to exp notation

  const dto = new TestClass(bigNum, "legendary");

  const expectedKey = ["", TestClass.INDEX_KEY, bigNumStr, `category.legendary`, ""].join("\u0000");

  // When
  const key = dto.getCompositeKey();

  // Then
  expect(key).toEqual(expectedKey);
});
