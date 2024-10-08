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
  ChainObject,
  ClassConstructor,
  DefaultError,
  ForbiddenError,
  Inferred,
  NotFoundError,
  RangedChainObject,
  ValidationFailedError
} from "@gala-chain/api";
import { QueryResponseMetadata } from "fabric-shim";

import { GalaChainContext } from "../types";

// Fabric default value, we don't want to change it
// see https://hyperledger-fabric.readthedocs.io/en/latest/performance.html#total-query-limit
const TOTAL_RESULTS_LIMIT = 100 * 1000;

export class ObjectNotFoundError extends NotFoundError {
  constructor(objectId: string) {
    super(`No object with id ${objectId} exists`, { objectId });
  }
}

export class NoObjectIdsError extends ValidationFailedError {
  constructor() {
    super("objectIds parameter cannot be empty");
  }
}

export class InvalidResultsError extends DefaultError {
  constructor(messages: string[]) {
    super("Cannot get all results", { messages });
  }
}

/**
 * @description
 *
 * Validate the provided `ChainObject`, serialize it into an appropriate
 * format for on-chain storage, and queue a `putState` call in the `GalaChainStub`.
 * Will write the data to World State indexed by its composite key upon
 * successful transaction completeion.
 *
 * Throws `ObjectValidationFailedError` on validation failure.
 *
 * @remarks
 * See also `GalaChainStub` for details on caching and transactional writes
 * supported by this method.
 *
 * @param ctx
 * @param data
 * @returns
 */
export async function putChainObject(ctx: GalaChainContext, data: ChainObject): Promise<void> {
  await data.validateOrReject();
  return ctx.stub.putState(data.getCompositeKey(), Buffer.from(data.serialize()));
}

/**
 * @description
 *
 * Validate the provided `RangedChainObject`, serialize it into an appropriate format
 * for on-chain storage, and queue a `putState` call in the `GalaChainStub`.
 * Will write the data to World State indexed by its simple key upon successful
 * transaction completion.
 *
 * @remarks
 * See also `GalaChainStub` for details on caching and transactional writes
 * supported by this method.
 *
 * @param ctx
 * @param data
 * @returns
 */
export async function putRangedChainObject(ctx: GalaChainContext, data: RangedChainObject): Promise<void> {
  await data.validateOrReject();
  return ctx.stub.putState(data.getRangedKey(), Buffer.from(data.serialize()));
}

/**
 * @description
 *
 * Queue a `deleteState` call in the `GalaChainStub` using the composite key
 * of the provided `ChainObject`.
 *
 * @remarks
 * See also `GalaChainStub` for details on caching and transactional writes
 * supported by this method.
 *
 * @param ctx
 * @param data
 * @returns
 */
export async function deleteChainObject(ctx: GalaChainContext, data: ChainObject): Promise<void> {
  return ctx.stub.deleteState(data.getCompositeKey());
}

/**
 * @description
 *
 * Query Chain Objects by Partial Composite Key. Refer to class definitions
 * for types that extend `ChainObject` to determine property names and order
 * of the `@ChainKey` composite parts.
 *
 * Non-paginated version. Use cases that expect large numbers of results
 * should use `getObjectsByPartialCompositeKeyWithPagination()` instead.
 *
 * @remarks
 * The `@ChainKeys` that make up the World State composite keys are ordered,
 * and cannot be skipped when making partial composite key queries.
 * Be advised that broad queries can lead
 * to performance issues for large result sets.
 *
 * @param ctx
 * @param objectType
 * @param attributes
 * @param constructor
 * @returns Array of Chain Objects deserialized using the provided constructor
 */
export async function getObjectsByPartialCompositeKey<T extends ChainObject>(
  ctx: GalaChainContext,
  objectType: string,
  attributes: string[],
  constructor: ClassConstructor<Inferred<T, ChainObject>>
): Promise<Array<T>> {
  const iterator = ctx.stub.getCachedStateByPartialCompositeKey(objectType, attributes);

  const allResults: Array<T> = [];

  for await (const res of iterator) {
    const stringResult = Buffer.from(res.value).toString("utf8");
    allResults.push(ChainObject.deserialize(constructor, stringResult));
  }

  if (allResults.length >= TOTAL_RESULTS_LIMIT) {
    const message =
      `Reached total results limit (${TOTAL_RESULTS_LIMIT}). ` +
      `It means your results would be probably incomplete. ` +
      `Please narrow your query or use pagination.`;

    throw new ForbiddenError(message, { objectType, attributes });
  }

  // iterator will be automatically closed on exit from the loop
  // either by reaching the end, or a break or throw terminated the loop
  return allResults;
}

/**
 * @description
 *
 * Query Chain Objects by Partial Composite Key. Refer to class definitions
 * for types that extend `ChainObject` to determine property names and order
 * of the `@ChainKey` composite parts.
 *
 * Paginated version. Use cases that expect large numbers of results
 * can use this method to page through results. Cannot be used in SUBMIT
 * transactions.
 *
 * @remarks
 * The `@ChainKeys` that make up the World State composite keys are ordered,
 * and cannot be skipped when making partial composite key queries.
 * Be advised that broad queries can lead
 * to performance issues for large result sets. Tune page size using the `limit`
 * property accordingly.
 *
 * @param ctx
 * @param objectType
 * @param attributes
 * @param constructor
 * @returns
 * Promise of an Object containing two properties:
 * results: Array of Chain Objects deserialized using the provided constructor,
 * metadata: QueryResponseMetadata
 */
export async function getObjectsByPartialCompositeKeyWithPagination<T extends ChainObject>(
  ctx: GalaChainContext,
  objectType: string,
  attributes: string[],
  constructor: ClassConstructor<Inferred<T, ChainObject>>,
  bookmark: string | undefined,
  limit: number = TOTAL_RESULTS_LIMIT
): Promise<{ results: Array<T>; metadata: QueryResponseMetadata }> {
  // Uses default fabric call. No need for cache support, since Fabric disallows
  // this call in submit queries.
  const response = ctx.stub.getStateByPartialCompositeKeyWithPagination(
    objectType,
    attributes,
    limit,
    bookmark
  );

  const results: Array<T> = [];

  for await (const res of response) {
    const stringResult = Buffer.from(res.value).toString("utf8");
    results.push(ChainObject.deserialize(constructor, stringResult));
  }

  // Typically, Fabric returns undefined here if there are no results
  const metadata: QueryResponseMetadata = (await response).metadata ?? {
    bookmark: "",
    fetchedRecordsCount: results.length
  };

  return { results, metadata };
}

/**
 * @description
 *
 * Fetch an object from on-chain World State by its key.
 *
 * The result will be deserialized and returned as an
 * instantiated class instance using the provided `constructor`.
 *
 * @remarks
 *
 * Reads from `GalaChainStub` if object has been read
 * previously during transaction execution.
 *
 * @param ctx
 * @param constructor
 * @param objectId
 */
export async function getObjectByKey<T extends ChainObject>(
  ctx: GalaChainContext,
  constructor: ClassConstructor<Inferred<T, ChainObject>>,
  objectId: string
): Promise<T> {
  const objectBuffer = await ctx.stub.getCachedState(objectId);

  if (!objectBuffer || objectBuffer.length === 0) {
    throw new ObjectNotFoundError(objectId);
  }

  return ChainObject.deserialize(constructor, objectBuffer.toString());
}

/**
 * @description
 *
 * Lookup a single ranged object by its key. `RangedChainObject` instances
 * use HyperLedger Fabric's simple key scheme and are indexed in World State
 * separately from the composite key namespace.
 *
 * The result will be deserialized and returned as an
 * instantiated class instance using the provided `constructor`.
 *
 * @remarks
 * Reads from `GalaChainStub` if object has been read
 * previously during transaction execution.
 *
 * @param ctx
 * @param constructor
 * @param objectId
 */
export async function getRangedObjectByKey<T extends RangedChainObject>(
  ctx: GalaChainContext,
  constructor: ClassConstructor<Inferred<T, RangedChainObject>>,
  objectId: string
): Promise<T> {
  const objectBuffer = await ctx.stub.getCachedState(objectId);

  if (!objectBuffer || objectBuffer.length === 0) {
    throw new ObjectNotFoundError(objectId);
  }

  return RangedChainObject.deserialize(constructor, objectBuffer.toString());
}

export async function getPlainObjectByKey(
  ctx: GalaChainContext,
  objectId: string
): Promise<Record<string, unknown>> {
  const objectBuffer = await ctx.stub.getCachedState(objectId);

  if (!objectBuffer || objectBuffer.length === 0) {
    throw new ObjectNotFoundError(objectId);
  }

  return JSON.parse(objectBuffer.toString());
}

export async function getObjectHistory(
  ctx: GalaChainContext,
  objectId: string
): Promise<{ history: unknown[] }> {
  const iterator = await ctx.stub.getHistoryForKey(objectId);
  const history: unknown[] = [];
  let res = await iterator.next();

  while (!res.done) {
    if (res.value) {
      history.push(res.value);
    }
    res = await iterator.next();
  }
  await iterator.close();

  return { history };
}

/**
 * @description
 *
 * Gets objects by keys and returns them in the same order as in `projectIds` parameter.
 * If getting at least one object fails, throws an exception.
 */
export async function getObjectsByKeys<T extends ChainObject>(
  ctx: GalaChainContext,
  constructor: ClassConstructor<Inferred<T, ChainObject>>,
  objectIds: Array<string>
): Promise<Array<T>> {
  if (objectIds.length < 1) {
    throw new NoObjectIdsError();
  }

  // Start all async operations
  const operations: Array<Promise<T>> = objectIds.map((id) => getObjectByKey(ctx, constructor, id));

  // Collect results (in the same order as operations)
  type ResultsType = { successes: Array<T>; failures: Array<{ id: string; message: string }> };
  const results: ResultsType = await operations.reduce<Promise<ResultsType>>(
    async (currentResults, operation, i) => {
      const { successes, failures }: ResultsType = await currentResults;

      try {
        return { successes: [...successes, await operation], failures: failures };
      } catch (e) {
        return {
          successes: successes,
          failures: [...failures, { id: objectIds[i], message: (e as Error).message }]
        };
      }
    },
    Promise.resolve({ successes: [], failures: [] })
  );

  if (results.failures.length) {
    const messages = results.failures.map(({ id, message }) => `${id}: ${message}`);
    throw new InvalidResultsError(messages);
  } else {
    return results.successes;
  }
}

/**
 * @description
 *
 * objectExists returns true when asset with given ID exists in world state.
 * Only use this function to check for existence. The stored data will not be
 * deserialized or returned.
 *
 * @param ctx
 * @param id
 * @returns `Promise<boolean>`
 */
export async function objectExists(ctx: GalaChainContext, id: string): Promise<boolean> {
  const assetJSON = await ctx.stub.getCachedState(id);

  return assetJSON && assetJSON.length > 0;
}
