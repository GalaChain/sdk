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
import { DryRunDto, GetObjectDto, GetObjectHistoryDto, createValidDTO } from "@gala-chain/api";

import { GalaChainProvider } from "../GalaChainClient";
import { DryRunRequest, DryRunResult, GetObjectByKeyRequest, GetObjectHistoryRequest } from "../types";

export class GalaChainBaseApi {
  constructor(
    protected chainCodeUrl: string,
    protected connection: GalaChainProvider
  ) {}

  public async DryRun(dto: DryRunRequest) {
    await createValidDTO(DryRunDto, dto);
    const stringifiedDto = {
      ...dto,
      dto: JSON.stringify(dto.dto)
    };
    return this.connection.submit({
      method: "DryRun",
      payload: stringifiedDto,
      sign: false,
      url: this.chainCodeUrl,
      responseConstructor: DryRunResult
    });
  }

  public GetObjectByKey<T = Record<string, unknown>>(dto: GetObjectByKeyRequest) {
    return this.connection.submit<T, GetObjectDto>({
      method: "GetObjectByKey",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: GetObjectDto
    });
  }

  public GetObjectHistory<T = Record<string, unknown>>(dto: GetObjectHistoryRequest) {
    return this.connection.submit<T, GetObjectHistoryDto>({
      method: "GetObjectHistory",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: GetObjectHistoryDto
    });
  }
}
