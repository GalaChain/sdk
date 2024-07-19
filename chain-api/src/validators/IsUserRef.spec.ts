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
import { ChainCallDTO, createValidDTO } from "../types";
import { IsUserRef } from "./IsUserRef";

class TestClass extends ChainCallDTO {
  @IsUserRef()
  user: string;
}

const checksumedEthAddress = "0abB6F637a51eb26665e0DeBc5CE8A84e1fa8AC3";
const lowerCased = checksumedEthAddress.toLowerCase();
const invalidChecksum = checksumedEthAddress.replace("a", "A");

test.each<[string, string, string]>([
  ["valid legacy alias", "client|123", "client|123"],
  ["valid eth alias", `eth|${checksumedEthAddress}`, `eth|${checksumedEthAddress}`],
  ["valid checksumed address", checksumedEthAddress, `eth|${checksumedEthAddress}`],
  ["valid checksumed address (trailing 0x)", `0x${checksumedEthAddress}`, `eth|${checksumedEthAddress}`],
  ["valid lower-cased address", lowerCased, `eth|${checksumedEthAddress}`],
  ["valid lower-cased address (trailing 0x)", `0x${lowerCased}`, `eth|${checksumedEthAddress}`]
])("%s", async (label, input, expected) => {
  // Given
  const plain = { user: input };

  // When
  const validated = await createValidDTO(TestClass, plain);

  // Then
  expect(validated.user).toBe(expected);
});

test.each<[string, string, string]>([
  ["invalid client alias (multiple |)", "client|123|45", "Expected string following the format"],
  ["invalid client alias (empty id)", "client|", "Expected string following the format"],
  ["invalid eth alias (lower-cased eth)", `eth|${lowerCased}`, "'eth|' must end with valid checksumed"],
  ["invalid eth alias (invalid eth)", "eth|123", "'eth|' must end with valid checksumed"],
  ["invalid eth address (invalid checksum)", invalidChecksum, "please make sure it is checksumed"],
  ["invalid eth address (invalid checksum, 0x)", `0x${invalidChecksum}`, "please make sure it is checksumed"],
  ["invalid eth address (invalid characters)", "0xabcdefg", "Invalid eth address provided"]
])("%s", async (label, input, expectedError) => {
  // Given
  const plain = { user: input };

  // When
  const failed = createValidDTO(TestClass, plain);

  // Then
  await expect(failed).rejects.toThrow(expectedError);
});
