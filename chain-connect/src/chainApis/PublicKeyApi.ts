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
  GetMyProfileDto,
  RegisterEthUserDto,
  RegisterUserDto,
  UpdatePublicKeyDto,
  UserProfile
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { GalaChainProvider } from "../GalaChainClient";
import { RegisterEthUserRequest, RegisterUserRequest, UpdatePublicKeyRequest } from "../types";
import { GalaChainBaseApi } from "./GalaChainBaseApi";

export class PublicKeyApi extends GalaChainBaseApi {
  constructor(chainCodeUrl: string, connection: GalaChainProvider) {
    super(chainCodeUrl, connection);
  }

  // PublicKey Chaincode calls:
  public GetMyProfile(message?: string, signature?: string) {
    return this.connection.submit<UserProfile, GetMyProfileDto>({
      method: "GetMyProfile",
      payload: plainToInstance(GetMyProfileDto, {
        ...(message ? { message } : {}),
        ...(signature ? { signature } : {})
      }),
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public RegisterUser(dto: RegisterUserRequest) {
    return this.connection.submit<string, RegisterUserDto>({
      method: "RegisterUser",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: RegisterUserDto
    });
  }

  public RegisterEthUser(dto: RegisterEthUserRequest) {
    return this.connection.submit<string, RegisterEthUserDto>({
      method: "RegisterEthUser",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: RegisterEthUserDto
    });
  }

  public UpdatePublicKey(dto: UpdatePublicKeyRequest) {
    return this.connection.submit<void, UpdatePublicKeyDto>({
      method: "UpdatePublicKey",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: UpdatePublicKeyDto
    });
  }
}
