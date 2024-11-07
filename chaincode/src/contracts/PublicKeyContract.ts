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
  GalaChainResponse,
  GetMyProfileDto,
  GetPublicKeyDto,
  NotFoundError,
  PublicKey,
  RegisterEthUserDto,
  RegisterTonUserDto,
  RegisterUserDto,
  SigningScheme,
  UpdatePublicKeyDto,
  UpdateUserRolesDto,
  UserAlias,
  UserProfile,
  UserRole,
  ValidationFailedError,
  signatures
} from "@gala-chain/api";
import { Info } from "fabric-contract-api";

import { PublicKeyService } from "../services";
import { PkNotFoundError } from "../services/PublicKeyError";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, Evaluate, GalaTransaction, Submit } from "./GalaTransaction";

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

  @Evaluate({
    in: GetMyProfileDto,
    description:
      "Returns profile for the calling user. " +
      "Since the profile contains also eth address of the user, this method is supported only for signature based authentication."
  })
  public async GetMyProfile(ctx: GalaChainContext, dto: GetMyProfileDto): Promise<UserProfile> {
    // will throw error for legacy auth if the addr is missing
    const address = dto.signing === SigningScheme.TON ? ctx.callingUserTonAddress : ctx.callingUserEthAddress;
    const profile = await PublicKeyService.getUserProfile(ctx, address);

    if (profile === undefined) {
      throw new NotFoundError(`UserProfile not found for ${ctx.callingUser}`, {
        signature: dto.signature,
        user: ctx.callingUser
      });
    }

    return profile;
  }

  @Submit({
    in: RegisterUserDto,
    out: "string",
    description: "Registers a new user on chain under provided user alias.",
    allowedOrgs: [curatorOrgMsp]
  })
  public async RegisterUser(ctx: GalaChainContext, dto: RegisterUserDto): Promise<string> {
    if (!dto.user.startsWith("client|")) {
      const message = `User alias should start with 'client|', but got: ${dto.user}`;
      throw new ValidationFailedError(message);
    }

    const providedPkHex = signatures.getNonCompactHexPublicKey(dto.publicKey);
    const ethAddress = signatures.getEthAddress(providedPkHex);
    const userAlias = dto.user;

    return PublicKeyService.registerUser(ctx, providedPkHex, ethAddress, userAlias, SigningScheme.ETH);
  }

  @Submit({
    in: RegisterEthUserDto,
    out: "string",
    description: "Registers a new user on chain under alias derived from eth address.",
    allowedOrgs: [curatorOrgMsp]
  })
  public async RegisterEthUser(ctx: GalaChainContext, dto: RegisterEthUserDto): Promise<string> {
    const providedPkHex = signatures.getNonCompactHexPublicKey(dto.publicKey);
    const ethAddress = signatures.getEthAddress(providedPkHex);
    const userAlias = `eth|${ethAddress}` as UserAlias;

    return PublicKeyService.registerUser(ctx, providedPkHex, ethAddress, userAlias, SigningScheme.ETH);
  }

  @Submit({
    in: RegisterTonUserDto,
    out: "string",
    description: "Registers a new user on chain under alias derived from TON address.",
    allowedOrgs: [curatorOrgMsp]
  })
  public async RegisterTonUser(ctx: GalaChainContext, dto: RegisterTonUserDto): Promise<string> {
    const publicKey = dto.publicKey;
    const address = signatures.ton.getTonAddress(Buffer.from(publicKey, "base64"));
    const userAlias = `ton|${address}` as UserAlias;

    return PublicKeyService.registerUser(ctx, publicKey, address, userAlias, SigningScheme.TON);
  }

  @Submit({
    in: UpdateUserRolesDto,
    description: "Updates roles for the user with alias provided in DTO.",
    allowedRoles: [UserRole.CURATOR]
  })
  public async UpdateUserRoles(ctx: GalaChainContext, dto: UpdateUserRolesDto): Promise<void> {
    await PublicKeyService.updateUserRoles(ctx, dto.user, dto.roles);
  }

  @Submit({
    in: UpdatePublicKeyDto,
    description: "Updates public key for the calling user."
  })
  public async UpdatePublicKey(ctx: GalaChainContext, dto: UpdatePublicKeyDto): Promise<void> {
    const signing = dto.signing ?? SigningScheme.ETH;
    const address = PublicKeyService.getUserAddress(dto.publicKey, signing);
    await PublicKeyService.updatePublicKey(ctx, dto.publicKey, address, signing);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPublicKeyDto,
    out: PublicKey,
    description: "Returns public key for the user"
  })
  public async GetPublicKey(ctx: GalaChainContext, dto: GetPublicKeyDto): Promise<PublicKey> {
    const user = dto.user ?? ctx.callingUser;
    const publicKey = await PublicKeyService.getPublicKey(ctx, user);

    if (publicKey === undefined) {
      throw new PkNotFoundError(user);
    }

    return publicKey;
  }

  @Evaluate({
    in: ChainCallDTO,
    description:
      "Verifies signature of the DTO signed with caller's private key to be verified with user's public key saved on chain."
  })
  public async VerifySignature(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: GalaChainContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dto: ChainCallDTO
  ): Promise<void> {
    // do nothing - verification is handled by @GalaTransaction decorator
  }
}
