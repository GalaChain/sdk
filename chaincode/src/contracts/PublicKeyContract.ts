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
  AddSignerDto,
  ChainCallDTO,
  GetMyProfileDto,
  GetPublicKeyDto,
  PublicKey,
  RegisterUserDto,
  RemoveSignerDto,
  SubmitCallDTO,
  UpdatePublicKeyDto,
  UpdateQuorumDto,
  UpdateSignersDto,
  UpdateUserRolesDto,
  UserProfile,
  ValidationFailedError
} from "@gala-chain/api";
import { Info } from "fabric-contract-api";

import { PublicKeyService, resolveUserAlias, resolveUserAliases } from "../services";
import { PkNotFoundError } from "../services/PublicKeyError";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, Evaluate, GalaTransaction, Submit } from "./GalaTransaction";
import { requireRegistrarAuth } from "./authorize";

let version = "0.0.0";

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version = require("../../../package.json").version;
} catch (e) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  version = require("../../package.json").version;
}

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async GetMyProfile(ctx: GalaChainContext, dto: GetMyProfileDto): Promise<UserProfile> {
    return ctx.callingUserProfile;
  }

  @Submit({
    in: RegisterUserDto,
    out: "string",
    description: "Registers a new user on chain under provided user alias.",
    ...requireRegistrarAuth
  })
  public async RegisterUser(ctx: GalaChainContext, dto: RegisterUserDto): Promise<string> {
    if (!dto.user.startsWith("client|")) {
      const message = `User alias should start with 'client|', but got: ${dto.user}`;
      throw new ValidationFailedError(message);
    }

    const signerAliases = await Promise.all(
      (dto.signers ?? []).map(async (s) => await resolveUserAlias(ctx, s))
    );

    const signatureQuorum = Math.max(dto.signatureQuorum ?? signerAliases.length ?? 1, 1);

    return PublicKeyService.registerUser(
      ctx,
      dto.publicKey,
      signerAliases.length ? signerAliases : undefined,
      dto.user,
      signatureQuorum,
      dto as ChainCallDTO & { publicKeySignature?: string }
    );
  }

  @Submit({
    in: SubmitCallDTO,
    out: "string",
    description:
      "Registration of eth| users is no longer required. This method will be removed in the future.",
    deprecated: true,
    ...requireRegistrarAuth
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async RegisterEthUser(ctx: GalaChainContext, dto: SubmitCallDTO): Promise<string> {
    return "Registration of eth| users is no longer required.";
  }

  @Submit({
    in: UpdateUserRolesDto,
    description: "Updates roles for the user with alias provided in DTO.",
    ...requireRegistrarAuth
  })
  public async UpdateUserRoles(ctx: GalaChainContext, dto: UpdateUserRolesDto): Promise<void> {
    const user = await resolveUserAlias(ctx, dto.user);
    await PublicKeyService.updateUserRoles(ctx, user, dto.roles);
  }

  @Submit({
    in: UpdatePublicKeyDto,
    description: "Updates public key for the calling user."
  })
  public async UpdatePublicKey(ctx: GalaChainContext, dto: UpdatePublicKeyDto): Promise<void> {
    await PublicKeyService.updatePublicKey(ctx, dto);
  }

  @Submit({
    in: AddSignerDto,
    description: "Adds a signer to the calling user's multisig setup."
  })
  public async AddSigner(ctx: GalaChainContext, dto: AddSignerDto): Promise<void> {
    const signer = await resolveUserAlias(ctx, dto.signer);
    await PublicKeyService.addSigner(ctx, signer);
  }

  @Submit({
    in: RemoveSignerDto,
    description: "Removes a signer from the calling user's multisig setup."
  })
  public async RemoveSigner(ctx: GalaChainContext, dto: RemoveSignerDto): Promise<void> {
    const signer = await resolveUserAlias(ctx, dto.signer);
    await PublicKeyService.removeSigner(ctx, signer);
  }

  @Submit({
    in: UpdateSignersDto,
    description: "Updates signers for the calling user's multisig setup by adding and/or removing signers."
  })
  public async UpdateSigners(ctx: GalaChainContext, dto: UpdateSignersDto): Promise<void> {
    const signersToRemove = await resolveUserAliases(ctx, dto.toRemove);
    const signersToAdd = await resolveUserAliases(ctx, dto.toAdd);

    // Check for conflicts: same signer in both toAdd and toRemove
    const removeSet = new Set(signersToRemove);
    for (const signer of signersToAdd) {
      if (removeSet.has(signer)) {
        throw new ValidationFailedError(`Cannot add and remove the same signer: ${signer}`);
      }
    }

    for (const signer of signersToRemove) {
      await PublicKeyService.removeSigner(ctx, signer);
    }

    for (const signer of signersToAdd) {
      await PublicKeyService.addSigner(ctx, signer);
    }
  }

  @Submit({
    in: UpdateQuorumDto,
    description: "Updates the signature quorum for the calling user's multisig setup."
  })
  public async UpdateQuorum(ctx: GalaChainContext, dto: UpdateQuorumDto): Promise<void> {
    await PublicKeyService.updateQuorum(ctx, dto.quorum);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPublicKeyDto,
    out: PublicKey,
    description: "Returns public key for the user"
  })
  public async GetPublicKey(ctx: GalaChainContext, dto: GetPublicKeyDto): Promise<PublicKey> {
    const user = dto.user ? await resolveUserAlias(ctx, dto.user) : ctx.callingUser;
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
