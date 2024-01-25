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

import { TokenInstance } from "./TokenInstance";

it("should get proper value for long instance key", async () => {
  // Given
  const bigInstanceNumber = new BigNumber(Number.MAX_SAFE_INTEGER).pow(2);

  const instance = new TokenInstance();
  instance.collection = "Test";
  instance.category = "Very";
  instance.type = "Large";
  instance.additionalKey = "Instance";
  instance.instance = bigInstanceNumber;

  const expectedKey1Parts = [
    instance.collection,
    "\u0000",
    instance.category,
    "\u0000",
    instance.type,
    "\u0000",
    instance.additionalKey,
    "\u0000",
    instance.instance.toFixed()
  ];

  const expectedKey2Parts = ["\u0000", TokenInstance.INDEX_KEY, "\u0000", ...expectedKey1Parts, "\u0000"];

  // When
  const key1 = instance.GetCompositeKeyString();
  const key2 = instance.getCompositeKey();

  // Then
  expect([key1, key2]).toEqual([expectedKey1Parts.join(""), expectedKey2Parts.join("")]);
});
