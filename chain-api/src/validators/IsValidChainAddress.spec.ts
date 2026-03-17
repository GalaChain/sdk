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
import { IsValidChainAddress, isValidChainAddress } from "./IsValidChainAddress";

class TestDto extends ChainCallDTO {
  @IsValidChainAddress()
  address: string;
}

class TestArrayDto extends ChainCallDTO {
  @IsValidChainAddress({ each: true })
  addresses: string[];
}

describe("GalaChain", () => {
  const DEFAULT_ERROR = "Expected a valid chain address";

  test.each<[string, string]>([
    ["valid GalaChain address (client)", "client|123"],
    ["valid GalaChain address (service)", "service|abc"],
    ["valid GalaChain address (bridge)", "EthereumBridge"],
    ["valid GalaChain address (chain bridge)", "GalaChainBridge-42"]
  ])("%s", async (label, input) => {
    // Given
    const plain = { address: input };

    // When
    const validated = await createValidDTO(TestDto, plain);

    // Then
    expect(validated.address).toBe(input);
  });

  test.each<[string, string, string]>([
    ["invalid GalaChain (empty id)", "client|", DEFAULT_ERROR],
    ["invalid GalaChain (invalid prefix)", "invalid|123", DEFAULT_ERROR]
  ])("%s", async (label, input, expectedError) => {
    // Given
    const plain = { address: input };

    // When
    const failed = createValidDTO(TestDto, plain);

    // Then
    await expect(failed).rejects.toThrow(expectedError);
  });
});

describe("Ethereum", () => {
  const DEFAULT_ERROR = "Ethereum address must be checksummed and start with '0x' prefix.";
  const DEFAULT_INVALID_ERROR = "Expected a valid chain address";

  test.each<[string, string]>([
    ["valid ethereum address 1", "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"],
    ["valid ethereum address 2", "0x8ba1f109551bD432803012645Ac136ddd64DBA72"]
  ])("%s", async (label, input) => {
    // Given
    const plain = { address: input };

    // When
    const validated = await createValidDTO(TestDto, plain);

    // Then
    expect(validated.address).toBe(input);
  });

  test.each<[string, string, string]>([
    ["invalid ethereum (no prefix)", "742d35Cc6634C0532925a3b844Bc454e4438f44e", DEFAULT_INVALID_ERROR],
    ["invalid ethereum (lowercase)", "0x742d35cc6634c0532925a3b844bc454e4438f44e", DEFAULT_ERROR],
    ["invalid ethereum (bad checksum)", "0x742d35Cc6634C0532925a3b844Bc454e4438f44E", DEFAULT_ERROR],
    ["invalid ethereum (wrong length)", "0x742d35Cc6634C0532925a3b844Bc454e4438f4", DEFAULT_ERROR]
  ])("%s", async (label, input, expectedError) => {
    // Given
    const plain = { address: input };

    // When
    const failed = createValidDTO(TestDto, plain);

    // Then
    await expect(failed).rejects.toThrow(expectedError);
  });
});

describe("Solana", () => {
  const DEFAULT_ERROR = "Solana address must be a valid base58-encoded 32-byte public key.";
  const DEFAULT_INVALID_ERROR = "Expected a valid chain address";

  test.each<[string, string]>([
    ["valid solana address 1", "11111111111111111111111111111111"],
    ["valid solana address 2", "So11111111111111111111111111111111111111112"],
    ["valid solana address 4", "3qbmnLjwqHmNrEUkDqWupSmvXo1vQvAjxXkNr8svx9M6"],
    ["valid solana address 5", "EpTkHhxXAHaBh2LiaWPeobpiDGKLCcaNeujQFLeaKiBy"],
    ["valid solana address 6", "4nQ1EAo8M8bsjnVC8tYUTncM4WH2ZLgtCAZM2o6baxX5"]
  ])("%s", async (label, input) => {
    // Given
    const plain = { address: input };

    // When
    const validated = await createValidDTO(TestDto, plain);

    // Then
    expect(validated.address).toBe(input);
  });

  test.each<[string, string, string]>([
    ["invalid solana (too short)", "1111111111111111111111111111111", DEFAULT_INVALID_ERROR],
    ["invalid solana (too long)", "So111111111111111111111111111111111111111123", DEFAULT_ERROR],
    ["invalid solana (invalid chars)", "1111111111111111111111111111111O", DEFAULT_INVALID_ERROR]
  ])("%s", async (label, input, expectedError) => {
    // Given
    const plain = { address: input };

    // When
    const failed = createValidDTO(TestDto, plain);

    // Then
    await expect(failed).rejects.toThrow(expectedError);
  });
});

describe("TON", () => {
  const DEFAULT_ERROR = "Expected a valid chain address";
  const DEFAULT_NON_BOUNCEABLE_ERROR = "TON address must be non-bounceable and not test-only (UQ... format).";

  test.each<[string, string, string]>([
    [
      "invalid TON (invalid chars)",
      "UQD0vdSA_NedR9uvbgN9EikRX+suesDxGeFg69XQMavfLqIo",
      DEFAULT_NON_BOUNCEABLE_ERROR
    ],
    ["invalid TON (wrong prefix)", "XQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIo", DEFAULT_ERROR],
    [
      "invalid TON (raw format)",
      "0:83d2f75203f4ed47dbaf6e037d1224517facb9eb03c4678583af5740c6af7cba",
      DEFAULT_NON_BOUNCEABLE_ERROR
    ]
  ])("%s", async (label, input, expectedError) => {
    // Given
    const plain = { address: input };

    // When
    const failed = createValidDTO(TestDto, plain);

    // Then
    await expect(failed).rejects.toThrow(expectedError);
  });

  // samples were generated by @ton/crypto and @ton/core
  // they are hardcoded here to avoid TON dependencies in the project
  const generatedTonSamples = [
    {
      valid: "UQCujECl4bNjsAjK4I62az-rqNde5citayQkU80YACWzFzQx",
      bounceable: "EQCujECl4bNjsAjK4I62az-rqNde5citayQkU80YACWzF2n0",
      testOnly: "0QCujECl4bNjsAjK4I62az-rqNde5citayQkU80YACWzF4-7",
      both: "kQCujECl4bNjsAjK4I62az-rqNde5citayQkU80YACWzF9J-"
    },
    {
      valid: "UQAvVZf96T4XVIXA4RbJojaynSXB4ioF-gyQgkYizIj3xS-Y",
      bounceable: "EQAvVZf96T4XVIXA4RbJojaynSXB4ioF-gyQgkYizIj3xXJd",
      testOnly: "0QAvVZf96T4XVIXA4RbJojaynSXB4ioF-gyQgkYizIj3xZQS",
      both: "kQAvVZf96T4XVIXA4RbJojaynSXB4ioF-gyQgkYizIj3xcnX"
    },
    {
      valid: "UQA2OFhqBfixAfElUYkkluukh-jh_wieiufEnI_kR7AGqwA3",
      bounceable: "EQA2OFhqBfixAfElUYkkluukh-jh_wieiufEnI_kR7AGq13y",
      testOnly: "0QA2OFhqBfixAfElUYkkluukh-jh_wieiufEnI_kR7AGq7u9",
      both: "kQA2OFhqBfixAfElUYkkluukh-jh_wieiufEnI_kR7AGq-Z4"
    },
    {
      valid: "UQCyyB-aSBm_YQUVW2D3TK117lny-pluapYNOP8cem6lk4E7",
      bounceable: "EQCyyB-aSBm_YQUVW2D3TK117lny-pluapYNOP8cem6lk9z-",
      testOnly: "0QCyyB-aSBm_YQUVW2D3TK117lny-pluapYNOP8cem6lkzqx",
      both: "kQCyyB-aSBm_YQUVW2D3TK117lny-pluapYNOP8cem6lk2d0"
    },
    {
      valid: "UQARWpTD8YKEmIEv886mQHhC-i34vey0eC8Em4ot3YIltsH_",
      bounceable: "EQARWpTD8YKEmIEv886mQHhC-i34vey0eC8Em4ot3YIltpw6",
      testOnly: "0QARWpTD8YKEmIEv886mQHhC-i34vey0eC8Em4ot3YIltnp1",
      both: "kQARWpTD8YKEmIEv886mQHhC-i34vey0eC8Em4ot3YIltiew"
    }
  ];

  generatedTonSamples.forEach((v, i) => {
    it(`generated TON address ${i}`, async () => {
      expect([v.valid, isValidChainAddress(v.valid)]).toEqual([v.valid, true]);
      expect([v.bounceable, isValidChainAddress(v.bounceable)]).toEqual([v.bounceable, false]);
      expect([v.testOnly, isValidChainAddress(v.testOnly)]).toEqual([v.testOnly, false]);
      expect([v.both, isValidChainAddress(v.both)]).toEqual([v.both, false]);
    });
  });
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
