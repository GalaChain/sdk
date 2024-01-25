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

export async function putChainObject(ctx: GalaChainContext, data: ChainObject): Promise<void> {
  await data.validateOrReject();
  return ctx.stub.putState(data.getCompositeKey(), Buffer.from(data.serialize()));
}

export async function putRangedChainObject(ctx: GalaChainContext, data: RangedChainObject): Promise<void> {
  await data.validateOrReject();
  return ctx.stub.putState(data.getRangedKey(), Buffer.from(data.serialize()));
}

export async function deleteChainObject(ctx: GalaChainContext, data: ChainObject): Promise<void> {
  return ctx.stub.deleteState(data.getCompositeKey());
}

export async function getObjectsByPartialCompositeKey<T extends ChainObject>(
  ctx: GalaChainContext,
  objectType: string,
  attributes: string[],
  constructor: ClassConstructor<Inferred<T, ChainObject>>,
  muteQueryLimitError: boolean
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

    if (muteQueryLimitError) {
      ctx.logger.warn(message);
    } else {
      // why it is "forbidden" type of error: https://stackoverflow.com/a/15192643
      throw new ForbiddenError(message, { objectType, attributes });
    }
  }

  // iterator will be automatically closed on exit from the loop
  // either by reaching the end, or a break or throw terminated the loop
  return allResults;
}

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

  const metadata = (await response).metadata;

  return { results, metadata };
}

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

// objectExists returns true when asset with given ID exists in world state.
// Only use this if we don't need the data from the chain
export async function objectExists(ctx: GalaChainContext, id: string): Promise<boolean> {
  const assetJSON = await ctx.stub.getCachedState(id);

  return assetJSON && assetJSON.length > 0;
}
