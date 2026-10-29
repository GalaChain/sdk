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

import { ChainObject } from "./ChainObject";
import { TokenInstance, TokenInstanceKey } from "./TokenInstance";

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

it("should encode and decode token instance key from base58 encoded string", async () => {
  // Given
  const instance = new TokenInstanceKey();
  instance.collection = "Test";
  instance.category = "Very";
  instance.type = "Large";
  instance.additionalKey = "Instance";
  instance.instance = new BigNumber(1);

  const base58EncodedString = instance.toB58EncodedString();

  // When
  const decodedInstance = TokenInstanceKey.fromB58EncodedString(base58EncodedString);

  // Then
  expect(decodedInstance).toEqual(instance);
});

it("should encode and decode successfully with $ in keys", async () => {
  // Given
  const instance = new TokenInstanceKey();
  instance.collection = "$Test";
  instance.category = "Ve$ry";
  instance.type = "La$rge$";
  instance.additionalKey = "Ins$tance$";
  instance.instance = new BigNumber(1);

  const base58EncodedString = instance.toB58EncodedString();

  // When
  const decodedInstance = TokenInstanceKey.fromB58EncodedString(base58EncodedString);

  // Then
  expect(decodedInstance).toEqual(instance);
});

it("rejects an instance id with trailing characters", () => {
  expect(() => TokenInstance.GetCompositeKeyFromString("collection$12junk")).toThrow(/Invalid string/);
});

it("builds an instance key from the whole integer", () => {
  expect(TokenInstance.GetCompositeKeyFromString("collection$12")).toEqual(
    ChainObject.getCompositeKeyFromParts(TokenInstance.INDEX_KEY, ["collection", "12"])
  );
});

it("should build a string key when key fields contain $", () => {
  // Given
  const instance = new TokenInstanceKey();
  instance.collection = "$Test";
  instance.category = "Ve$ry";
  instance.type = "Large";
  instance.additionalKey = "none";
  instance.instance = new BigNumber(0);

  // When
  const stringKey = instance.toStringKey();

  // Then
  expect(stringKey).toEqual("$Test$Ve$ry$Large$none$0");
});
