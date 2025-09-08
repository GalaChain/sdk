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
  GetPublicKeyDto,
  PublicKey,
  RegisterEthUserDto,
  RegisterUserDto,
  UpdatePublicKeyDto,
  UserProfile,
  asValidUserRef
} from "../../types";
import { ChainClient } from "../generic";
import { CommonContractAPI, commonContractAPI } from "./CommonContractAPI";

export interface PublicKeyContractAPI extends CommonContractAPI {
  GetPublicKey(user?: string | GetPublicKeyDto): Promise<GalaChainResponse<PublicKey>>;
  UpdatePublicKey(dto: UpdatePublicKeyDto): Promise<GalaChainResponse<void>>;
  RegisterUser(dto: RegisterUserDto): Promise<GalaChainResponse<string>>;
  RegisterEthUser(dto: RegisterEthUserDto): Promise<GalaChainResponse<string>>;
  GetMyProfile(dto: GetMyProfileDto): Promise<GalaChainResponse<UserProfile>>;
}

export const publicKeyContractAPI = (client: ChainClient): PublicKeyContractAPI => ({
  ...commonContractAPI(client),

  GetPublicKey(user?: string | GetPublicKeyDto) {
    if (typeof user === "string") {
      const dto = new GetPublicKeyDto();
      dto.user = asValidUserRef(user);
      return client.evaluateTransaction("GetPublicKey", dto, PublicKey);
    } else {
      return client.evaluateTransaction("GetPublicKey", user ?? new GetPublicKeyDto(), PublicKey);
    }
  },

  RegisterUser(dto: RegisterUserDto) {
    const payload = Object.assign(new RegisterUserDto(), dto);
    return client.submitTransaction("RegisterUser", payload) as Promise<GalaChainResponse<string>>;
  },

  RegisterEthUser(dto: RegisterEthUserDto) {
    const payload = Object.assign(new RegisterEthUserDto(), dto);
    return client.submitTransaction("RegisterEthUser", payload) as Promise<GalaChainResponse<string>>;
  },

  UpdatePublicKey(dto: UpdatePublicKeyDto) {
    return client.submitTransaction("UpdatePublicKey", dto) as Promise<GalaChainResponse<void>>;
  },

  GetMyProfile(dto: GetMyProfileDto) {
    return client.evaluateTransaction("GetMyProfile", dto, UserProfile);
  }
});
