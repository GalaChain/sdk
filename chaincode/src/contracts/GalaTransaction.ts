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
  Primitive,
  RuntimeError,
  UnauthorizedError,
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
import { authorize, ensureOrganizationIsAllowed } from "./authorize";
import { legacyClientAccountId } from "./legacyClientAccountId";

// All DTOs need to be registered in the application, including super classes. Otherwise, chaincode
// containers will fail to start. Below we register just some base classes. Actual DTO classes are
// registered inside decorator factory.
//
DTOObject()(ChainCallDTO);

// Note: it is just a metadata, you cannot effectively forbid to submit the transaction
// (you can, however make it readonly by passing random value to the result or manipulating the context)
enum GalaTransactionType {
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

export interface GalaTransactionOptions<T extends ChainCallDTO> {
  type: GalaTransactionType;
  deprecated?: true;
  description?: string;
  in?: ClassConstructor<Inferred<T>>;
  out?: OutType | OutArrType;
  allowedOrgs?: string[];
  verifySignature?: true;
  apiMethodName?: string;
  sequence?: MethodAPI[];
  enforceUniqueKey?: true;
  before?: GalaTransactionBeforeFn;
  after?: GalaTransactionAfterFn;
}

type GalaSubmitOptions<T extends ChainCallDTO> = Omit<
  Omit<GalaTransactionOptions<T>, "type">,
  "verifySignature"
>;

type GalaEvaluateOptions<T extends ChainCallDTO> = Omit<
  Omit<GalaTransactionOptions<T>, "type">,
  "verifySignature"
>;

function isArrayOut(x: OutType | OutArrType | undefined): x is OutArrType {
  return typeof x === "object" && "arrayOf" in x;
}

function Submit<T extends ChainCallDTO>(options: GalaSubmitOptions<T>): GalaTransactionDecoratorFunction {
  return GalaTransaction({ ...options, type: SUBMIT, verifySignature: true });
}

function Evaluate<T extends ChainCallDTO>(options: GalaEvaluateOptions<T>): GalaTransactionDecoratorFunction {
  return GalaTransaction({ ...options, type: EVALUATE, verifySignature: true });
}

function GalaTransaction<T extends ChainCallDTO>(
  options: GalaTransactionOptions<T>
): GalaTransactionDecoratorFunction {
  // Register the DTO class to be passed
  if (options.in !== undefined) {
    DTOObject()(options.in);
  }

  if (options.type === SUBMIT && !options.verifySignature && !options.allowedOrgs?.length) {
    const message = `SUBMIT transaction must have either verifySignature or allowedOrgs defined`;
    throw new UnauthorizedError(message);
  }

  // An actual decorator
  return (target, propertyKey, descriptor): void => {
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

        // Verify public key signature if needed - throws exception in case of failure
        if (options?.verifySignature || dto?.signature !== undefined) {
          ctx.callingUserData = await authorize(ctx, dto, legacyClientAccountId(ctx));
        } else {
          // it means a request where authorization is not required
          ctx.callingUserData = { alias: legacyClientAccountId(ctx) };
        }

        // Prevent the same transaction from being submitted multiple times
        if (dto?.uniqueKey) {
          await UniqueTransactionService.ensureUniqueTransaction(ctx, dto.uniqueKey);
        } else if (options.enforceUniqueKey) {
          throw new RuntimeError("Missing uniqueKey in transaction dto");
        }

        const argArray: [GalaChainContext, T] | [GalaChainContext] = dto ? [ctx, dto] : [ctx];

        // Verify if organization can invoke this method - throws exception in case of failure
        if (options?.allowedOrgs) {
          ensureOrganizationIsAllowed(ctx, options.allowedOrgs);
        }

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
        }
        // Note: since it does not end with an exception, failed transactions are also saved
        // on chain in transaction history.
        return GalaChainResponse.Error(err as Error);
      }
    };

    // Update API of contract object
    const isWrite = options.type === GalaTransactionType.SUBMIT;
    const responseSchema = isArrayOut(options.out)
      ? generateResponseSchema(options.out.arrayOf, "array")
      : generateResponseSchema(options.out);
    updateApi(target, {
      isWrite,
      methodName: method.name,
      ...(options.apiMethodName === undefined ? {} : { apiMethodName: options.apiMethodName }),
      ...(options.in === undefined ? {} : { dtoSchema: generateSchema(options.in) }),
      responseSchema,
      ...(options.deprecated === undefined ? {} : { deprecated: options.deprecated }),
      ...(options.description === undefined ? {} : { description: options.description }),
      ...(options.sequence === undefined ? {} : { sequence: options.sequence })
    });

    // Ensure this is an actual HLF transaction.
    // If this annotation is missing, you cannot call the chaincode method
    Transaction(isWrite)(target, propertyKey);
  };
}

export { Submit, Evaluate, SUBMIT, EVALUATE, GalaTransaction };
