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
  satusCode?: number;
}

export class GalaChainResponseSuccess<T> {
  public readonly status: GalaChainResponseType;
  public readonly data: T;
  public readonly hash?: string;

  constructor(data: GalaChainSuccessResponse<T>, hash?: string) {
    this.hash = hash;
    this.status = data.Status;
    this.data = data.Data;
  }
}

export class GalaChainResponseError<T> {
  public readonly error: string;
  public readonly message: string;
  public readonly errorCode: number;

  constructor(data: GalaChainError<T>) {
    if(typeof data.error === 'string') {
      this.error = data.error;
      this.message = data.message;
      this.errorCode = data.satusCode ?? 500;
    } else {
      this.error = data.error.ErrorKey;
      this.message = data.message;
      this.errorCode = data.error.ErrorCode;
    }
  }
}