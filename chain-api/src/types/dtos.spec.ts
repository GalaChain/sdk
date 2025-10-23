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
import { instanceToPlain, plainToInstance } from "class-transformer";
import { ArrayMinSize, ArrayNotEmpty, IsString } from "class-validator";
import { ec as EC } from "elliptic";

import { SigningScheme, getValidationErrorMessages, signatures } from "../utils";
import { BigNumberArrayProperty, BigNumberProperty } from "../validators";
import { ChainCallDTO, ClassConstructor } from "./dtos";

const getInstanceOrErrorInfo = async <T extends ChainCallDTO>(
  constructor: ClassConstructor<T>,
  jsonString: string
): Promise<T | string[]> => {
  try {
    const deserialized = plainToInstance(constructor, JSON.parse(jsonString)); // note: throws exception here if JSON is invalid
    const validationErrors = await deserialized.validate();
    if (validationErrors.length) {
      return getValidationErrorMessages(validationErrors);
    } else {
      return deserialized;
    }
  } catch (e) {
    return e.message;
  }
};

const getPlainOrError = async <T extends ChainCallDTO>(
  constructor: ClassConstructor<T>,
  jsonString: string
): Promise<Record<string, unknown> | string> => {
  const instance = await getInstanceOrErrorInfo(constructor, jsonString);
  return typeof instance === "string" ? instance : instanceToPlain(instance);
};

class TestDtoWithArray extends ChainCallDTO {
  @IsString({ each: true })
  @ArrayMinSize(1)
  playerIds: Array<string>;
}

class TestDtoWithBigNumber extends ChainCallDTO {
  @BigNumberProperty()
  quantity: BigNumber;
}

it("should parse TestDtoWithArray", async () => {
  const valid = '{"playerIds":["123"]}';
  const invalid1 = '{"playerIds":[]}';
  const invalid2 = '{"playerId":"aaa"}';
  const invalid3 = '{"invalid":"json';

  const failedArrayMatcher = expect.arrayContaining([
    "arrayMinSize: playerIds must contain at least 1 elements"
  ]);

  expect(await getPlainOrError(TestDtoWithArray, valid)).toEqual({ playerIds: ["123"] });
  expect(await getPlainOrError(TestDtoWithArray, invalid1)).toEqual(failedArrayMatcher);
  expect(await getPlainOrError(TestDtoWithArray, invalid2)).toEqual(failedArrayMatcher);
  const error = await getPlainOrError(TestDtoWithArray, invalid3);
  expect(error).toMatch(/JSON/);
});

it("should parse TestDtoWithBigNumber", async () => {
  const valid = '{"quantity":"123"}';
  const invalid1 = '{"quantity":123}';
  const invalid2 = '{"quantity":"123.10"}';
  const invalid3 = '{"quantity":"1.23e+5"}';
  const invalid4 = '{"quantity":"aaa"}';

  const expectedErrorPart =
    "should be a stringified number with fixed notation (not an exponential notation) " +
    "and no trailing zeros in decimal part";

  expect(await getInstanceOrErrorInfo(TestDtoWithBigNumber, valid)).toEqual({ quantity: new BigNumber(123) });

  expect(await getInstanceOrErrorInfo(TestDtoWithBigNumber, invalid1)).toEqual([
    expect.stringContaining(`${expectedErrorPart} (valid value: 123)`)
  ]);

  expect(await getInstanceOrErrorInfo(TestDtoWithBigNumber, invalid2)).toEqual([
    expect.stringContaining(`${expectedErrorPart} (valid value: 123.1)`)
  ]);

  expect(await getInstanceOrErrorInfo(TestDtoWithBigNumber, invalid3)).toEqual([
    expect.stringContaining(`${expectedErrorPart} (valid value: 123000)`)
  ]);

  expect(await getInstanceOrErrorInfo(TestDtoWithBigNumber, invalid4)).toEqual([
    expect.stringContaining(expectedErrorPart)
  ]);
});

describe("ChainCallDTO", () => {
  class TestDto extends ChainCallDTO {
    @BigNumberArrayProperty()
    @ArrayNotEmpty()
    amounts: Array<BigNumber>;

    key?: string;
  }

  function genKeyPair() {
    const pair = new EC("secp256k1").genKeyPair();
    return {
      privateKey: pair.getPrivate().toString("hex"),
      publicKey: Buffer.from(pair.getPublic().encode("array", true)).toString("hex")
    };
  }

  it("should sign and verify signature", () => {
    // Given
    const { privateKey, publicKey } = genKeyPair();
    const dto = new TestDto();
    dto.amounts = [new BigNumber("12.3")];
    expect(dto.signature).toEqual(undefined);

    // When
    dto.sign(privateKey);

    // Then
    expect(dto.signature).toEqual(expect.stringMatching(/.{50,}/));
    expect(dto.isSignatureValid(publicKey)).toEqual(true);
  });

  it("should sign and verify signature (edge case - shorter private key with missing trailing 0)", () => {
    // Given
    const privateKey = "e8d506db1e7c8d98dbc6752537939312702962f48e169084a7babbb5c96217f";
    const publicKey = "0365bc56f0a623867746cbb025a74c295b5f794cf7c4adc11991bad1522912e5f6";
    expect(privateKey.length).toEqual(63); // shorter than regular 64 one

    const dto = new TestDto();
    dto.amounts = [new BigNumber("12.3")];
    expect(dto.signature).toEqual(undefined);

    // When
    dto.sign(privateKey);

    // Then
    expect(dto.signature).toEqual(expect.stringMatching(/.{50,}/));
    expect(dto.isSignatureValid(publicKey)).toEqual(true);
  });

  it("should sign and fail to verify signature (invalid key)", () => {
    // Given
    const { privateKey } = genKeyPair();
    const invalid = genKeyPair();
    const dto = new TestDto();
    dto.amounts = [new BigNumber("12.3")];

    // When
    dto.sign(privateKey);

    // Then
    expect(dto.isSignatureValid(invalid.publicKey)).toEqual(false);
  });

  it("should sign and fail to verify signature (invalid payload)", () => {
    // Given
    const { privateKey, publicKey } = genKeyPair();
    const dto = new TestDto();
    dto.amounts = [new BigNumber("12.3")];

    // When
    dto.sign(privateKey);
    dto.key = "i-will-break-this";

    // Then
    expect(dto.isSignatureValid(publicKey)).toEqual(false);
  });

  it("should sign and verify TON signature", async () => {
    // Given
    const pair = await signatures.ton.genKeyPair();
    const dto = new TestDto();
    dto.amounts = [new BigNumber("78.9")];
    dto.signing = SigningScheme.TON;
    expect(dto.signature).toEqual(undefined);

    // When
    dto.sign(pair.secretKey.toString("base64"));

    // Then
    expect(dto.signature).toEqual(expect.stringMatching(/.{50,}/));
    expect(dto.isSignatureValid(pair.publicKey.toString("base64"))).toEqual(true);
  });

  it("should sign and verify multiple signatures", () => {
    // Given
    const k1 = genKeyPair();
    const k2 = genKeyPair();
    const dto = new TestDto();
    dto.amounts = [new BigNumber("12.3")];

    // When
    dto.sign(k1.privateKey);
    dto.sign(k2.privateKey);

    // Then
    expect(dto.signature).toEqual(undefined);
    expect(dto.multisig).toEqual([expect.stringMatching(/.{50,}/), expect.stringMatching(/.{50,}/)]);

    // valid cases
    expect(dto.isSignatureValid(k1.publicKey, 0)).toEqual(true);
    expect(dto.isSignatureValid(k2.publicKey, 1)).toEqual(true);

    expect(dto.isSignatureValid(k2.publicKey, 0)).toEqual(false);
    expect(dto.isSignatureValid(k1.publicKey, 1)).toEqual(false);

    expect(() => dto.isSignatureValid(k1.publicKey)).toThrow("Index is required for multisig DTOs");
    expect(() => dto.isSignatureValid(k1.publicKey, 2)).toThrow("No signature in multisig array at index 2");
  });

  it("should throw an error when signing a multisig DTO with signerAddress, signerPublicKey, or prefix", () => {
    // Given
    const { privateKey } = genKeyPair();
    const dto = new TestDto();
    dto.amounts = [new BigNumber("12.3")];
    dto.sign(privateKey); // first signature

    // When
    dto.signerAddress = "0x123";
    dto.signerPublicKey = "0x456";
    dto.prefix = "test-prefix";

    // Then
    const expectedError = "signerAddress, signerPublicKey and prefix are not allowed for multisignature DTOs";
    expect(() => dto.sign(privateKey)).toThrow(expectedError);
  });
});
