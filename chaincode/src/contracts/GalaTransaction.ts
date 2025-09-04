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
  ExpiredError,
  GalaChainResponse,
  Inferred,
  MethodAPI,
  NotImplementedError,
  Primitive,
  RuntimeError,
  SubmitCallDTO,
  UserProfile,
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
import { authorize, QuorumInfo } from "./authorize";

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

type OutType<T> = ClassConstructor<T> | Primitive;
type OutArrType<T> = { arrayOf: OutType<T> };

export type GalaTransactionBeforeFn<In extends ChainCallDTO> = (
  ctx: GalaChainContext,
  dto: In
) => Promise<void>;

export type GalaTransactionAfterFn<In extends ChainCallDTO, Out> = (
  ctx: GalaChainContext,
  dto: In,
  result: GalaChainResponse<Out>
) => Promise<unknown>;

export interface CommonTransactionOptions<In extends ChainCallDTO, Out> {
  deprecated?: true;
  description?: string;
  in?: ClassConstructor<Inferred<In>>;
  out?: OutType<Out> | OutArrType<Out>;
  /** @deprecated */
  allowedOrgs?: string[];
  allowedRoles?: string[];
  allowedOriginChaincodes?: string[];
  quorum?: number;
  apiMethodName?: string;
  sequence?: MethodAPI[];
  before?: GalaTransactionBeforeFn<In>;
  after?: GalaTransactionAfterFn<In, Out | Out[]>;
}

export interface GalaTransactionOptions<In extends ChainCallDTO, Out>
  extends CommonTransactionOptions<In, Out> {
  type: GalaTransactionType;
  verifySignature?: true;
  enforceUniqueKey?: true;
}

export type GalaSubmitOptions<In extends SubmitCallDTO, Out> = CommonTransactionOptions<In, Out>;

export interface GalaEvaluateOptions<In extends ChainCallDTO, Out> extends CommonTransactionOptions<In, Out> {
  verifySignature?: true;
}

function isArrayOut<Out>(x: OutType<Out> | OutArrType<Out> | undefined): x is OutArrType<Out> {
  return typeof x === "object" && "arrayOf" in x;
}

function Submit<In extends SubmitCallDTO, Out>(
  options: GalaSubmitOptions<In, Out>
): GalaTransactionDecoratorFunction {
  return GalaTransaction({ ...options, type: SUBMIT, verifySignature: true, enforceUniqueKey: true });
}

function Evaluate<In extends ChainCallDTO, Out>(
  options: GalaEvaluateOptions<In, Out>
): GalaTransactionDecoratorFunction {
  return GalaTransaction({ ...options, type: EVALUATE, verifySignature: true });
}

function UnsignedEvaluate<In extends ChainCallDTO, Out>(
  options: CommonTransactionOptions<In, Out>
): GalaTransactionDecoratorFunction {
  return GalaTransaction({ ...options, type: EVALUATE });
}

function GalaTransaction<In extends ChainCallDTO, Out>(
  options: GalaTransactionOptions<In, Out>
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
        const dtoClass = options.in ?? (ChainCallDTO as unknown as ClassConstructor<Inferred<In>>);
        const dto = !dtoPlain
          ? undefined
          : await parseValidDTO<In>(dtoClass, dtoPlain as string | Record<string, unknown>);

        // Note using Date.now() instead of ctx.txUnixTime which is provided client-side.
        if (dto?.dtoExpiresAt && dto.dtoExpiresAt < Date.now()) {
          throw new ExpiredError(`DTO expired at ${new Date(dto.dtoExpiresAt).toISOString()}`);
        }

        // Authenticate the user
        let quorumInfo: QuorumInfo | undefined;
        if (ctx.isDryRun) {
          // Do not authenticate in dry run mode
        } else if (options?.verifySignature || dto?.signature !== undefined) {
          const auth = await authenticate(ctx, dto);
          ctx.callingUserData = auth;
          quorumInfo = { signedByKeys: auth.signedByKeys, pubKeyCount: auth.pubKeyCount };
        } else {
          // it means a request where authorization is not required. If there is org-based authorization,
          // default roles are applied. If not, then only evaluate is possible. Alias is intentionally
          // missing.
          const roles = !options.allowedOrgs?.length ? [UserRole.EVALUATE] : [...UserProfile.DEFAULT_ROLES];
          ctx.callingUserData = { roles };
        }

        // Authorize the user
        await authorize(ctx, options, quorumInfo);

        // Prevent the same transaction from being submitted multiple times
        if (options.enforceUniqueKey) {
          if (dto?.uniqueKey) {
            await UniqueTransactionService.ensureUniqueTransaction(ctx, dto.uniqueKey);
          } else {
            const message = `Missing uniqueKey in transaction dto for method '${method.name}'`;
            throw new RuntimeError(message);
          }
        }

        const argArray: [GalaChainContext, In] | [GalaChainContext] = dto ? [ctx, dto] : [ctx];

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
        const chainError = ChainError.from(err);

        if (ctx.logger) {
          chainError.logWarn(ctx.logger);
          ctx.logger.logTimeline("Failed Transaction", loggingContext, [dtoPlain], err);
          ctx.logger.debug(err.message);
          ctx.logger.debug(err.stack);
        }

        // if external chaincode call succeeded, but the remaining part of the
        // chaincode failed, we need to throw an error to prevent from the state
        // being updated by the external chaincode. There seems to be no other
        // way to rollback the state changes.
        if (ctx.stub.externalChaincodeWasInvoked) {
          const message =
            "External chaincode call succeeded, but the remaining part of the chaincode failed with: " +
            `${chainError.key}: ${chainError.message}`;
          throw new RuntimeError(message);
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
