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
import { Type, instanceToInstance, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsOptional, ValidationError, validate } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ValidationFailedError, deserialize, getValidationErrorInfo, serialize, signatures } from "../utils";
import { GalaChainResponse } from "./contract";

type Base<T, BaseT> = T extends BaseT ? T : never;

// `any` is specified on purpose to avoid some compilation errors when `unknown` is provided here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Inferred<T, BaseT = any> = T extends (infer U)[] ? Base<U, BaseT> : Base<T, BaseT>;

export interface ClassConstructor<T> {
  new (...args: unknown[]): T;
}

class DtoValidationFailedError extends ValidationFailedError {
  constructor({ message, details }: { message: string; details: string[] }) {
    super(message, details);
  }
}

export const validateDTO = async <T extends ChainCallDTO>(dto: T): Promise<T> => {
  const validationErrors = await dto.validate();

  if (validationErrors.length) {
    throw new DtoValidationFailedError(getValidationErrorInfo(validationErrors));
  } else {
    return dto;
  }
};

/**
 * Parses JSON string and creates a Promise with valid DTO. Throws exception in case of validation errors.
 */
export const parseValidDTO = async <T extends ChainCallDTO>(
  constructor: ClassConstructor<Inferred<T, ChainCallDTO>>,
  jsonStringOrObj: string | Record<string, unknown>
): Promise<T> => {
  const deserialized = ChainCallDTO.deserialize<T>(constructor, jsonStringOrObj);
  await validateDTO(deserialized);

  return deserialized;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

/**
 * Creates valid DTO object from provided plain object. Throws exception in case of validation errors.
 */
export const createValidDTO = async <T extends ChainCallDTO>(
  constructor: ClassConstructor<T>,
  plain: NonFunctionProperties<T>
): Promise<T> => {
  const instance = plainToInstance(constructor, plain) as T;
  await validateDTO(instance);
  return instance;
};

/**
 * Creates valid signed DTO object from provided plain object. Throws exception in case of validation errors.
 *
 * @deprecated Use `(await createValidDTO(...)).signed(...)` instead
 */
export const createAndSignValidDTO = async <T extends ChainCallDTO>(
  constructor: ClassConstructor<T>,
  plain: NonFunctionProperties<T>,
  privateKey: string
): Promise<T> => {
  const instance = plainToInstance(constructor, plain) as T;
  instance.sign(privateKey);
  await validateDTO(instance);
  return instance;
};

export interface TraceContext {
  spanId: string;
  traceId: string;
}

export class ChainCallDTO {
  public trace?: TraceContext;
  public static readonly ENCODING = "base64";

  @JSONSchema({
    description:
      "Unique key of the DTO. It is used to prevent double execution of the same transaction on chain. " +
      "The key is saved on chain and checked before execution. " +
      "If a DTO with already saved key is used in transaction, the transaction will fail with " +
      "UniqueTransactionConflict error, which is mapped to HTTP 409 Conflict error. " +
      "In case of the error, no changes are saved to chain state.\n" +
      "The key is generated by the caller and should be unique for each DTO. " +
      "You can use `nanoid` library, UUID scheme, or any tool to generate unique string keys."
  })
  @IsNotEmpty()
  @IsOptional()
  public uniqueKey?: string;

  @JSONSchema({
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
      "and cannot be used with the new signature-based authorization flow for Gala Chain.\n"
  })
  @IsOptional()
  @IsNotEmpty()
  public signature?: string;

  @JSONSchema({
    description:
      "Prefix for Metamask transaction signatures. " +
      "Necessary to format payloads correctly to recover publicKey from web3 signatures."
  })
  @IsOptional()
  @IsNotEmpty()
  public prefix?: string;

  @JSONSchema({
    description:
      "Public key of the user who signed the DTO. " +
      "Required for DER encoded signatures, since they miss recovery part."
  })
  @IsOptional()
  @IsNotEmpty()
  public signerPublicKey?: string;

  validate(): Promise<ValidationError[]> {
    return validate(this);
  }

  async validateOrReject(): Promise<void> {
    const validationErrors = await this.validate();

    if (validationErrors.length) {
      throw new DtoValidationFailedError(getValidationErrorInfo(validationErrors));
    }
  }

  serialize(): string {
    return serialize(this);
  }

  public static deserialize<T>(
    constructor: ClassConstructor<Inferred<T, ChainCallDTO>>,
    object: string | Record<string, unknown> | Record<string, unknown>[]
  ): T {
    return deserialize<T, ChainCallDTO>(constructor, object);
  }

  public sign(privateKey: string, useDer = false): void {
    const keyBuffer = signatures.normalizePrivateKey(privateKey);
    this.signature = useDer
      ? signatures.getDERSignature(this, keyBuffer)
      : signatures.getSignature(this, keyBuffer);
  }

  /**
   * Creates a signed copy of current object.
   */
  // note: previously it was typed as "typeof this", but it's failed randomly on compilation
  public signed(privateKey: string, useDer = false) {
    const copied = instanceToInstance(this);
    copied.sign(privateKey, useDer);
    return copied;
  }

  public isSignatureValid(publicKey: string): boolean {
    return signatures.isValid(this.signature ?? "", this, publicKey);
  }
}

export class GetObjectDto extends ChainCallDTO {
  @IsNotEmpty()
  public readonly objectId: string;
}

export class GetObjectHistoryDto extends ChainCallDTO {
  @IsNotEmpty()
  public readonly objectId: string;
}

export class DryRunDto extends ChainCallDTO {
  @IsNotEmpty()
  public readonly method: string;

  @IsNotEmpty()
  @IsOptional()
  @Type(() => ChainCallDTO)
  dto?: ChainCallDTO;
}

export class DryRunResultDto extends ChainCallDTO {
  public response: GalaChainResponse<unknown>;
  public writes: Record<string, Uint8Array> = {};
  public reads: Record<string, Uint8Array> = {};
  public deletes: Record<string, true> = {};
}

const publicKeyDescription =
  "A public key to be saved on chain.\n" +
  `It should be just the private part of the EC secp256k1 key, than can be retrieved this way: ` +
  "`openssl ec -in priv-key.pem -text | grep pub -A 5 | tail -n +2 | tr -d '\\n[:space:]:`. " +
  "The previous command produces an uncompressed hex string, but you can also provide an compressed one, " +
  `as well as compressed and uncompressed base64 secp256k1 key. ` +
  `A secp256k1 public key is saved on chain as compressed base64 string.`;

@JSONSchema({
  description: `Dto for secure method to save public keys for legacy users. Method is called and signed by Curators`
})
export class RegisterUserDto extends ChainCallDTO {
  @JSONSchema({
    description: `Id of user to save public key for.`
  })
  @IsNotEmpty()
  user: string;

  @JSONSchema({ description: publicKeyDescription })
  @IsNotEmpty()
  publicKey: string;
}

@JSONSchema({
  description: `Dto for secure method to save public keys for Eth users. Method is called and signed by Curators`
})
export class RegisterEthUserDto extends ChainCallDTO {
  @JSONSchema({ description: publicKeyDescription })
  @IsNotEmpty()
  publicKey: string;
}

export class UpdatePublicKeyDto extends ChainCallDTO {
  @JSONSchema({ description: publicKeyDescription })
  @IsNotEmpty()
  publicKey: string;
}

export class GetPublicKeyDto extends ChainCallDTO {
  @JSONSchema({
    description: `Id of a public key holder. Optional field, by default caller's public key is returned.`
  })
  @IsOptional()
  user?: string;
}

export class GetMyProfileDto extends ChainCallDTO {
  // make signature required
  @IsNotEmpty()
  signature: string;
}
