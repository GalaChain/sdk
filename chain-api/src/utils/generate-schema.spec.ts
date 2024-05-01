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
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsNotEmpty, IsOptional, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainCallDTO } from "../types";
import { BigNumberIsPositive } from "../validators";
import { generateResponseSchema, generateSchema } from "./generate-schema";
import { BigNumberProperty, EnumProperty } from "./transform-decorators";

enum YesNoEnum {
  Yes,
  No
}

class TestCategory {
  @IsNotEmpty()
  name: string;
}

@JSONSchema({ description: "Nested test class." })
export class NestedTestClass {
  @IsNotEmpty()
  public collection: string;

  @JSONSchema({ description: "Test category" })
  @ValidateNested({ each: true })
  @Type(() => TestCategory)
  public categories: TestCategory[];
}

@JSONSchema({ description: "Some test DTO class" })
class TestDto extends ChainCallDTO {
  @JSONSchema({ description: "First part of the description." })
  @ValidateNested()
  @Type(() => NestedTestClass)
  nestedClass: NestedTestClass;

  @JSONSchema({ description: "Quantity used in some place to support some feature." })
  @BigNumberProperty()
  @BigNumberIsPositive()
  @IsOptional()
  quantity?: BigNumber;

  @Type(() => BigNumber)
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  quantities: BigNumber[];

  @EnumProperty(YesNoEnum)
  amITestClass: YesNoEnum;
}

const expectedNestedTestClassSchema = {
  properties: {
    collection: { minLength: 1, type: "string" },
    categories: {
      items: {
        properties: { name: { minLength: 1, type: "string" } },
        type: "object",
        required: ["name"]
      },
      type: "array",
      description: "Test category"
    }
  },
  type: "object",
  required: ["collection", "categories"],
  description: "Nested test class."
};

const expectedTestDtoSchema = {
  description: "Some test DTO class",
  properties: {
    nestedClass: {
      ...expectedNestedTestClassSchema,
      description: `First part of the description. ${expectedNestedTestClassSchema.description}`
    },
    quantity: {
      description: "Quantity used in some place to support some feature. Number provided as a string.",
      type: "string"
    },
    signature: {
      description:
        "Signature of the DTO signed with caller's private key to be verified with user's public key saved on chain. " +
        "The 'signature' field is optional for DTO, but is required for a transaction to be executed on chain.\n" +
        "JSON payload to be signed is created from an object without 'signature' and 'trace` properties, " +
        "and it's keys should be sorted alphabetically and no end of line at the end. " +
        'Sample jq command to produce valid data to sign: `jq -cSj "." dto-file.json`.' +
        "Also all BigNumber data should be provided as strings (not numbers) with fixed decimal point notation.\n" +
        "The EC secp256k1 signature should be created for keccak256 hash of the data. " +
        "The recommended format of the signature is a HEX encoded string, including r + s + v values. " +
        "Signature in this format is supported by ethers.js library. " +
        "Sample signature: b7244d62671319583ea8f30c8ef3b343cf28e7b7bd56e32b21a5920752dc95b94a9d202b2919581bcf776f0637462cb67170828ddbcc1ea63505f6a211f9ac5b1b\n" +
        "This field can also contain a DER encoded signature, but this is deprecated and supported only to provide backwards compatibility. " +
        "DER encoded signature cannot be used recover user's public key from the signature, " +
        "and cannot be used with the new signature-based authorization flow for Gala Chain.\n",
      minLength: 1,
      type: "string"
    },
    signerPublicKey: {
      description:
        "Public key of the user who signed the DTO. Required for DER encoded signatures, since they miss recovery part.",
      minLength: 1,
      type: "string"
    },
    uniqueKey: {
      description:
        "Unique key of the DTO. It is used to prevent double execution of the same transaction on chain. " +
        "The key is saved on chain and checked before execution. " +
        "If a DTO with already saved key is used in transaction, the transaction will fail with " +
        "UniqueTransactionConflict error, which is mapped to HTTP 409 Conflict error. " +
        "In case of the error, no changes are saved to chain state.\n" +
        "The key is generated by the caller and should be unique for each DTO. " +
        "You can use `nanoid` library, UUID scheme, or any tool to generate unique string keys.",
      minLength: 1,
      type: "string"
    },
    prefix: {
      description:
        "Prefix for Metamask transaction signatures. Necessary to format payloads correctly to recover publicKey from web3 signatures.",
      minLength: 1,
      type: "string"
    },
    quantities: {
      items: {
        description: "Number provided as a string.",
        type: "string"
      },
      minItems: 1,
      type: "array"
    },
    amITestClass: {
      description: "0 - Yes, 1 - No",
      enum: [0, 1],
      type: "number"
    }
  },
  type: "object",
  required: ["nestedClass", "quantities", "amITestClass"]
};

const expectedTestDtoResponseSchema = {
  properties: {
    Data: expectedTestDtoSchema,
    Message: {
      type: "string"
    },
    Status: {
      description: "Indicates Error (0) or Success (1)",
      enum: [0, 1]
    }
  },
  required: ["Status"],
  type: "object"
};

it("should generateSchema of NestedTestClass", async () => {
  expect(generateSchema(NestedTestClass)).toEqual(expectedNestedTestClassSchema);
});

it("should generateSchema of TestDto", async () => {
  expect(generateSchema(TestDto)).toEqual(expectedTestDtoSchema);
});

it("should generateResponseSchema of TestDto", async () => {
  expect(generateResponseSchema(TestDto)).toEqual(expectedTestDtoResponseSchema);
});
