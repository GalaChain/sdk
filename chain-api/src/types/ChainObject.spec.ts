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

import { ChainKey } from "../utils";
import { BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { UserAlias, asValidUserAlias } from "./UserAlias";

class TestClass extends ChainObject {
  static INDEX_KEY = "test";

  @ChainKey({ position: 0 })
  @BigNumberProperty()
  bigNum: BigNumber;

  @ChainKey({ position: 1 })
  @Transform(({ value }) => `category.${value}`)
  category: string;

  @IsUserAlias()
  owner: string;

  constructor(bigNum: BigNumber, category: string, owner: UserAlias) {
    super();
    this.bigNum = bigNum;
    this.category = category;
    this.owner = owner;
  }
}

describe("composite key", () => {
  it("should use custom serializers while constructing composite key", () => {
    // Given
    const bigNumStr = "730750818665451215712927172538123444058715062271"; // MAX_SAFE_INTEGER^3
    const bigNum = new BigNumber(bigNumStr);
    expect(bigNum.toString()).toEqual(expect.stringContaining("e+")); // by default converted to exp notation

    const obj = new TestClass(bigNum, "legendary", asValidUserAlias("client|user"));

    const expectedKey = ["", TestClass.INDEX_KEY, bigNumStr, `category.legendary`, ""].join("\u0000");

    // When
    const key = obj.getCompositeKey();

    // Then
    expect(key).toEqual(expectedKey);
  });
});

describe("serialization", () => {
  it("should serialize and deserialize the object correctly", () => {
    // Given
    const obj = new TestClass(new BigNumber(1), "legendary", asValidUserAlias("client|user"));

    const expectedKey = ["", TestClass.INDEX_KEY, "1", `category.legendary`, ""].join("\u0000");
    const expectedValue = '{"owner":"client|user"}';
    const expectedSerialized = `{"bigNum":"1","category":"legendary","owner":"client|user"}`;

    // When
    const [key, value] = obj.serializeChainState();
    const serialized = obj.serialize();
    const deserialized = ChainObject.deserializeChainState(TestClass, key, value);

    // Then
    expect(key).toEqual(expectedKey);
    expect(value.toString()).toEqual(expectedValue);
    expect(serialized).toEqual(expectedSerialized);
    expect(deserialized).toEqual(obj);
  });
});
