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
import crypto from "crypto";

import {
  SigningScheme,
  ValidationFailedError,
  deserialize,
  getValidationErrorMessages,
  serialize,
  signatures
} from "../utils";
import { IsUserAlias, IsUserRef, StringEnumProperty } from "../validators";
import { UserAlias } from "./UserAlias";
import { UserRef } from "./UserRef";
import { GalaChainResponse } from "./contract";

type Base<T, BaseT> = T extends BaseT ? T : never;

// `any` is specified on purpose to avoid some compilation errors when `unknown` is provided here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Inferred<T, BaseT = any> = T extends (infer U)[] ? Base<U, BaseT> : Base<T, BaseT>;

export interface ClassConstructor<T> {
  new (...args: unknown[]): T;
}

class DtoValidationFailedError extends ValidationFailedError {
  constructor(errors: ValidationError[]) {
    const messages = getValidationErrorMessages(errors);
    const messagesString = messages.map((s, i) => `(${i + 1}) ${s}`).join(", ");
    super(`DTO validation failed: ${messagesString}`, messages);
  }
}

export const validateDTO = async <T extends ChainCallDTO>(dto: T): Promise<T> => {
  const validationErrors = await dto.validate();

  if (validationErrors.length) {
    throw new DtoValidationFailedError(validationErrors);
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

export function randomUniqueKey(): string {
  return crypto.randomBytes(32).toString("base64");
}

/**
 * Creates valid DTO object from provided plain object.
 * Throws exception in case of validation errors.
 */
export function createValidDTO<T extends ChainCallDTO>(
  constructor: ClassConstructor<T>,
  plain: NonFunctionProperties<T>
): Promise<T> & { signed(privateKey: string): Promise<T> } {
  const instance = plainToInstance(constructor, plain) as T;
  const response = validateDTO(instance);

  // @ts-expect-error adding new method in runtime
  response.signed = (k: string) => response.then((r) => r.signed(k));

  return response as Promise<T> & { signed(privateKey: string): Promise<T> };
}

/**
 * Creates valid submit DTO object from provided plain object.
 * Throws exception in case of validation errors.
 * If the uniqueKey is not provided, it generates a random one: 32 random bytes in base64.
 */
export function createValidSubmitDTO<T extends SubmitCallDTO>(
  constructor: ClassConstructor<T>,
  plain: Omit<NonFunctionProperties<T>, "uniqueKey"> & { uniqueKey?: string }
): Promise<T> & { signed(privateKey: string): Promise<T> } {
  return createValidDTO<T>(constructor, {
    ...plain,
    uniqueKey: plain?.uniqueKey ?? randomUniqueKey()
  } as unknown as NonFunctionProperties<T>);
}

/**
 * @description
 *
 * The base DTO (Data Transfer Object) class. Provides common properties and
 * methods for signing, uniqueness, validation, and serialization. All other DTOs in the
 * SDK extend from this base class. To implement custom a custom DTO, create a new class that
 * extends `ChainCallDTO`, and use the `class-validator` npm package to decorate
 * the properties of the new class.
 *
 * @remarks
 *
 * Additional details for specific properties of this class
 * are generated via the `class-validator-jsonschema` npm module and can either
 *  be viewed in the source code
 * or in the OpenAPI documentation served alongside GalaChain's API endpoints.
 */
export class ChainCallDTO {
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
      "The 'signature' field is optional for DTO, but is required for a transaction to be executed on chain. \n" +
      "Please consult [GalaChain SDK documentation](https://github.com/GalaChain/sdk/blob/main/docs/authorization.md#signature-based-authorization) on how to create signatures."
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
    description: "Address of the user who signed the DTO. Typically Ethereum or TON address."
  })
  @IsOptional()
  @IsNotEmpty()
  public signerAddress?: string;

  @JSONSchema({
    description: "Public key of the user who signed the DTO."
  })
  @IsOptional()
  @IsNotEmpty()
  public signerPublicKey?: string;

  @JSONSchema({
    description:
      `Signing scheme used for the signature. ` +
      `"${SigningScheme.ETH}" for Ethereum, and "${SigningScheme.TON}" for The Open Network are supported. ` +
      `Default: "${SigningScheme.ETH}".`
  })
  @IsOptional()
  @StringEnumProperty(SigningScheme)
  public signing?: SigningScheme;

  validate(): Promise<ValidationError[]> {
    return validate(this);
  }

  async validateOrReject(): Promise<void> {
    const validationErrors = await this.validate();

    if (validationErrors.length) {
      throw new DtoValidationFailedError(validationErrors);
    }
  }

  /**
   * @description
   *
   * Serialze this object to string in a determinsitic fashion.
   * See Hyperledger Fabric's documentation on
   * [JSON Determinism](https://hyperledger-fabric.readthedocs.io/en/release-2.5/chaincode4ade.html#json-determinism)
   * for more details.
   *
   * @returns string
   */
  serialize(): string {
    return serialize(this);
  }

  /**
   * @description
   *
   * Instantiate a class instance from a serialized object using the provided `ClassConstructor`.
   *
   * @param constructor
   *
   * `ClassConstructor` that extends `ChainCallDTO`
   *
   * @param object
   *
   * serialized string or plain object to be instantiated via the provided `ClassConstructor`
   *
   * @returns
   *
   * An instantiated class created with the provided `ClassConstructor`
   */
  public static deserialize<T>(
    constructor: ClassConstructor<Inferred<T, ChainCallDTO>>,
    object: string | Record<string, unknown> | Record<string, unknown>[]
  ): T {
    return deserialize<T, ChainCallDTO>(constructor, object);
  }

  public sign(privateKey: string, useDer = false): void {
    if (this.signing === SigningScheme.TON) {
      const keyBuffer = Buffer.from(privateKey, "base64");
      this.signature = signatures.ton.getSignature(this, keyBuffer, this.prefix).toString("base64");
    } else {
      const keyBuffer = signatures.normalizePrivateKey(privateKey);
      this.signature = useDer
        ? signatures.getDERSignature(this, keyBuffer)
        : signatures.getSignature(this, keyBuffer);
    }
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
    if (this.signing === SigningScheme.TON) {
      const signatureBuff = Buffer.from(this.signature ?? "", "base64");
      const publicKeyBuff = Buffer.from(publicKey, "base64");
      return signatures.ton.isValidSignature(signatureBuff, this, publicKeyBuff, this.prefix);
    } else {
      return signatures.isValid(this.signature ?? "", this, publicKey);
    }
  }
}

// It just makes uniqueKey required
export class SubmitCallDTO extends ChainCallDTO {
  @IsNotEmpty()
  public uniqueKey: string;
}

/**
 * @description
 *
 * Input for the `GetObjectByKey` chaincode method defined on the GalaContract class.
 */
export class GetObjectDto extends ChainCallDTO {
  @IsNotEmpty()
  public readonly objectId: string;
}

/**
 * @description
 *
 * Input for the `GetObjectByHistory` chaincode method defined on the GalaContract class.
 */
export class GetObjectHistoryDto extends ChainCallDTO {
  @IsNotEmpty()
  public readonly objectId: string;
}

/**
 * @description
 *
 * Input for the `DryRun` chaincode method defined on the GalaContract class.
 * Use a `DryRunDto` and the `DryRun` chaincode method to simulate the
 * execution of a chaincode contract method. The results of the `DryRun`
 * will not be written chain. Instead, the Read/Write set that would have resulted from
 * the transaction will be returned to the consuming client for analysis.
 *
 * @remarks
 *
 * Authorization is not checked for `DryRun` execution. This allows application,
 * administrative, game server identities etc. to simulate a transaction result
 * without prompting the end user to sign the input first. This helps avoid
 * replay attacks (as the unique id would not be written to chain in a DryRun)
 * and also allows applications to present certain outcomes to the end user
 * before they decide to sign and authorize the transaction.
 *
 * Example use case: Executing a `DryRun` on a given method, and then processing
 * the results for `FeeChannelPaymentReceipt` or `FeeUserPaymentReceipt` objects
 * can yield the exepcted/estimated fee prior to executing a transaction. The
 * estimated fee can then be presented to an end user for them to decide whether
 * or not they want to authorize the transaction.
 */
export class DryRunDto extends ChainCallDTO {
  /**
   * @description
   *
   * The contract method intended for `DryRun` execution.
   *
   * @example
   *
   * "TransferToken"
   */
  @IsNotEmpty()
  public readonly method: string;

  /**
   * @description
   *
   * The identity used for the transaction simulation.
   */
  @IsNotEmpty()
  public readonly callerPublicKey: string;

  /**
   * @description
   *
   * A input to be used for the `DryRun` execution. For example, if the
   * method to be `DryRun` is `TransferToken`, then a `TransferTokenDto` should
   * be provided here.
   */
  @IsNotEmpty()
  @IsOptional()
  @Type(() => ChainCallDTO)
  dto?: ChainCallDTO;
}

/**
 * @description
 *
 * Data Transfer Object (DTO) representing the  results of a successful `DryRun` execution,
 * to be sent back to the  consuming client.
 */
export class DryRunResultDto extends ChainCallDTO {
  /**
   * @description
   *
   * The `GalaChainResponse` that would have occurred if the provided inputs had been
   * sent to the provided method, with a valid signature.
   */
  public response: GalaChainResponse<unknown>;
  /**
   * @description
   *
   * The `writes` from the Hyperledger Fabric Read/Write set that would have been
   * written to chain, if the provided inputs had been sent to the provided method
   * with a valid signature. See the Hyperledger Fabric documentation on
   * [Valid Transactions](https://hyperledger-fabric.readthedocs.io/en/release-2.5/smartcontract/smartcontract.html#valid-transactions)
   * for more details on the importantce of Read/Write sets.
   */
  public writes: Record<string, string>;
  /**
   * @description
   *
   * The `reads` from the Hyperledger Fabric Read/Write set that would have been
   * read from world state, if the provided inputs had been sent to the provided method
   * with a valid signature. See the Hyperledger Fabric documentation on
   * [Valid Transactions](https://hyperledger-fabric.readthedocs.io/en/release-2.5/smartcontract/smartcontract.html#valid-transactions)
   * for more details on the importantce of Read/Write sets.
   */
  public reads: Record<string, string>;
  /**
   * @description
   *
   * The `deletes` from the Read/Write set that would have been deleted from
   * world state, if the provided inputs had been sent to the provided method with a
   * valid signature. See the Hyperledger Fabric documentation on
   * [Valid Transactions](https://hyperledger-fabric.readthedocs.io/en/release-2.5/smartcontract/smartcontract.html#valid-transactions)
   * for more details on the importantce of Read/Write sets.
   */
  public deletes: Record<string, true>;
}

/**
 * @description
 *
 * Dto for secure method to save public keys for legacy users.
 * Method is called and signed by Curators
 */
@JSONSchema({
  description: `Dto for secure method to save public keys for legacy users. Method is called and signed by Curators`
})
export class RegisterUserDto extends SubmitCallDTO {
  /**
   * @description
   *
   * Id of user to save public key for.
   * Must be a valid user alias. See also @IsUserAlias().
   */
  @JSONSchema({
    description: `Id of user to save public key for.`
  })
  @IsUserAlias()
  user: UserAlias;

  /**
   * @description Public secp256k1 key (compact or non-compact, hex or base64).
   */
  @JSONSchema({ description: "Public secp256k1 key (compact or non-compact, hex or base64)." })
  @IsNotEmpty()
  publicKey: string;
}

/**
 * @description
 *
 * Dto for secure method to save public keys for Eth users.
 * Method is called and signed by Curators
 */
@JSONSchema({
  description: `Dto for secure method to save public keys for Eth users. Method is called and signed by Curators`
})
export class RegisterEthUserDto extends SubmitCallDTO {
  @JSONSchema({ description: "Public secp256k1 key (compact or non-compact, hex or base64)." })
  @IsNotEmpty()
  publicKey: string;
}

/**
 * @description
 *
 * Dto for secure method to save public keys for TON users.
 * Method is called and signed by Curators
 */
@JSONSchema({
  description: `Dto for secure method to save public keys for TON users. Method is called and signed by Curators`
})
export class RegisterTonUserDto extends SubmitCallDTO {
  @JSONSchema({ description: "TON user public key (Ed25519 in base64)." })
  @IsNotEmpty()
  publicKey: string;
}

export class UpdatePublicKeyDto extends SubmitCallDTO {
  @JSONSchema({
    description:
      "For users with ETH signing scheme it is public secp256k1 key (compact or non-compact, hex or base64). " +
      "For users with TON signing scheme it is public Ed25519 key (base64)."
  })
  @IsNotEmpty()
  publicKey: string;
}

export class UpdateUserRolesDto extends SubmitCallDTO {
  @IsUserAlias()
  user: string;

  @JSONSchema({ description: "New set of roles for the user that will replace the old ones." })
  @IsNotEmpty()
  roles: string[];
}

export class GetPublicKeyDto extends ChainCallDTO {
  @JSONSchema({
    description: `Id of a public key holder. Optional field, by default caller's public key is returned.`
  })
  @IsOptional()
  @IsUserRef()
  user?: UserRef;
}

export class GetMyProfileDto extends ChainCallDTO {
  // make signature required
  @IsNotEmpty()
  signature: string;
}
