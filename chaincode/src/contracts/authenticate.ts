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
  NotFoundError,
  PublicKey,
  signatures,
  UserProfile,
  UserRole,
  ValidationFailedError
} from "@gala-chain/api";

import { PkInvalidSignatureError, PublicKeyService } from "../services";
import { GalaChainContext } from "../types";

class MissingSignatureError extends ValidationFailedError {
  constructor() {
    super("Signature is missing.");
  }
}

class RedundantSignerPublicKeyError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Public key is redundant, when it can be recovered from signature.", { recovered, inDto });
  }
}

class UserNotRegisteredError extends ValidationFailedError {
  constructor(userId: string) {
    super(`User ${userId} is not registered.`, { userId });
  }
}

class PkNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super(`Public key for user ${userId} not found.`, { userId });
  }
}

/**
 *
 * @param ctx
 * @param dto
 * @param legacyCAUser fallback user alias to use then the new flow is not applicable
 * @returns User alias of the calling user.
 */
export async function authenticate(
  ctx: GalaChainContext,
  dto: ChainCallDTO | undefined,
  legacyCAUser: string
): Promise<{ alias: string; ethAddress?: string; roles: string[] }> {
  if (!dto || dto.signature === undefined) {
    throw new MissingSignatureError();
  }

  const recoveredPkHex = recoverPublicKey(dto.signature, dto, dto.prefix ?? "");

  if (recoveredPkHex !== undefined) {
    if (dto.signerPublicKey !== undefined) {
      throw new RedundantSignerPublicKeyError(recoveredPkHex, dto.signerPublicKey);
    }
    return await getUserProfile(ctx, recoveredPkHex); // new flow only
  } else if (dto.signerPublicKey !== undefined) {
    const providedPkHex = signatures.getNonCompactHexPublicKey(dto.signerPublicKey);
    const ethAddress = signatures.getEthAddress(providedPkHex);

    if (!dto.isSignatureValid(providedPkHex)) {
      throw new PkInvalidSignatureError(`eth|${ethAddress}`);
    }

    return await getUserProfile(ctx, providedPkHex); // new flow only
  } else {
    return await legacyAuthenticate(ctx, dto, legacyCAUser); // legacy flow only
  }
}

export async function ensureIsAuthenticatedBy(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  userAlias: string
): Promise<{ alias: string; ethAddress?: string }> {
  const authenticated = await authenticate(ctx, dto, userAlias);

  if (authenticated.alias !== userAlias) {
    throw new ForbiddenError(`Dto is authenticated by ${authenticated}, and not by ${userAlias}`, { authenticated });
  }

  return authenticated;
}

async function getUserProfile(ctx: GalaChainContext, pkHex: string): Promise<UserProfile> {
  const ethAddress = signatures.getEthAddress(pkHex);
  const profile = await PublicKeyService.getUserProfile(ctx, ethAddress);

  if (profile === undefined) {
    throw new UserNotRegisteredError(ethAddress);
  }

  return profile;
}

async function legacyAuthenticate(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  legacyCAUser: string
): Promise<{ alias: string; ethAddress: undefined; roles: string[] }> {
  const pk = await getSavedPKOrReject(ctx, legacyCAUser);

  if (!dto.isSignatureValid(pk.publicKey)) {
    throw new PkInvalidSignatureError(legacyCAUser);
  }

  return {
    alias: legacyCAUser,
    ethAddress: undefined,
    roles: [UserRole.EVALUATE] // read-only
  };
}

function recoverPublicKey(signature: string, dto: ChainCallDTO, prefix = ""): string | undefined {
  try {
    return signatures.recoverPublicKey(signature, dto, prefix);
  } catch (err) {
    return undefined;
  }
}

async function getSavedPKOrReject(ctx: GalaChainContext, userId: string): Promise<PublicKey> {
  const publicKey = await PublicKeyService.getPublicKey(ctx, userId);

  if (publicKey === undefined) {
    throw new PkNotFoundError(userId);
  }

  return publicKey;
}
