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
import { Address, beginCell } from "@ton/core";
import { getSecureRandomBytes, keyPairFromSeed } from "@ton/crypto";

import { ChainCallDTO, createValidDTO } from "../types";
import { ValidationFailedError, generateSchema } from "../utils";
import { IsValidChainAddress, isValidChainAddress } from "./IsValidChainAddress";

class TestDto extends ChainCallDTO {
  @IsValidChainAddress()
  address: string;
}

class TestArrayDto extends ChainCallDTO {
  @IsValidChainAddress({ each: true })
  addresses: string[];
}

test.each<[string, string, true | string]>([
  // Valid Ethereum addresses
  ["valid ethereum address 1", "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", true],
  ["valid ethereum address 2", "0x8ba1f109551bD432803012645Ac136ddd64DBA72", true],

  // Valid Solana addresses
  ["valid solana address 1", "11111111111111111111111111111111", true],
  ["valid solana address 2", "So11111111111111111111111111111111111111112", true],
  ["valid solana address 3", "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", true],
  // Solana addresses from bridge-requests.json (destinationChainId 1002)
  ["valid solana address (bridge) 4", "3qbmnLjwqHmNrEUkDqWupSmvXo1vQvAjxXkNr8svx9M6", true],
  ["valid solana address (bridge) 5", "EpTkHhxXAHaBh2LiaWPeobpiDGKLCcaNeujQFLeaKiBy", true],
  ["valid solana address (bridge) 6", "4nQ1EAo8M8bsjnVC8tYUTncM4WH2ZLgtCAZM2o6baxX5", true],
  ["valid solana address (bridge) 7", "4r9ezk9PjfAnNpWmCuZvaJ6jiHvyXUDxEpgsiizZAUqd", true],
  ["valid solana address (bridge) 8", "F49gbYXgQVMyBNzdm5e7sfh2UVoxGiX466kPgc1rKqbN", true],
  ["valid solana address (bridge) 9", "48t5yNSs2EUZ795p8Hc5At3VAve7sYqJqtY2Pzh4ays9", true],
  ["valid solana address (bridge) 10", "8qaCPQvxY6eNanpUemCai47mpdVVEp44UmTveNfxVQ6F", true],
  ["valid solana address (bridge) 11", "2CYz7an3J8mChq8ANwEh9F9up6EQ8WozZ1TMp9t4QcLf", true],
  ["valid solana address (bridge) 12", "88Pc8eBfcJJen2cjpjP5Wsg28qvob4PQriHttpCxvsYS", true],
  ["valid solana address (bridge) 13", "9iMH7CUpnmnHF7Uqe91PzbbXCU7gEPU9k44Qe5biUczC", true],
  ["valid solana address (bridge) 14", "2eN4NXQAqPwqi59UGyrfxob5fAqneRJQcB4dfPaAMb7o", true],
  ["valid solana address (bridge) 15", "9RW5dZo4WBEzCMJPq6XcnNHX4SEqLAxEu4rtrC76wsXs", true],
  ["valid solana address (bridge) 16", "5DBNKFBc2HTRMqraDMBiYbnMqQdCSgrfLTtmhzMr61sb", true],
  ["valid solana address (bridge) 17", "EAvpNCj3K9ZSRNSJ4PrS1SMh6uyHaQ8kS44kgoJSntvs", true],
  ["valid solana address (bridge) 18", "2CQx3P55ZvbAFiACw6p2cQuj9S4Kb83Lgg6qEKA49ZZa", true],

  // Valid TON addresses (non-bounceable mainnet format: EQ prefix only)
  // Note: UQ addresses are bounceable and should be rejected

  // Valid GalaChain addresses
  ["valid GalaChain address (client)", "client|123", true],
  ["valid GalaChain address (service)", "service|abc", true],
  ["valid GalaChain address (bridge)", "EthereumBridge", true],
  ["valid GalaChain address (chain bridge)", "GalaChainBridge-42", true]
])("%s", async (label, input) => {
  // Given
  const plain = { address: input };

  // When
  const validated = await createValidDTO(TestDto, plain);

  // Then
  expect(validated.address).toBe(input);
});

test.each<[string, string, string]>([
  // Invalid Ethereum addresses
  ["invalid ethereum (no prefix)", "742d35Cc6634C0532925a3b844Bc454e4438f44e", "valid chain address"],
  [
    "invalid ethereum (lowercase)",
    "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    "checksummed and start with '0x'"
  ],
  [
    "invalid ethereum (bad checksum)",
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44E",
    "checksummed and start with '0x'"
  ],
  [
    "invalid ethereum (wrong length)",
    "0x742d35Cc6634C0532925a3b844Bc454e4438f4",
    "checksummed and start with '0x'"
  ],

  // Invalid Solana addresses
  ["invalid solana (too short)", "1111111111111111111111111111111", "base58-encoded 32-byte"],
  ["invalid solana (too long)", "So111111111111111111111111111111111111111123", "base58-encoded 32-byte"],
  ["invalid solana (invalid chars)", "1111111111111111111111111111111O", "base58-encoded 32-byte"],

  ["invalid TON (invalid chars)", "UQD0vdSA_NedR9uvbgN9EikRX+suesDxGeFg69XQMavfLqIo", "non-bounceable"],
  ["invalid TON (wrong prefix)", "XQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIo", "valid chain address"],
  [
    "invalid TON (raw format)",
    "0:83d2f75203f4ed47dbaf6e037d1224517facb9eb03c4678583af5740c6af7cba",
    "valid chain address"
  ],

  // Invalid GalaChain addresses
  ["invalid GalaChain (empty id)", "client|", "valid user alias"],
  ["invalid GalaChain (invalid prefix)", "invalid|123", "valid user alias"],

  // Invalid format
  ["invalid format (empty string)", "", "valid chain address"],
  ["invalid format (random string)", "random-string-123", "valid chain address"],
  ["invalid format (numbers only)", "1234567890123456789012345678901234567890", "valid chain address"]
])("%s", async (label, input, expectedError) => {
  // Given
  const plain = { address: input };

  // When
  const failed = createValidDTO(TestDto, plain);

  // Then
  await expect(failed).rejects.toThrow(expectedError);
});

it("should validate array of chain addresses", async () => {
  // Given
  const validPlain = {
    addresses: [
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "11111111111111111111111111111111",
      "UQAWzEKcdnykvXfUNouqdS62tvrp32bCxuKS6eQrS6ISgZ8t",
      "client|123"
    ]
  };

  const invalidPlain = {
    addresses: [
      "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "0x742d35cc6634c0532925a3b844bc454e4438f44e",
      "11111111111111111111111111111111"
    ]
  };

  // When
  const valid = await createValidDTO(TestArrayDto, validPlain);
  const invalid = createValidDTO(TestArrayDto, invalidPlain);

  // Then
  expect(valid.addresses).toEqual(validPlain.addresses);
  await expect(invalid).rejects.toThrow("addresses property with values");
});

it("should support schema generation", () => {
  // When
  const schema1 = generateSchema(TestDto);
  const schema2 = generateSchema(TestArrayDto);

  // Then
  expect(schema1.properties?.address).toEqual(
    expect.objectContaining({
      type: "string"
    })
  );
  expect(schema2.properties?.addresses).toEqual(
    expect.objectContaining({
      type: "array"
    })
  );
});

describe("TON", () => {
  async function genKeyPair(): Promise<{ secretKey: Buffer; publicKey: Buffer }> {
    const secret = await getSecureRandomBytes(32);
    const pair = keyPairFromSeed(secret);
    return { secretKey: pair.secretKey, publicKey: pair.publicKey };
  }

  function getTonAddress(publicKey: Buffer, bounceable: boolean, testOnly: boolean): string {
    if (publicKey.length !== 32) {
      throw new ValidationFailedError(`Invalid public key length: ${publicKey.length} (32 bytes required)`);
    }

    const cell = beginCell().storeBuffer(Buffer.from(publicKey)).endCell();
    const hash = cell.hash();
    const address = new Address(0, hash);
    return address.toString({ bounceable, testOnly });
  }

  Array.from({ length: 5 }).forEach((v, i) => {
    it(`test ${i}`, async () => {
      // Given
      const { publicKey } = await genKeyPair();
      const valid = getTonAddress(publicKey, false, false);
      const invalid1 = getTonAddress(publicKey, true, false).toString();
      const invalid2 = getTonAddress(publicKey, false, true).toString();
      const invalid3 = getTonAddress(publicKey, true, true).toString();

      // When & Then
      expect([valid, isValidChainAddress(valid)]).toEqual([valid, true]);
      expect([invalid1, isValidChainAddress(invalid1)]).toEqual([invalid1, false]);
      expect([invalid2, isValidChainAddress(invalid2)]).toEqual([invalid2, false]);
      expect([invalid3, isValidChainAddress(invalid3)]).toEqual([invalid3, false]);
    });
  });
});
