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
import { GalaChainErrorResponse, GalaChainResponseType, GalaChainSuccessResponse } from "@gala-chain/api";

type GalaChainError<T> = {
  error: string | GalaChainErrorResponse<T>;
  message: string;
  statusCode?: number;
};

export class GalaChainResponseSuccess<T> {
  public readonly Status: GalaChainResponseType;
  public readonly Data: T;
  public readonly Hash?: string;

  constructor(data: GalaChainSuccessResponse<T>, hash?: string) {
    this.Hash = hash;
    this.Status = data.Status;
    this.Data = data.Data;
  }
}

export class GalaChainResponseError<T> {
  public readonly Error: string;
  public readonly Message: string;
  public readonly ErrorCode: number;

  constructor(data: GalaChainError<T>) {
    if (typeof data.error === "string" || !data.error) {
      this.Error = data.error;
      this.Message = data.message;
      this.ErrorCode = data.statusCode ?? 500;
    } else {
      this.Error = data.error.ErrorKey;
      this.Message = data.message;
      this.ErrorCode = data.error.ErrorCode;
    }
  }
}
