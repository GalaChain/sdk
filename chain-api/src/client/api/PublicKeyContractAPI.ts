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
  GalaChainResponse,
  GetMyProfileDto,
  RegisterEthUserDto,
  RegisterUserDto,
  UpdatePublicKeyDto,
  UserProfile,
} from "../../types";
import { ChainClient } from "../generic";
import { CommonContractAPI, commonContractAPI } from "./CommonContractAPI";

export interface PublicKeyContractAPI extends CommonContractAPI {
  UpdatePublicKey(dto: UpdatePublicKeyDto): Promise<GalaChainResponse<void>>;
  RegisterUser(dto: RegisterUserDto): Promise<GalaChainResponse<string>>;
  RegisterEthUser(dto: RegisterEthUserDto): Promise<GalaChainResponse<string>>;
  GetMyProfile(dto: GetMyProfileDto): Promise<GalaChainResponse<UserProfile>>;
}

export const publicKeyContractAPI = (client: ChainClient): PublicKeyContractAPI => ({
  ...commonContractAPI(client),

  RegisterUser(dto: RegisterUserDto) {
    return client.submitTransaction("RegisterUser", dto) as Promise<GalaChainResponse<string>>;
  },

  RegisterEthUser(dto: RegisterEthUserDto) {
    return client.submitTransaction("RegisterEthUser", dto) as Promise<GalaChainResponse<string>>;
  },

  UpdatePublicKey(dto: UpdatePublicKeyDto) {
    return client.submitTransaction("UpdatePublicKey", dto) as Promise<GalaChainResponse<void>>;
  },

  GetMyProfile(dto: GetMyProfileDto) {
    return client.evaluateTransaction("GetMyProfile", dto, UserProfile);
  }
});
