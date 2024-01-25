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
import { ChainCallDTO, GalaChainResponse, Inferred } from "@gala-chain/api";

import { ChainClientBuilder } from "./ChainClientBuilder";
import { ContractConfig } from "./ContractConfig";

export type ClassType<T> = {
  new (...args: unknown[]): T;
};

export const isClassType = (obj: unknown): obj is ClassType<unknown> => typeof obj === "function";

export abstract class ChainClient {
  protected constructor(
    public readonly builder: Promise<ChainClientBuilder>,
    public readonly userId: string,
    public readonly contractConfig: ContractConfig,
    public readonly orgMsp: string
  ) {}

  abstract submitTransaction(method: string): Promise<GalaChainResponse<unknown>>;

  abstract submitTransaction(method: string, dto: ChainCallDTO): Promise<GalaChainResponse<unknown>>;

  abstract submitTransaction<T>(method: string, resp: ClassType<Inferred<T>>): Promise<GalaChainResponse<T>>;

  abstract submitTransaction<T>(
    method: string,
    dto: ChainCallDTO,
    resp: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>>;

  abstract evaluateTransaction(method: string): Promise<GalaChainResponse<unknown>>;

  abstract evaluateTransaction(method: string, dto: ChainCallDTO): Promise<GalaChainResponse<unknown>>;

  abstract evaluateTransaction<T>(
    method: string,
    resp: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>>;

  abstract evaluateTransaction<T>(
    method: string,
    dto: ChainCallDTO,
    resp: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>>;

  abstract disconnect(): Promise<void>;

  abstract forUser(userId: string): ChainClient;

  extendAPI<T extends object>(apiHandlerFn: (_: ChainClient) => T): this & T {
    const handler = apiHandlerFn(this);
    return new Proxy<this & T>(this as this & T, {
      get(target: ChainClient & T, p: string): unknown {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return p in handler ? handler[p] : target[p];
      }
    });
  }
}
