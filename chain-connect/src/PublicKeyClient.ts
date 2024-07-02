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

import { GalachainConnectClient } from "./GalachainConnectClient";

export class PublicKeyClient {
  constructor(
    private client: GalachainConnectClient,
    private url: string
  ) {}

  public GetMyProfile(dto: GetMyProfileDto) {
    return this.client.send<UserProfile, GetMyProfileDto>({
      url: this.url,
      method: "GetMyProfile",
      payload: dto,
      sign: true
    });
  }

  public RegisterUser(dto: RegisterUserDto) {
    return this.client.send<string, RegisterUserDto>({
      url: this.url,
      method: "RegisterUser",
      payload: dto,
      sign: true
    });
  }

  public RegisterEthUser(dto: RegisterEthUserDto) {
    return this.client.send<string, RegisterEthUserDto>({
      url: this.url,
      method: "RegisterEthUser",
      payload: dto,
      sign: true
    });
  }

  public UpdatePublicKey(dto: UpdatePublicKeyDto) {
    return this.client.send<void, UpdatePublicKeyDto>({
      url: this.url,
      method: "UpdatePublicKey",
      payload: dto,
      sign: true
    });
  }
}
