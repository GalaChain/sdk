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

import { TokenBurnCounter } from "./TokenBurnCounter";
import { UserAlias } from "./UserAlias";

it("should identify the referenced burn by token instance", () => {
  // Given
  const counter = new TokenBurnCounter();
  counter.burnedBy = "client|burner" as UserAlias;
  counter.collection = "GALA";
  counter.category = "Unit";
  counter.type = "none";
  counter.additionalKey = "none";
  counter.instance = new BigNumber("7");
  counter.created = 1_000;

  // When
  const referenceId = counter.referencedBurnId();

  // Then
  expect(referenceId).toEqual("client|burner$GALA$Unit$none$none$7$1000");
});
