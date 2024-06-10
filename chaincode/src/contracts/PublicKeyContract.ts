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
  ChainCallDTO,
  ChainError,
  ErrorCode,
  GalaChainResponse,
  GetMyProfileDto,
  GetPublicKeyDto,
  NotFoundError,
  NotImplementedError,
  PublicKey,
  RegisterEthUserDto,
  RegisterUserDto,
  UpdatePublicKeyDto,
  UserProfile,
  ValidationFailedError,
  signatures
} from "@gala-chain/api";
import { Info } from "fabric-contract-api";

import { PublicKeyService } from "../services";
import { PkMismatchError, PkNotFoundError, ProfileExistsError } from "../services/PublicKeyError";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, GalaTransaction, SUBMIT } from "./GalaTransaction";

let version = "0.0.0";

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version = require("../../../package.json").version;
} catch (e) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version = require("../../package.json").version;
}

const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

@Info({
  title: "PublicKeyContract",
  description: "Contract for managing public keys for accounts"
})
export class PublicKeyContract extends GalaContract {
  constructor() {
    super("PublicKeyContract", version);
  }

  private async registerUser(
    ctx: GalaChainContext,
    providedPkHex: string,
    ethAddress: string,
    userAlias: string
  ): Promise<GalaChainResponse<string>> {
    const currPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);

    // If we are migrating a legacy user to new flow, the public key should match
    if (currPublicKey !== undefined) {
      const nonCompactCurrPubKey = signatures.getNonCompactHexPublicKey(currPublicKey.publicKey);
      if (nonCompactCurrPubKey !== providedPkHex) {
        throw new PkMismatchError(userAlias);
      }
    }

    // If User Profile already exists on chain for this ethereum address, we should not allow registering the same user again
    const existingUserProfile = await PublicKeyService.getUserProfile(ctx, ethAddress);
    if (existingUserProfile !== undefined) {
      throw new ProfileExistsError(ethAddress, existingUserProfile.alias);
    }

    // supports legacy flow (required for backwards compatibility)
    await PublicKeyService.putPublicKey(ctx, providedPkHex, userAlias);

    // for the new flow, we need to store the user profile separately
    await PublicKeyService.putUserProfile(ctx, ethAddress, userAlias);

    return GalaChainResponse.Success(userAlias);
  }

  private async updatePublicKey(
    ctx: GalaChainContext,
    newPkHex: string,
    newEthAddress: string
  ): Promise<void> {
    const userAlias = ctx.callingUser;

    // fetch old public key for finding old user profile
    const oldPublicKey = await PublicKeyService.getPublicKey(ctx, ctx.callingUser);
    if (oldPublicKey === undefined) {
      throw new PkNotFoundError(userAlias);
    }

    // need to fetch userProfile from old address
    const oldNonCompactPublicKey = signatures.getNonCompactHexPublicKey(oldPublicKey.publicKey);
    const oldEthAddress = signatures.getEthAddress(oldNonCompactPublicKey);
    const userProfile = await PublicKeyService.getUserProfile(ctx, oldEthAddress);

    // Note: we don't throw an error if userProfile is undefined in order to support legacy users with unsaved profiles
    if (userProfile !== undefined) {
      // remove old user profile
      await PublicKeyService.deleteUserProfile(ctx, oldEthAddress);
    }

    // update Public Key, and add user profile under new eth address
    await PublicKeyService.putPublicKey(ctx, newPkHex, userAlias);
    await PublicKeyService.putUserProfile(ctx, newEthAddress, userAlias);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetMyProfileDto,
    verifySignature: true,
    description:
      "Returns profile for the calling user. " +
      "Since the profile contains also eth address of the user, this method is supported only for signature based authentication."
  })
  public async GetMyProfile(
    ctx: GalaChainContext,
    dto: GetMyProfileDto
  ): Promise<GalaChainResponse<UserProfile>> {
    const ethAddress = await new Promise<string>((resolve) => resolve(ctx.callingUserEthAddress)).catch(
      (e) => {
        const newError = new NotImplementedError("Function is not supported for legacy auth");
        throw ChainError.map(e, ErrorCode.UNAUTHORIZED, newError);
      }
    );
    const profile = await PublicKeyService.getUserProfile(ctx, ethAddress);

    if (profile === undefined) {
      throw new NotFoundError(`UserProfile not found for ${ctx.callingUser}`, {
        signature: dto.signature,
        user: ctx.callingUser
      });
    }

    return GalaChainResponse.Success(profile);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: RegisterUserDto,
    out: "string",
    description: "Registers a new user on chain under provided user alias.",
    allowedOrgs: [curatorOrgMsp],
    verifySignature: true
  })
  public async RegisterUser(ctx: GalaChainContext, dto: RegisterUserDto): Promise<GalaChainResponse<string>> {
    if (!dto.user.startsWith("client|")) {
      const message = `User alias should start with 'client|', but got: ${dto.user}`;
      throw new ValidationFailedError(message);
    }

    const providedPkHex = signatures.getNonCompactHexPublicKey(dto.publicKey);
    const ethAddress = signatures.getEthAddress(providedPkHex);
    const userAlias = dto.user;

    return this.registerUser(ctx, providedPkHex, ethAddress, userAlias);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: RegisterEthUserDto,
    out: "string",
    description: "Registers a new user on chain under alias derived from eth address.",
    allowedOrgs: [curatorOrgMsp],
    verifySignature: true
  })
  public async RegisterEthUser(
    ctx: GalaChainContext,
    dto: RegisterEthUserDto
  ): Promise<GalaChainResponse<string>> {
    const providedPkHex = signatures.getNonCompactHexPublicKey(dto.publicKey);
    const ethAddress = signatures.getEthAddress(providedPkHex);
    const userAlias = `eth|${ethAddress}`;

    return this.registerUser(ctx, providedPkHex, ethAddress, userAlias);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: UpdatePublicKeyDto,
    description: "Updates public key for the calling user.",
    verifySignature: true
  })
  public async UpdatePublicKey(
    ctx: GalaChainContext,
    dto: UpdatePublicKeyDto
  ): Promise<GalaChainResponse<void>> {
    const providedPkHex = signatures.getNonCompactHexPublicKey(dto.publicKey);
    const ethAddress = signatures.getEthAddress(providedPkHex);

    await this.updatePublicKey(ctx, providedPkHex, ethAddress);

    return GalaChainResponse.Success(undefined);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPublicKeyDto,
    out: PublicKey,
    description: "[Deprecated] Returns public key for the user"
  })
  public async GetPublicKey(
    ctx: GalaChainContext,
    dto: GetPublicKeyDto
  ): Promise<GalaChainResponse<PublicKey>> {
    const user = dto.user ?? ctx.callingUser;
    const publicKey = await PublicKeyService.getPublicKey(ctx, user);

    if (publicKey === undefined) {
      throw new PkNotFoundError(user);
    }

    return GalaChainResponse.Success(publicKey);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ChainCallDTO,
    description:
      "Verifies signature of the DTO signed with caller's private key to be verified with user's public key saved on chain.",
    verifySignature: true
  })
  public async VerifySignature(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: GalaChainContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dto: ChainCallDTO
  ): Promise<GalaChainResponse<void>> {
    // do nothing - verification is handled by @GalaTransaction decorator
    return GalaChainResponse.Success(undefined);
  }
}
