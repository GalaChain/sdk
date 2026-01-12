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
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
  ValidationError,
  validate
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import {
  NotImplementedError,
  ValidationFailedError,
  deserialize,
  getValidationErrorMessages,
  randomUniqueKey,
  serialize,
  signatures
} from "../utils";
import { IsUserAlias, IsUserRef, SerializeIf, StringEnumProperty } from "../validators";
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

export type SignablePromise<T extends ChainCallDTO> = Promise<T> & {
  signed(privateKey: string): SignablePromise<T>;
};

function signablePromise<T extends ChainCallDTO>(p: Promise<T>): SignablePromise<T> {
  // @ts-expect-error adding new method in runtime
  p.signed = (privateKey: string) => signablePromise(p.then((r) => r.signed(privateKey)));
  return p as SignablePromise<T>;
}

/**
 * Creates valid DTO object from provided plain object.
 * Throws exception in case of validation errors.
 */
export function createValidDTO<T extends ChainCallDTO>(
  constructor: ClassConstructor<T>,
  plain: NonFunctionProperties<T>
): SignablePromise<T> {
  const instance = plainToInstance(constructor, plain) as T;
  const response = validateDTO(instance);
  return signablePromise(response);
}

/**
 * Creates valid submit DTO object from provided plain object.
 * Throws exception in case of validation errors.
 * If the uniqueKey is not provided, it generates a random one: 32 random bytes in base64.
 */
export function createValidSubmitDTO<T extends SubmitCallDTO>(
  constructor: ClassConstructor<T>,
  plain: Omit<NonFunctionProperties<T>, "uniqueKey"> & { uniqueKey?: string }
): SignablePromise<T> {
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
      "Prefix for Metamask transaction signatures. " +
      "Necessary to format payloads correctly to recover publicKey from web3 signatures."
  })
  @IsOptional()
  @IsNotEmpty()
  public prefix?: string;

  @JSONSchema({
    description: "Address of the user who signed the DTO. Typically Ethereum address, or user alias."
  })
  @IsOptional()
  @IsNotEmpty()
  public signerAddress?: UserRef;

  @JSONSchema({
    description: "Public key of the user who signed the DTO."
  })
  @IsOptional()
  @IsNotEmpty()
  public signerPublicKey?: string;

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
      "List of signatures for this DTO if there are multiple signers. " +
      "If there are multiple signatures, 'signerAddress' is required, " +
      "and it is not allowed to provide 'signature' or 'signerPublicKey' or 'prefix' fields, " +
      "and the signing scheme must be ETH."
  })
  @IsOptional()
  @SerializeIf((o) => !o.signature)
  @ArrayMinSize(2)
  @Type(() => String)
  public multisig?: string[];

  @JSONSchema({
    description:
      "Full operation identifier that is called on chain with this DTO. " +
      "The format is `channelId_chaincodeId_methodName`. " +
      "It is required for multisig DTOs, and optional for single signed DTOs. "
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public dtoOperation?: string;

  @JSONSchema({
    description: "Unit timestamp when the DTO expires. If the timestamp is in the past, the DTO is not valid."
  })
  @IsOptional()
  @IsNumber()
  public dtoExpiresAt?: number;

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

  public getAllSignatures(): string[] {
    return this.multisig ?? (this.signature ? [this.signature] : []);
  }

  public sign(privateKey: string, useDer = false): void {
    const currentSignatures = this.getAllSignatures();
    const useMultisig = currentSignatures.length > 0;

    if (useMultisig && !this.signerAddress) {
      throw new ValidationFailedError("signerAddress is required for multisignature DTOs");
    }

    if (useMultisig && !this.dtoOperation) {
      throw new ValidationFailedError("dtoOperation is required for multisignature DTOs");
    }

    if (useMultisig && !this.dtoExpiresAt) {
      throw new ValidationFailedError("dtoExpiresAt is required for multisignature DTOs");
    }

    if (useMultisig && (this.signerPublicKey || this.prefix)) {
      throw new ValidationFailedError("signerPublicKey and prefix are not allowed for multisignature DTOs");
    }

    if (useDer) {
      if (useMultisig) {
        throw new ValidationFailedError("DER signatures are not allowed for multisignature DTOs");
      }

      // for convenience and backwards compatibility,
      // add signerPublicKey if it's not provided
      if (this.signerPublicKey === undefined && this.signerAddress === undefined) {
        this.signerPublicKey = signatures.getPublicKey(privateKey);
      }

      // DER signatures, and single-sig
      const keyBuffer = signatures.normalizePrivateKey(privateKey);
      this.signature = signatures.getDERSignature(this, keyBuffer);
      return;
    }

    // non-DER signatures, and either single-sig or multisig
    const keyBuffer = signatures.normalizePrivateKey(privateKey);
    const signature = signatures.getSignature(this, keyBuffer);

    if (useMultisig) {
      delete this.signature;
      this.multisig = [...currentSignatures, signature];
    } else {
      this.signature = signature;
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

  public expiresInMs(ms: number): this {
    const copied = instanceToInstance(this);
    copied.dtoExpiresAt = Date.now() + ms;
    return copied;
  }

  public withOperation(operation: string): this {
    const copied = instanceToInstance(this);
    copied.dtoOperation = operation;
    return copied;
  }

  public withSigner(ref: UserRef): this {
    const copied = instanceToInstance(this);
    copied.signerAddress = ref;
    return copied;
  }

  public isSignatureValid(publicKey: string): boolean {
    if (this.multisig || !this.signature) {
      throw new NotImplementedError("isSignatureValid is not supported for multisig DTOs");
    }

    return signatures.isValid(this.signature, this, publicKey);
  }
}

// It just makes uniqueKey required
export class SubmitCallDTO extends ChainCallDTO {
  @IsNotEmpty()
  public uniqueKey: string;
}

export class BatchOperationDto extends ChainCallDTO {
  @IsNotEmpty()
  method: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ChainCallDTO)
  dto: ChainCallDTO;
}

export class BatchDto extends ChainCallDTO {
  public static readonly BATCH_SIZE_LIMIT: number = 1_000;
  public static readonly WRITES_DEFAULT_LIMIT: number = 10_000;
  public static readonly WRITES_HARD_LIMIT: number = 100_000;

  @JSONSchema({
    description:
      "Soft limit of keys written to chain in a batch, excluding deletes. " +
      "If the limit is exceeded, all subsequent operations in batch fail. " +
      "Typically it is safe to repeat failed operations in the next batch. " +
      `Default: ${BatchDto.WRITES_DEFAULT_LIMIT}. ` +
      `Max: ${BatchDto.WRITES_HARD_LIMIT}.`
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(BatchDto.WRITES_HARD_LIMIT)
  @IsOptional()
  writesLimit?: number;

  @JSONSchema({
    description:
      "If true, the batch will fail if any of the operations fail. " +
      "If false, the batch will continue even if some of the operations fail. " +
      "Default: false."
  })
  @IsOptional()
  noPartialSuccess?: boolean;

  @Type(() => BatchOperationDto)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(BatchDto.BATCH_SIZE_LIMIT)
  operations: BatchOperationDto[];
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
  @IsOptional()
  @IsNotEmpty()
  public readonly callerPublicKey?: string;

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

  @JSONSchema({ description: "Public secp256k1 key (compact or non-compact, hex or base64)." })
  @ValidateIf((o) => !o.signers)
  @IsString()
  @IsNotEmpty()
  public publicKey?: string;

  @JSONSchema({ description: "Signature from the public key." })
  @IsOptional()
  @IsNotEmpty()
  @SerializeIf((o) => !!o.publicKey)
  @ValidateIf((o) => !o.signers)
  public publicKeySignature?: string;

  @JSONSchema({ description: "Signer user refs." })
  @ValidateIf((o) => !o.publicKey)
  @SerializeIf((o) => !o.publicKey)
  @IsUserRef({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  public signers?: UserRef[];

  @JSONSchema({
    description: "Minimum number of signatures required for authorization. Defaults to number of public keys."
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  signatureQuorum?: number;

  public withPublicKeySignedBy(privateKey: string): this {
    const copied = instanceToInstance(this);
    delete copied.publicKeySignature;

    copied.publicKeySignature = signatures.getSignature(copied, privateKey);
    return copied;
  }
}

export class UpdatePublicKeyDto extends SubmitCallDTO {
  @JSONSchema({
    description:
      "New public key for the user. " +
      "For users with ETH signing scheme it is public secp256k1 key (compact or non-compact, hex or base64). " +
      "For users with TON signing scheme it is public Ed25519 key (base64)."
  })
  @IsNotEmpty()
  publicKey: string;

  @JSONSchema({
    description:
      "Signature from the new public key. " +
      "The signature should be created over the same data as the main signature of this DTO, " +
      "but the `signature` and `multisig` fields should be empty. " +
      "This is to prove that the caller has access to the private key of the new public key."
  })
  @IsOptional()
  @IsNotEmpty()
  publicKeySignature?: string;

  public withPublicKeySignedBy(privateKey: string): this {
    const copied = instanceToInstance(this);
    delete copied.publicKeySignature;

    copied.publicKeySignature = signatures.getSignature(copied, privateKey);
    return copied;
  }
}

export class AddSignerDto extends SubmitCallDTO {
  @JSONSchema({
    description: "User ref of the signer to add (typically Ethereum address, or user alias)."
  })
  @IsNotEmpty()
  signer: UserRef;
}

export class RemoveSignerDto extends SubmitCallDTO {
  @JSONSchema({
    description: "User ref of the signer to remove (typically Ethereum address, or user alias)."
  })
  @IsNotEmpty()
  signer: UserRef;
}

export class UpdateSignersDto extends SubmitCallDTO {
  @JSONSchema({
    description: "Array of user refs of signers to add (typically Ethereum addresses, or user aliases)."
  })
  @IsOptional()
  @IsUserRef({ each: true })
  @IsNotEmpty({ each: true })
  toAdd?: UserRef[];

  @JSONSchema({
    description: "Array of user refs of signers to remove (typically Ethereum addresses, or user aliases)."
  })
  @IsOptional()
  @IsUserRef({ each: true })
  @IsNotEmpty({ each: true })
  toRemove?: UserRef[];
}

export class UpdateQuorumDto extends SubmitCallDTO {
  @JSONSchema({
    description: "New quorum for the user."
  })
  @IsInt()
  @Min(1)
  quorum: number;
}

export class UpdateUserRolesDto extends SubmitCallDTO {
  @IsUserRef()
  user: UserRef;

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
