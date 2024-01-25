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
import { Transform } from "class-transformer";

import { ChainKey } from "../utils";
import { RangedChainObject } from "./RangedChainObject";

class TestRangedClass extends RangedChainObject {
  static INDEX_KEY = "ranged-test";

  @ChainKey({ position: 0 })
  isNft: boolean;

  @ChainKey({ position: 1 })
  @Transform(({ value }) => `cat.${value}`)
  category: string;

  constructor(isNft: boolean, category: string) {
    super();
    this.isNft = isNft;
    this.category = category;
  }
}

it("should use custom serializers while constructing ranged key", () => {
  // Given
  const obj = new TestRangedClass(true, "legendary");
  const expectedKey = [TestRangedClass.INDEX_KEY, "true", "cat.legendary"].join("\u0000");

  // When
  const key = obj.getRangedKey();

  // Then
  expect(key).toEqual(expectedKey);
});
