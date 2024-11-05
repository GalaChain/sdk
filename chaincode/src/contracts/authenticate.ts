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

class PublicKeyMismatchError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Public key recovered from signature is different than provided in dto.", { recovered, inDto });
  }
}

class RedundantSignerAddressError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Signer address redundant, when it can be recovered from signature.", { recovered, inDto });
  }
}

class AddressMismatchError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Signer address recovered from signature is different than provided in dto.", { recovered, inDto });
  }
}

class MissingSignerError extends ValidationFailedError {
  constructor(signature: string) {
    super(`Missing signerPublicKey or signerAddress field in dto. Signature: ${signature}`, { signature });
  }
}

class UserNotRegisteredError extends ValidationFailedError {
  constructor(userId: string) {
    super(`User ${userId} is not registered.`, { userId });
  }
}

export interface AuthenticationResult {
  alias: string;
  ethAddress?: string;
  tonAddress?: string;
  roles: string[];
  signedByKeys: string[];
  pubKeyCount: number;
}

/**
 *
 * @param ctx
 * @param dto
 * @returns User alias of the calling user.
 */
export async function authenticate(
  ctx: GalaChainContext,
  dto: ChainCallDTO | undefined
): Promise<AuthenticationResult> {
  const hasSingleSignature = dto?.signature !== undefined;
  const hasMultipleSignatures = !!dto?.signatures?.length;

  if (hasSingleSignature && hasMultipleSignatures) {
    throw new ValidationFailedError("Both signature string and signatures array are present in the dto.");
  }

  if (!hasSingleSignature && !hasMultipleSignatures) {
    throw new MissingSignatureError();
  }

  if (hasSingleSignature) {
    return authenticateSingle(ctx, dto, {
      signature: dto.signature as string,
      prefix: dto.prefix,
      signing: dto.signing,
      signerPublicKey: dto.signerPublicKey,
      signerAddress: dto.signerAddress
    });
  }

  // note: intentionally not using Promise.all here
  const authenticatedUsers: AuthenticationResult[] = [];
  for (const signature of dto.signatures ?? []) {
    authenticatedUsers.push(await authenticateSingle(ctx, dto, signature));
  }

  const uniqueUsers = new Set(authenticatedUsers.map((user) => user.alias));

  if (uniqueUsers.size !== 1) {
    const aliases = Array.from(uniqueUsers).join(", ");
    throw new ValidationFailedError(`Multiple users authenticated in the dto: ${aliases}`);
  }

  const signedByKeys = authenticatedUsers.map((user) => user.signedByKeys).flat();

  const duplicateKeys = signedByKeys.filter((key, index, self) => self.indexOf(key) !== index);

  if (duplicateKeys.length) {
    throw new ValidationFailedError(
      `Duplicate public keys recovered in the dto: ${duplicateKeys.join(", ")}`
    );
  }

  return {
    alias: authenticatedUsers[0].alias,
    ethAddress: authenticatedUsers[0].ethAddress,
    tonAddress: authenticatedUsers[0].tonAddress,
    roles: authenticatedUsers[0].roles,
    signedByKeys,
    pubKeyCount: authenticatedUsers[0].pubKeyCount
  };
}

interface AuthParams {
  signature: string;
  signerPublicKey?: string;
  signerAddress?: string;
  signing?: SigningScheme;
  prefix?: string;
}

export async function authenticateSingle(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  auth: AuthParams
): Promise<AuthenticationResult> {
  const recoveredPkHex = recoverPublicKey(auth.signature, dto, auth.prefix ?? "");

  if (recoveredPkHex !== undefined) {
    if (auth.signerPublicKey !== undefined) {
      const hexKey = signatures.getNonCompactHexPublicKey(auth.signerPublicKey);
      if (recoveredPkHex !== hexKey) {
        throw new PublicKeyMismatchError(recoveredPkHex, hexKey);
      } else {
        throw new RedundantSignerPublicKeyError(recoveredPkHex, auth.signerPublicKey);
      }
    }
    if (auth.signerAddress !== undefined) {
      const ethAddress = signatures.getEthAddress(recoveredPkHex);
      if (auth.signerAddress !== ethAddress) {
        throw new AddressMismatchError(ethAddress, auth.signerAddress);
      } else {
        throw new RedundantSignerAddressError(ethAddress, auth.signerAddress);
      }
    }
    const profile = await getUserProfile(ctx, recoveredPkHex, auth.signing ?? SigningScheme.ETH); // new flow only
    return {
      alias: profile.alias,
      ethAddress: profile.ethAddress,
      tonAddress: profile.tonAddress,
      roles: profile.roles,
      signedByKeys: [recoveredPkHex],
      pubKeyCount: profile.pubKeyCount ?? 1 // legacy profiles do not have this field
    };
  } else if (auth.signerAddress !== undefined) {
    if (auth.signerPublicKey !== undefined) {
      throw new RedundantSignerPublicKeyError(auth.signerAddress, auth.signerPublicKey);
    }

    const { profile, publicKey } = await getUserProfileAndPublicKey(ctx, auth.signerAddress);

    if (!dto.isSignatureValid(publicKey.publicKey)) {
      throw new PkInvalidSignatureError(profile.alias);
    }

    return {
      alias: profile.alias,
      ethAddress: profile.ethAddress,
      tonAddress: profile.tonAddress,
      roles: profile.roles,
      signedByKeys: [signatures.getNonCompactHexPublicKey(publicKey.publicKey)],
      pubKeyCount: profile.pubKeyCount ?? 1 // legacy profiles do not have this field
    };
  } else if (auth.signerPublicKey !== undefined) {
    if (!dto.isSignatureValid(auth.signerPublicKey)) {
      const address = PublicKeyService.getUserAddress(
        auth.signerPublicKey,
        auth.signing ?? SigningScheme.ETH
      );
      throw new PkInvalidSignatureError(address);
    }

    const profile = await getUserProfile(ctx, auth.signerPublicKey, auth.signing ?? SigningScheme.ETH); // new flow only

    return {
      alias: profile.alias,
      ethAddress: profile.ethAddress,
      tonAddress: profile.tonAddress,
      roles: profile.roles,
      signedByKeys: [signatures.getNonCompactHexPublicKey(auth.signerPublicKey)],
      pubKeyCount: profile.pubKeyCount ?? 1 // legacy profiles do not have this field
    };
  } else {
    throw new MissingSignerError(auth.signature);
  }
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

export async function ensureIsAuthenticatedBy(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  expectedAlias: string
): Promise<{ alias: string; ethAddress?: string }> {
  const user = await authenticate(ctx, dto);

  if (user.alias !== expectedAlias) {
    throw new ForbiddenError(`Dto is authenticated by ${user.alias}, and not by ${expectedAlias}`, {
      authorized: user
    });
  }

  return user;
}
