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
import {
  ChainCallDTO,
  ChainError,
  ClassConstructor,
  GalaChainResponse,
  Inferred,
  MethodAPI,
  NotImplementedError,
  Primitive,
  RuntimeError,
  SubmitCallDTO,
  UserRole,
  generateResponseSchema,
  generateSchema,
  parseValidDTO
} from "@gala-chain/api";
import { Object as DTOObject, Transaction } from "fabric-contract-api";
import { inspect } from "util";

import { UniqueTransactionService } from "../services";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { updateApi } from "./GalaContractApi";
import { authenticate } from "./authenticate";
import { authorize } from "./authorize";

// All DTOs need to be registered in the application, including super classes. Otherwise, chaincode
// containers will fail to start. Below we register just some base classes. Actual DTO classes are
// registered inside decorator factory.
//
DTOObject()(ChainCallDTO);
DTOObject()(SubmitCallDTO);

// Note: it is just a metadata, you cannot effectively forbid to submit the transaction
// (you can, however make it readonly by passing random value to the result or manipulating the context)
export enum GalaTransactionType {
  EVALUATE,
  SUBMIT
}

const { SUBMIT, EVALUATE } = GalaTransactionType;

type GalaTransactionDecoratorFunction = (
  target: GalaContract,
  propertyKey: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  descriptor: TypedPropertyDescriptor<Function>
) => void;

type OutType = ClassConstructor<unknown> | Primitive;
type OutArrType = { arrayOf: OutType };

export type GalaTransactionBeforeFn = (ctx: GalaChainContext, dto: ChainCallDTO) => Promise<void>;

export type GalaTransactionAfterFn = (
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  result: GalaChainResponse<unknown>
) => Promise<unknown>;

export interface CommonTransactionOptions<T extends ChainCallDTO> {
  deprecated?: true;
  description?: string;
  in?: ClassConstructor<Inferred<T>>;
  out?: OutType | OutArrType;
  /** @deprecated */
  allowedOrgs?: string[];
  allowedRoles?: string[];
  apiMethodName?: string;
  sequence?: MethodAPI[];
  before?: GalaTransactionBeforeFn;
  after?: GalaTransactionAfterFn;
}

export interface GalaTransactionOptions<T extends ChainCallDTO> extends CommonTransactionOptions<T> {
  type: GalaTransactionType;
  verifySignature?: true;
  enforceUniqueKey?: true;
}

export type GalaSubmitOptions<T extends SubmitCallDTO> = CommonTransactionOptions<T>;

export interface GalaEvaluateOptions<T extends ChainCallDTO> extends CommonTransactionOptions<T> {
  verifySignature?: true;
}

function isArrayOut(x: OutType | OutArrType | undefined): x is OutArrType {
  return typeof x === "object" && "arrayOf" in x;
}

function Submit<T extends SubmitCallDTO>(options: GalaSubmitOptions<T>): GalaTransactionDecoratorFunction {
  return GalaTransaction({ ...options, type: SUBMIT, verifySignature: true, enforceUniqueKey: true });
}

function Evaluate<T extends ChainCallDTO>(options: GalaEvaluateOptions<T>): GalaTransactionDecoratorFunction {
  return GalaTransaction({ ...options, type: EVALUATE, verifySignature: true });
}

function UnsignedEvaluate<T extends ChainCallDTO>(
  options: GalaEvaluateOptions<T>
): GalaTransactionDecoratorFunction {
  return GalaTransaction({ ...options, type: EVALUATE });
}

function GalaTransaction<T extends ChainCallDTO>(
  options: GalaTransactionOptions<T>
): GalaTransactionDecoratorFunction {
  return (target, propertyKey, descriptor): void => {
    // Register the DTO class to be passed
    if (options.in !== undefined) {
      DTOObject()(options.in);
    }

    if (options.type === SUBMIT && !options.verifySignature && !options.allowedOrgs?.length) {
      const message = `SUBMIT transaction '${propertyKey}' must have either verifySignature or allowedOrgs defined`;
      throw new NotImplementedError(message);
    }

    if (options.allowedRoles !== undefined && options.allowedOrgs !== undefined) {
      const message = `Transaction '${propertyKey}': allowedRoles and allowedOrgs cannot be defined at the same time`;
      throw new NotImplementedError(message);
    }

    options.allowedRoles = options.allowedRoles ?? [
      options.type === SUBMIT ? UserRole.SUBMIT : UserRole.EVALUATE
    ];

    if (options.type === SUBMIT && !options.enforceUniqueKey) {
      const message = `SUBMIT transaction '${propertyKey}' must have enforceUniqueKey defined`;
      throw new NotImplementedError(message);
    }

    if (options.type === EVALUATE && options.enforceUniqueKey) {
      const message = `EVALUATE transaction '${propertyKey}' cannot have enforceUniqueKey defined`;
      throw new NotImplementedError(message);
    }

    // Takes the method to wrap
    const method = descriptor.value;
    const className = target.constructor?.name ?? "UnknownContractClass";

    if (method?.name === undefined) {
      throw new RuntimeError("Undefined method name for descriptor.value: " + inspect(method));
    }

    const loggingContext = `${className}:${method.name ?? "UnknownMethod"}`;

    // Creates the new method. The first parameter is always ctx, the second,
    // optional one, is a plain dto object. We ignore the rest. This is our
    // convention.
    // eslint-disable-next-line no-param-reassign
    descriptor.value = async function (ctx, dtoPlain) {
      try {
        const metadata = [{ dto: dtoPlain }];
        ctx?.logger?.logTimeline("Begin Transaction", loggingContext, metadata);

        // Parse & validate - may throw an exception
        const dtoClass = options.in ?? (ChainCallDTO as unknown as ClassConstructor<Inferred<T>>);
        const dto = !dtoPlain
          ? undefined
          : await parseValidDTO<T>(dtoClass, dtoPlain as string | Record<string, unknown>);

        // Authenticate the user
        if (ctx.isDryRun) {
          // Do not authenticate in dry run mode
        } else if (options?.verifySignature || dto?.signature !== undefined) {
          ctx.callingUserData = await authenticate(ctx, dto);
        } else {
          // it means a request where authorization is not required. Intentionally misses alias field
          ctx.callingUserData = { roles: [UserRole.EVALUATE] };
        }

        // Authorize the user
        await authorize(ctx, options);

        // Prevent the same transaction from being submitted multiple times
        if (options.enforceUniqueKey) {
          if (dto?.uniqueKey) {
            await UniqueTransactionService.ensureUniqueTransaction(ctx, dto.uniqueKey);
          } else {
            throw new RuntimeError("Missing uniqueKey in transaction dto");
          }
        }

        const argArray: [GalaChainContext, T] | [GalaChainContext] = dto ? [ctx, dto] : [ctx];

        if (options?.before !== undefined) {
          await options?.before?.apply(this, argArray);
        }

        // Execute the method. Note the contract method is always an async
        // function, so it is safe to do the `await`
        const result = await method?.apply(this, argArray);

        const normalizedResult =
          typeof result === "object" && "Status" in result && typeof result.Status === "number"
            ? result
            : GalaChainResponse.Success(result);

        if (options?.after !== undefined) {
          await options?.after?.apply(this, [ctx, dto, normalizedResult]);
        }

        return normalizedResult;
      } catch (err) {
        if (ctx.logger) {
          ChainError.from(err).logWarn(ctx.logger);
          ctx.logger.logTimeline("Failed Transaction", loggingContext, [dtoPlain], err);
          ctx.logger.debug(err.message);
          ctx.logger.debug(err.stack);
        }

        // Note: since it does not end with an exception, failed transactions are also saved
        // on chain in transaction history.
        return GalaChainResponse.Error(err as Error);
      }
    };

    // Update API of contract object
    const isWrite = options.type === GalaTransactionType.SUBMIT;

    let description = options.description ? options.description : "";

    if (options.type === GalaTransactionType.SUBMIT) {
      description += description ?? ` Transaction updates the chain (submit).`;
    } else {
      description += ` Transaction is read only (evaluate).`;
    }

    if (options.allowedRoles && options.allowedRoles.length > 0) {
      description += ` Allowed roles: ${options.allowedRoles.join(", ")}.`;
    }

    if (options.allowedOrgs && options.allowedOrgs.length > 0) {
      description += ` Allowed orgs: ${options.allowedOrgs.join(", ")}.`;
    }

    const responseSchema = isArrayOut(options.out)
      ? generateResponseSchema(options.out.arrayOf, "array")
      : generateResponseSchema(options.out);

    updateApi(target, {
      isWrite,
      methodName: method.name,
      ...(options.apiMethodName === undefined ? {} : { apiMethodName: options.apiMethodName }),
      ...(options.in === undefined ? {} : { dtoSchema: generateSchema(options.in) }),
      description,
      responseSchema,
      ...(options.deprecated === undefined ? {} : { deprecated: options.deprecated }),
      ...(options.sequence === undefined ? {} : { sequence: options.sequence })
    });

    // Ensure this is an actual HLF transaction.
    // If this annotation is missing, you cannot call the chaincode method
    Transaction(isWrite)(target, propertyKey);
  };
}

export { Submit, Evaluate, UnsignedEvaluate, SUBMIT, EVALUATE, GalaTransaction };
