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

/**
 * API client for public key and user profile operations on the GalaChain network.
 * Handles user registration, profile management, and public key updates.
 */
export class PublicKeyApi extends GalaChainBaseApi {
  /**
   * Creates a new PublicKeyApi instance.
   * @param chainCodeUrl - The URL of the public key chaincode service
   * @param connection - The GalaChain provider for network communication
   */
  constructor(chainCodeUrl: string, connection: GalaChainProvider) {
    super(chainCodeUrl, connection);
  }

  // PublicKey Chaincode calls:
  /**
   * Retrieves the current user's profile information.
   * @param message - Optional message for authentication
   * @param signature - Optional signature for the message
   * @returns Promise resolving to the user's profile
   */
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

  /**
   * Registers a new user on the GalaChain network.
   * @param dto - The user registration request data
   * @returns Promise resolving to registration confirmation
   */
  public RegisterUser(dto: RegisterUserRequest) {
    return this.connection.submit<string, RegisterUserDto>({
      method: "RegisterUser",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: RegisterUserDto
    });
  }

  /**
   * Registers a new Ethereum user on the GalaChain network.
   * @param dto - The Ethereum user registration request data
   * @returns Promise resolving to registration confirmation
   */
  public RegisterEthUser(dto: RegisterEthUserRequest) {
    return this.connection.submit<string, RegisterEthUserDto>({
      method: "RegisterEthUser",
      payload: dto,
      sign: true,
      url: this.chainCodeUrl,
      requestConstructor: RegisterEthUserDto
    });
  }

  /**
   * Updates the public key for the current user.
   * @param dto - The public key update request data
   * @returns Promise resolving when the update is complete
   */
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
