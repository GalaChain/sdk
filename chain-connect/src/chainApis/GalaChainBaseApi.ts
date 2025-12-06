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

/**
 * Base API class providing common chaincode operations.
 * Serves as the foundation for specific API implementations.
 */
export class GalaChainBaseApi {
  /**
   * Creates a new base API instance.
   * @param chainCodeUrl - The URL of the chaincode service
   * @param connection - The GalaChain provider for network communication
   */
  constructor(
    protected chainCodeUrl: string,
    protected connection: GalaChainProvider
  ) {}

  /**
   * Performs a dry run of a chaincode operation without committing to the ledger.
   * @param dto - The dry run request parameters
   * @returns Promise resolving to the dry run results
   */
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

  /**
   * Retrieves an object from the blockchain by its key.
   * @template T - The expected type of the retrieved object
   * @param dto - The object key request parameters
   * @returns Promise resolving to the retrieved object
   */
  public GetObjectByKey<T = Record<string, unknown>>(dto: GetObjectByKeyRequest) {
    return this.connection.submit<T, GetObjectDto>({
      method: "GetObjectByKey",
      payload: dto,
      sign: false,
      url: this.chainCodeUrl,
      requestConstructor: GetObjectDto
    });
  }

  /**
   * Retrieves the history of changes for an object from the blockchain.
   * @template T - The expected type of the historical objects
   * @param dto - The object history request parameters
   * @returns Promise resolving to the object's history
   */
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
