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
import { generateSchema } from "../utils";
import { IsUserAlias } from "./IsUserAlias";

class TestDto extends ChainCallDTO {
  @IsUserAlias()
  user: string;
}

class TestArrayDto extends ChainCallDTO {
  @IsUserAlias({ each: true })
  users: string[];
}

const checksumedEthAddress = "0abB6F637a51eb26665e0DeBc5CE8A84e1fa8AC3";
const lowerCased = checksumedEthAddress.toLowerCase();
const invalidChecksum = checksumedEthAddress.replace("a", "A");

test.each<[string, string, string]>([
  ["valid legacy alias", "client|123", "client|123"],
  ["valid eth alias", `eth|${checksumedEthAddress}`, `eth|${checksumedEthAddress}`],
  ["valid bridge (eth)", `EthereumBridge`, `EthereumBridge`],
  ["valid bridge (GalaChain)", `GalaChainBridge-42`, `GalaChainBridge-42`]
])("%s", async (label, input, expected) => {
  // Given
  const plain = { user: input };

  // When
  const validated = await createValidDTO(TestDto, plain);

  // Then
  expect(validated.user).toBe(expected);
});

test.each<[string, string, string]>([
  ["invalid client alias (multiple |)", "client|123|45", "Expected string following the format"],
  ["invalid client alias (empty id)", "client|", "Expected string following the format"],
  ["invalid eth alias (lower-cased eth)", `eth|${lowerCased}`, "'eth|' must end with valid checksumed"],
  ["invalid eth alias (invalid eth)", "eth|123", "'eth|' must end with valid checksumed"],
  ["invalid value (pure eth addr)", checksumedEthAddress, "Expected string following the format"],
  ["invalid bridge (external)", "GoldenGateBridge", "Expected string following the format"],
  ["invalid bridge (GalaChain)", "GalaChainBridge-A", "Expected string following the format"]
])("%s", async (label, input, expectedError) => {
  // Given
  const plain = { user: input };

  // When
  const failed = createValidDTO(TestDto, plain);

  // Then
  await expect(failed).rejects.toThrow(expectedError);
});

it("should validate array of user aliases", async () => {
  // Given
  const validPlain = {
    users: ["client|123", `eth|${checksumedEthAddress}`, `EthereumBridge`, `GalaChainBridge-42`]
  };

  const invalidPlain = { users: ["client|123", `eth|${invalidChecksum}`, "EthereumBridge"] };

  // When
  const valid = await createValidDTO(TestArrayDto, validPlain);
  const invalid = createValidDTO(TestArrayDto, invalidPlain);

  // Then
  expect(valid.users).toEqual(validPlain.users);
  await expect(invalid).rejects.toThrow(`users property with values eth|${invalidChecksum} are not valid`);
});

it("should support schema generation", () => {
  // When
  const schema1 = generateSchema(TestDto);
  const schema2 = generateSchema(TestArrayDto);

  // Then
  expect(schema1).toEqual(
    expect.objectContaining({
      properties: expect.objectContaining({
        user: {
          type: "string",
          description: expect.stringContaining("Allowed value is string following the format")
        }
      })
    })
  );
  expect(schema2).toEqual(
    expect.objectContaining({
      properties: expect.objectContaining({
        users: {
          type: "array",
          items: {
            type: "string",
            description: expect.stringContaining("Allowed value is string following the format")
          }
        }
      })
    })
  );
});
