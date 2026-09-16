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
import { ChainClient, Serializable } from "../generic";
import { GalaChainResponse, serialize } from "../wire";

export interface CommonContractAPI extends Record<string, unknown> {
  GetContractVersion(): Promise<GalaChainResponse<string>>;
  GetContractAPI(): Promise<GalaChainResponse<Record<string, unknown>>>;
  GetObjectByKey(key: string): Promise<GalaChainResponse<Record<string, unknown>>>;
  GetObjectHistory(key: string): Promise<GalaChainResponse<Record<string, unknown>>>;
  DryRun(
    method: string,
    callerPublicKey: string,
    dto: Serializable
  ): Promise<GalaChainResponse<Record<string, unknown>>>;
  BatchSubmit(batch: Serializable): Promise<GalaChainResponse<GalaChainResponse<unknown>[]>>;
  BatchEvaluate(batch: Serializable): Promise<GalaChainResponse<GalaChainResponse<unknown>[]>>;
}

function asDto(plain: Record<string, unknown>): Serializable {
  return { serialize: () => serialize(plain) };
}

export const commonContractAPI = (client: ChainClient): CommonContractAPI => ({
  async GetContractVersion(): Promise<GalaChainResponse<string>> {
    return client.evaluateTransaction("GetContractVersion") as Promise<GalaChainResponse<string>>;
  },

  async GetContractAPI(): Promise<GalaChainResponse<Record<string, unknown>>> {
    return client.evaluateTransaction("GetContractAPI") as Promise<
      GalaChainResponse<Record<string, unknown>>
    >;
  },

  async GetObjectByKey(key: string): Promise<GalaChainResponse<Record<string, unknown>>> {
    return client.evaluateTransaction("GetObjectByKey", asDto({ objectId: key })) as Promise<
      GalaChainResponse<Record<string, unknown>>
    >;
  },

  async GetObjectHistory(key: string): Promise<GalaChainResponse<Record<string, unknown>>> {
    return client.evaluateTransaction("GetObjectHistory", asDto({ objectId: key })) as Promise<
      GalaChainResponse<Record<string, unknown>>
    >;
  },

  async DryRun(
    method: string,
    callerPublicKey: string,
    dto: Serializable
  ): Promise<GalaChainResponse<Record<string, unknown>>> {
    const inner = JSON.parse(serialize(dto));
    return client.evaluateTransaction("DryRun", asDto({ method, callerPublicKey, dto: inner })) as Promise<
      GalaChainResponse<Record<string, unknown>>
    >;
  },

  async BatchSubmit(batch: Serializable): Promise<GalaChainResponse<GalaChainResponse<unknown>[]>> {
    return client.submitTransaction("BatchSubmit", batch) as Promise<
      GalaChainResponse<GalaChainResponse<unknown>[]>
    >;
  },

  async BatchEvaluate(batch: Serializable): Promise<GalaChainResponse<GalaChainResponse<unknown>[]>> {
    return client.evaluateTransaction("BatchEvaluate", batch) as Promise<
      GalaChainResponse<GalaChainResponse<unknown>[]>
    >;
  }
});
