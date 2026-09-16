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
import { ChainClient } from "../generic/ChainClient";
import { Serializable } from "../generic/types";
import { GalaChainResponse } from "../wire/response";
import { serialize } from "../wire/serialize";
import { CommonContractAPI, commonContractAPI } from "./commonContractAPI";

export interface PublicKeyContractAPI extends CommonContractAPI {
  GetPublicKey(user?: string | Serializable): Promise<GalaChainResponse<Record<string, unknown>>>;
  UpdatePublicKey(dto: Serializable): Promise<GalaChainResponse<void>>;
  RegisterUser(dto: Serializable): Promise<GalaChainResponse<string>>;
  GetMyProfile(dto: Serializable): Promise<GalaChainResponse<Record<string, unknown>>>;
}

function asDto(plain: Record<string, unknown>): Serializable {
  return { serialize: () => serialize(plain) };
}

export const publicKeyContractAPI = (client: ChainClient): PublicKeyContractAPI => ({
  ...commonContractAPI(client),

  GetPublicKey(user?: string | Serializable) {
    const dto = typeof user === "string" ? asDto({ user }) : user ?? asDto({});
    return client.evaluateTransaction("GetPublicKey", dto) as Promise<
      GalaChainResponse<Record<string, unknown>>
    >;
  },

  RegisterUser(dto: Serializable) {
    return client.submitTransaction("RegisterUser", dto) as Promise<GalaChainResponse<string>>;
  },

  UpdatePublicKey(dto: Serializable) {
    return client.submitTransaction("UpdatePublicKey", dto) as Promise<GalaChainResponse<void>>;
  },

  GetMyProfile(dto: Serializable) {
    return client.evaluateTransaction("GetMyProfile", dto) as Promise<
      GalaChainResponse<Record<string, unknown>>
    >;
  }
});
