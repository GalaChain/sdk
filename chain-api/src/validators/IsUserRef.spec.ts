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
import { ChainCallDTO, UserRef, createValidDTO } from "../types";
import { generateSchema } from "../utils";
import { IsUserRef } from "./IsUserRef";

class TestDto extends ChainCallDTO {
  @IsUserRef()
  user: UserRef;
}

class TestArrayDto extends ChainCallDTO {
  @IsUserRef({ each: true })
  users: UserRef[];
}

const validEthAddress = "0abB6F637a51eb26665e0DeBc5CE8A84e1fa8AC3";
const lowerCasedEth = validEthAddress.toLowerCase();
const invalidChecksumEth = validEthAddress.replace("a", "A");

test.each<[string, string]>([
  ["valid legacy alias", "client|123"],
  ["valid legacy service alias", "service|123"],
  ["valid eth alias", `eth|${validEthAddress}`],
  ["valid 0x eth", `0x${validEthAddress}`],
  ["valid lower-cased 0x eth", `0x${lowerCasedEth}`],
  ["valid bridge (eth)", `EthereumBridge`],
  ["valid bridge (ton)", `TonBridge`],
  ["valid bridge (solana)", `SolanaBridge`],
  ["valid bridge (GalaChain)", `GalaChainBridge-42`]
])("%s", async (label, input) => {
  // Given
  const plain = { user: input as UserRef };

  // When
  const validated = await createValidDTO(TestDto, plain);

  // Then
  expect(validated.user).toBe(input); // don't change the input
});

const genericErrorMessage =
  "is not a valid GalaChain user ref. Expected a valid user alias ('client|<user-id>', or 'eth|<checksumed-eth-addr>', " +
  "or valid system-level username), or valid Ethereum address.";

test.each<[string, string, string]>([
  ["invalid client alias (multiple |)", "client|123|45", genericErrorMessage],
  ["invalid client alias (empty id)", "client|", genericErrorMessage],
  ["invalid eth alias (lower-cased eth)", `eth|${lowerCasedEth}`, "'eth|' must end with valid checksumed"],
  ["invalid eth alias (0x prefix)", `eth|0x${validEthAddress}`, "'eth|' must end with valid checksumed"],
  ["invalid eth alias (invalid eth)", "eth|123", "'eth|' must end with valid checksumed"],
  ["invalid bridge (external)", "GoldenGateBridge", genericErrorMessage],
  ["invalid bridge (GalaChain)", "GalaChainBridge-A", genericErrorMessage]
])("%s", async (label, input, expectedError) => {
  // Given
  const plain = { user: input as UserRef };

  // When
  const failed = createValidDTO(TestDto, plain);

  // Then
  await expect(failed).rejects.toThrow(expectedError);
});

it("should validate array of user refs", async () => {
  // Given
  const validPlain = {
    users: ["client|123", validEthAddress, `EthereumBridge`, `GalaChainBridge-42`] as UserRef[]
  };

  const invalidPlain = { users: ["client|123", `eth|${invalidChecksumEth}`, "EthereumBridge"] as UserRef[] };

  // When
  const valid = await createValidDTO(TestArrayDto, validPlain);
  const invalid = createValidDTO(TestArrayDto, invalidPlain);

  // Then
  expect(valid.users).toEqual(validPlain.users);
  await expect(invalid).rejects.toThrow(`users property with values eth|${invalidChecksumEth} are not valid`);
});

it("should support schema generation", () => {
  // When
  const schema1 = generateSchema(TestDto);
  const schema2 = generateSchema(TestArrayDto);

  // Then
  expect(schema1).toMatchObject({
    properties: {
      user: {
        type: "string",
        description: expect.stringContaining(
          "Allowed value is a user alias ('client|<user-id>', or 'eth|<checksumed-eth-addr>', " +
            "or valid system-level username), or valid Ethereum address."
        )
      }
    }
  });
  expect(schema2).toMatchObject({
    properties: {
      users: {
        type: "array",
        items: {
          type: "string",
          description: expect.stringContaining(
            "Allowed value is a user alias ('client|<user-id>', or 'eth|<checksumed-eth-addr>', " +
              "or valid system-level username), or valid Ethereum address."
          )
        }
      }
    }
  });
});
