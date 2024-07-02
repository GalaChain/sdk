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
  ContractAPI,
  DryRunDto,
  DryRunResultDto,
  GalaChainResponse,
  GetObjectDto,
  GetObjectHistoryDto,
  createValidDTO
} from "@gala-chain/api";

import { ChainClient } from "../generic";

export interface CommonContractAPI extends Record<string, unknown> {
  GetContractVersion(): Promise<GalaChainResponse<string>>;
  GetContractAPI(): Promise<GalaChainResponse<ContractAPI>>;
  GetObjectByKey(key: string): Promise<GalaChainResponse<Record<string, unknown>>>;
  GetObjectHistory(key: string): Promise<GalaChainResponse<Record<string, unknown>>>;
  DryRun(
    method: string,
    callerPublicKey: string,
    dto: ChainCallDTO
  ): Promise<GalaChainResponse<DryRunResultDto>>;
}

export const commonContractAPI = (client: ChainClient): CommonContractAPI => ({
  async GetContractVersion(): Promise<GalaChainResponse<string>> {
    const resp = await client.evaluateTransaction("GetContractVersion");
    return resp as GalaChainResponse<string>;
  },

  async GetContractAPI(): Promise<GalaChainResponse<ContractAPI>> {
    const resp = await client.evaluateTransaction("GetContractAPI");
    return resp as GalaChainResponse<ContractAPI>;
  },

  async GetObjectByKey(key: string): Promise<GalaChainResponse<Record<string, unknown>>> {
    const dto = await createValidDTO(GetObjectDto, { objectId: key });
    const resp = await client.evaluateTransaction("GetObjectByKey", dto);
    return resp as GalaChainResponse<Record<string, unknown>>;
  },

  async GetObjectHistory(key: string): Promise<GalaChainResponse<Record<string, unknown>>> {
    const dto = await createValidDTO(GetObjectHistoryDto, { objectId: key });
    const resp = await client.evaluateTransaction("GetObjectHistory", dto);
    return resp as GalaChainResponse<Record<string, unknown>>;
  },

  async DryRun(
    method: string,
    callerPublicKey: string,
    dto: ChainCallDTO
  ): Promise<GalaChainResponse<DryRunResultDto>> {
    const dryRunDto = await createValidDTO(DryRunDto, { method, callerPublicKey, dto });
    const resp = await client.evaluateTransaction("DryRun", dryRunDto);
    return resp as GalaChainResponse<DryRunResultDto>;
  }
});
