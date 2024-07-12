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
  GetMyProfileParams,
  RegisterEthUserDto,
  RegisterUserDto,
  RegisterUserParams,
  UpdatePublicKeyDto,
  UpdatePublicKeyParams,
  UserProfileBody
} from "@gala-chain/api";

import { GalachainConnectClient } from "./GalachainConnectClient";

export class PublicKeyClient {
  constructor(private client: GalachainConnectClient) {}

  public GetMyProfile(dto: GetMyProfileParams) {
    return this.client.send<UserProfileBody, GetMyProfileDto>({
      method: "GetMyProfile",
      payload: new GetMyProfileDto(dto),
      sign: true
    });
  }

  public RegisterUser(dto: RegisterUserParams) {
    return this.client.send<string, RegisterUserDto>({
      method: "RegisterUser",
      payload: new RegisterUserDto(dto),
      sign: true
    });
  }

  public RegisterEthUser(dto: RegisterUserParams) {
    return this.client.send<string, RegisterEthUserDto>({
      method: "RegisterEthUser",
      payload: new RegisterEthUserDto(dto),
      sign: true
    });
  }

  public UpdatePublicKey(dto: UpdatePublicKeyParams) {
    return this.client.send<void, UpdatePublicKeyDto>({
      method: "UpdatePublicKey",
      payload: new UpdatePublicKeyDto(dto),
      sign: true
    });
  }
}
