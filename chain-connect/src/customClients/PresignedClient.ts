/* eslint-disable @typescript-eslint/no-unused-vars */

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
import { GalaChainProvider, GalaChainProviderOptions } from "../GalaChainClient";

/**
 * Use this provider when you simply want to forward presigned requests, or requests that do not require a signature
 */

export class PresignedClient extends GalaChainProvider {
  constructor(options?: GalaChainProviderOptions) {
    super(options);
  }

  public async sign<U extends object>(_method: string, payload: U & { signature: string; prefix?: string }) {
    return payload;
  }
}
