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
  ForbiddenError,
  PublicKey,
  SigningScheme,
  UserProfile,
  ValidationFailedError,
  signatures
} from "@gala-chain/api";

import { PkInvalidSignatureError, PublicKeyService } from "../services";
import { PkMissingError } from "../services/PublicKeyError";
import { GalaChainContext } from "../types";

class MissingSignatureError extends ValidationFailedError {
  constructor() {
    super("Signature is missing.");
  }
}

class RedundantSignerPublicKeyError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super(
      "Public key is redundant, when it can be recovered from signature, or when the address is provided.",
      { recovered, inDto }
    );
  }
}

class RedundantSignerAddressError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Signer address redundant, when it can be recovered from signature.", { recovered, inDto });
  }
}

class UserNotRegisteredError extends ValidationFailedError {
  constructor(userId: string) {
    super(`User ${userId} is not registered.`, { userId });
  }
}

class OrganizationNotAllowedError extends ForbiddenError {}

/**
 *
 * @param ctx
 * @param dto
 * @param legacyCAUser fallback user alias to use then the new flow is not applicable
 * @returns User alias of the calling user.
 */
export async function authorize(
  ctx: GalaChainContext,
  dto: ChainCallDTO | undefined,
  legacyCAUser: string
): Promise<{ alias: string; ethAddress?: string }> {
  if (!dto || dto.signature === undefined) {
    throw new MissingSignatureError();
  }

  const recoveredPkHex = recoverPublicKey(dto.signature, dto, dto.prefix ?? "");

  if (recoveredPkHex !== undefined) {
    if (dto.signerPublicKey !== undefined) {
      throw new RedundantSignerPublicKeyError(recoveredPkHex, dto.signerPublicKey);
    }
    if (dto.signerAddress !== undefined) {
      throw new RedundantSignerAddressError(recoveredPkHex, dto.signerAddress);
    }
    return await getUserProfile(ctx, recoveredPkHex, dto.signing ?? SigningScheme.ETH); // new flow only
  } else if (dto.signerAddress !== undefined) {
    if (dto.signerPublicKey !== undefined) {
      throw new RedundantSignerPublicKeyError(dto.signerAddress, dto.signerPublicKey);
    }

    const { profile, publicKey } = await getUserProfileAndPublicKey(ctx, dto.signerAddress);

    if (!dto.isSignatureValid(publicKey.publicKey)) {
      throw new PkInvalidSignatureError(profile.alias);
    }

    return profile;
  } else if (dto.signerPublicKey !== undefined) {
    if (!dto.isSignatureValid(dto.signerPublicKey)) {
      const providedPkHex = signatures.getNonCompactHexPublicKey(dto.signerPublicKey);
      const ethAddress = signatures.getEthAddress(providedPkHex);
      throw new PkInvalidSignatureError(`eth|${ethAddress}`);
    }

    return await getUserProfile(ctx, dto.signerPublicKey, dto.signing ?? SigningScheme.ETH); // new flow only
  } else {
    return await legacyAuthorize(ctx, dto, legacyCAUser); // legacy flow only
  }
}

export async function ensureIsAuthorizedBy(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  userAlias: string
): Promise<{ alias: string; ethAddress?: string }> {
  const authorized = await authorize(ctx, dto, userAlias);

  if (authorized.alias !== userAlias) {
    throw new ForbiddenError(`Dto is authorized by ${authorized}, and not by ${userAlias}`, { authorized });
  }

  return authorized;
}

async function getUserProfile(
  ctx: GalaChainContext,
  publicKey: string,
  signing: SigningScheme
): Promise<UserProfile> {
  const address = PublicKeyService.getUserAddress(publicKey, signing);
  const profile = await PublicKeyService.getUserProfile(ctx, address);

  if (profile === undefined) {
    throw new UserNotRegisteredError(address);
  }

  return profile;
}

async function getUserProfileAndPublicKey(
  ctx: GalaChainContext,
  address
): Promise<{ profile: UserProfile; publicKey: PublicKey }> {
  const profile = await PublicKeyService.getUserProfile(ctx, address);

  if (profile === undefined) {
    throw new UserNotRegisteredError(address);
  }

  const publicKey = await PublicKeyService.getPublicKey(ctx, profile.alias);

  if (publicKey === undefined) {
    throw new PkMissingError(profile.alias);
  }

  return { profile, publicKey };
}

async function legacyAuthorize(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  legacyCAUser: string
): Promise<{ alias: string; ethAddress: undefined }> {
  const pk = await getSavedPKOrReject(ctx, legacyCAUser);

  if (!dto.isSignatureValid(pk.publicKey)) {
    throw new PkInvalidSignatureError(legacyCAUser);
  }

  return {
    alias: legacyCAUser,
    ethAddress: undefined
  };
}

export function ensureOrganizationIsAllowed(ctx: GalaChainContext, allowedOrgsMSPs: string[] | undefined) {
  const userOrg: string = ctx.clientIdentity.getMSPID();
  const isAllowed = (allowedOrgsMSPs || []).some((o) => o === userOrg);

  if (!isAllowed) {
    const message = `Members of organization ${userOrg} do not have sufficient permissions.`;
    const user = (ctx as { callingUser?: string } | undefined)?.callingUser;
    throw new OrganizationNotAllowedError(message, { user, userOrg });
  }
}

function recoverPublicKey(signature: string, dto: ChainCallDTO, prefix = ""): string | undefined {
  if (dto.signing === SigningScheme.TON) {
    return undefined;
  }

  try {
    return signatures.recoverPublicKey(signature, dto, prefix);
  } catch (err) {
    return undefined;
  }
}

async function getSavedPKOrReject(ctx: GalaChainContext, userId: string): Promise<PublicKey> {
  const publicKey = await PublicKeyService.getPublicKey(ctx, userId);

  if (publicKey === undefined) {
    throw new UserNotRegisteredError(userId);
  }

  return publicKey;
}
