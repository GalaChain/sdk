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
import { RegisterUserParams, UpdatePublicKeyParams, UserProfileBody } from "@gala-chain/api";

import { CustomClient } from "../GalachainClient";

export class PublicKeyApi {
  constructor(
    private chainCodeUrl: string,
    private connection: CustomClient
  ) {}

  // PublicKey Chaincode calls:
  public GetMyProfile(message?: string) {
    return this.connection.submit<UserProfileBody, { message?: string }>({
      method: "GetMyProfile",
      payload: { message },
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public RegisterUser(dto: RegisterUserParams) {
    return this.connection.submit<string, RegisterUserParams>({
      method: "RegisterUser",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public RegisterEthUser(dto: RegisterUserParams) {
    return this.connection.submit<string, RegisterUserParams>({
      method: "RegisterEthUser",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }

  public UpdatePublicKey(dto: UpdatePublicKeyParams) {
    return this.connection.submit<void, UpdatePublicKeyParams>({
      method: "UpdatePublicKey",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl
    });
  }
}
