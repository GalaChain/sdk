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
  UnauthorizedError,
  UserProfileStrict,
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

class InvalidSignatureParametersError extends ValidationFailedError {
  constructor(dto: ChainCallDTO | undefined) {
    super(
      `Invalid multisig parameters. A single signature string, or an array of at least 2 signatures is expected, ` +
        `but got 'signature': ${dto?.signature} and 'multisig': ${dto?.multisig}`
    );
  }
}

class MultipleSignaturesNotAllowedError extends ValidationFailedError {
  constructor() {
    super(
      `Multiple signatures are not allowed when signing is not ETH, or when signerAddress or signerPublicKey or prefix is provided.`
    );
  }
}

class CannotRecoverPublicKeyError extends ValidationFailedError {
  constructor(index: number, signature: string) {
    super(`Cannot recover public key from signature: ${signature}.`, { index, signature });
  }
}

class DuplicateSignerPublicKeyError extends ValidationFailedError {
  constructor(signedByKeys: string[]) {
    super(`Duplicate signer public key in: ${signedByKeys.join(", ")}.`, { signedByKeys });
  }
}

class UserProfileMismatchError extends ValidationFailedError {
  constructor(info: string, expectedInfo: string) {
    super(`User profile mismatch. Expected: ${expectedInfo}. Got: ${info}.`, { info, expectedInfo });
  }
}

class RedundantSignerPublicKeyError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super(
      "Public key is redundant when it can be recovered from the signature, or when the address is provided.",
      {
        recovered,
        inDto
      }
    );
  }
}

class PublicKeyMismatchError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Public key recovered from signature is different from the one provided in dto.", {
      recovered,
      inDto
    });
  }
}

class RedundantSignerAddressError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Signer address is redundant when it can be recovered from the signature.", {
      recovered,
      inDto
    });
  }
}

class AddressMismatchError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Signer address recovered from signature is different from the one provided in dto.", {
      recovered,
      inDto
    });
  }
}

class MissingSignerError extends ValidationFailedError {
  constructor(signature: string) {
    super(`Missing signerPublicKey or signerAddress field in dto. Signature: ${signature}.`, { signature });
  }
}

class UserNotRegisteredError extends ValidationFailedError {
  constructor(userId: string) {
    super(`User ${userId} is not registered.`, { userId });
  }
}

export class ChaincodeAuthorizationError extends ForbiddenError {}

export interface AuthenticateResult {
  alias: string;
  ethAddress?: string;
  tonAddress?: string;
  roles: string[];
  signedByKeys: string[];
  signatureQuorum: number;
}

/**
 *
 * @param ctx
 * @param dto
 * @returns User alias of the calling user.
 */
export async function authenticate(
  ctx: GalaChainContext,
  dto: ChainCallDTO | undefined,
  quorum: number | undefined
): Promise<AuthenticateResult> {
  if (noSignatures(dto)) {
    if (dto?.signerAddress?.startsWith("service|")) {
      return await authenticateAsOriginChaincode(ctx, dto, dto.signerAddress.slice(8));
    }

    throw new MissingSignatureError();
  }

  if (singleSignature(dto)) {
    const result = await authenticateSingleSignature(ctx, dto);
    ensureSignatureQuorumIsMet(result, quorum);
    return result;
  }

  if (multipleSignatures(dto)) {
    const result = await authenticateMultipleSignatures(ctx, dto);
    ensureSignatureQuorumIsMet(result, quorum);
    return result;
  }

  throw new InvalidSignatureParametersError(dto);
}

export async function authenticateSingleSignature(
  ctx: GalaChainContext,
  dto: ChainCallDTO & { signature: string }
): Promise<AuthenticateResult> {
  const signing = dto.signing ?? SigningScheme.ETH;
  const recoveredPkHex = recoverPublicKey(dto.signature, dto, dto.prefix ?? "");

  if (recoveredPkHex !== undefined) {
    if (dto.signerPublicKey !== undefined) {
      const hexKey = signatures.getNonCompactHexPublicKey(dto.signerPublicKey);
      if (recoveredPkHex !== hexKey) {
        throw new PublicKeyMismatchError(recoveredPkHex, hexKey);
      } else {
        throw new RedundantSignerPublicKeyError(recoveredPkHex, dto.signerPublicKey);
      }
    }
    if (dto.signerAddress !== undefined) {
      const ethAddress = signatures.getEthAddress(recoveredPkHex);
      if (dto.signerAddress !== ethAddress) {
        throw new AddressMismatchError(ethAddress, dto.signerAddress);
      } else {
        throw new RedundantSignerAddressError(ethAddress, dto.signerAddress);
      }
    }

    const p = await getUserProfile(ctx, recoveredPkHex, signing);
    return singleSignAuthResult(p, recoveredPkHex);
  } else if (dto.signerAddress !== undefined) {
    if (dto.signerPublicKey !== undefined) {
      throw new RedundantSignerPublicKeyError(dto.signerAddress, dto.signerPublicKey);
    }

    const resp = await getUserProfileAndPublicKey(ctx, dto.signerAddress, signing);

    if (!dto.isSignatureValid(resp.matchedKey)) {
      throw new PkInvalidSignatureError(resp.profile.alias);
    }

    return singleSignAuthResult(resp.profile, resp.matchedKey);
  } else if (dto.signerPublicKey !== undefined) {
    if (!dto.isSignatureValid(dto.signerPublicKey)) {
      const address = PublicKeyService.getUserAddress(dto.signerPublicKey, signing);
      throw new PkInvalidSignatureError(address);
    }

    const p = await getUserProfile(ctx, dto.signerPublicKey, signing);
    return singleSignAuthResult(p, dto.signerPublicKey);
  } else {
    throw new MissingSignerError(dto.signature);
  }
}

async function authenticateMultipleSignatures(
  ctx: GalaChainContext,
  dto: ChainCallDTO & { multisig: string[] }
): Promise<AuthenticateResult> {
  const signing = dto.signing ?? SigningScheme.ETH;

  if (
    signing !== SigningScheme.ETH ||
    dto.signerAddress !== undefined ||
    dto.signerPublicKey !== undefined ||
    dto.prefix !== undefined
  ) {
    throw new MultipleSignaturesNotAllowedError();
  }

  const profileEntries: [string, UserProfileStrict][] = [];

  for (const [index, signature] of dto.multisig.entries()) {
    const recoveredPkHex = recoverPublicKey(signature, dto, dto.prefix ?? "");
    if (recoveredPkHex === undefined) {
      throw new CannotRecoverPublicKeyError(index, signature);
    }
    const profile = await getUserProfile(ctx, recoveredPkHex, signing);
    profileEntries.push([recoveredPkHex, profile]);
  }

  const signedByKeys = profileEntries.map((p) => p[0]);
  const keySet = new Set(signedByKeys);
  if (keySet.size !== signedByKeys.length) {
    throw new DuplicateSignerPublicKeyError(signedByKeys);
  }

  const firstProfileEntry = profileEntries[0];

  if (!firstProfileEntry) {
    throw new CannotRecoverPublicKeyError(0, dto.multisig[0]);
  }

  const expectedInfo = profileInfoString(firstProfileEntry[1]);

  for (const [, profile] of profileEntries) {
    const info = profileInfoString(profile);
    if (info !== expectedInfo) {
      throw new UserProfileMismatchError(info, expectedInfo);
    }
  }

  const result: AuthenticateResult = {
    alias: firstProfileEntry[1].alias,
    roles: firstProfileEntry[1].roles,
    signedByKeys: profileEntries.map((p) => p[0]),
    signatureQuorum: firstProfileEntry[1].signatureQuorum
  };

  return result;
}

function profileInfoString(profile: UserProfileStrict): string {
  return `alias: ${profile.alias}, roles: ${profile.roles}, signatureQuorum: ${profile.signatureQuorum}`;
}

async function getUserProfile(
  ctx: GalaChainContext,
  publicKey: string,
  signing: SigningScheme
): Promise<UserProfileStrict> {
  const address = PublicKeyService.getUserAddress(publicKey, signing);
  const profile = await PublicKeyService.getUserProfile(ctx, address);

  if (profile !== undefined) {
    return profile;
  }

  if (ctx.config.allowNonRegisteredUsers) {
    return PublicKeyService.getDefaultUserProfile(publicKey, signing);
  }

  throw new UserNotRegisteredError(address);
}

async function getUserProfileAndPublicKey(
  ctx: GalaChainContext,
  address: string,
  signing: SigningScheme
): Promise<{ profile: UserProfileStrict; publicKey: PublicKey; matchedKey: string }> {
  const profile = await PublicKeyService.getUserProfile(ctx, address);

  if (profile === undefined) {
    throw new UserNotRegisteredError(address);
  }

  const publicKey = await PublicKeyService.getPublicKey(ctx, profile.alias);

  if (publicKey === undefined) {
    throw new PkMissingError(profile.alias);
  }

  const matchedKey = publicKey
    .getAllPublicKeys()
    .find((pk) => PublicKeyService.getUserAddress(pk, signing) === address);

  if (matchedKey === undefined) {
    throw new PkMissingError(profile.alias);
  }

  return { profile, publicKey, matchedKey };
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
  expectedAlias: string,
  quorum: number | undefined
): Promise<{ alias: string; ethAddress?: string }> {
  const user = await authenticate(ctx, dto, quorum);

  if (user.alias !== expectedAlias) {
    throw new ForbiddenError(`Dto is authenticated by ${user.alias}, not by ${expectedAlias}.`, {
      authorized: user
    });
  }

  return user;
}

/**
 * Authenticate as chaincode on the basis of the chaincodeId from the signed
 * proposal. This is a reliable way to authenticate as chaincode, because the
 * signed proposal is passed by a peer to the chaincode and can't be faked.
 */
export async function authenticateAsOriginChaincode(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  chaincode: string
): Promise<AuthenticateResult> {
  const chaincodeId = ctx.operationCtx.chaincodeId;

  if (chaincodeId !== chaincode) {
    const message = `Chaincode authorization failed. Got DTO with signerAddress: ${dto.signerAddress}, but signed proposal has chaincodeId: ${chaincodeId}.`;
    throw new ChaincodeAuthorizationError(message);
  }

  return {
    alias: `service|${chaincode}`,
    ethAddress: undefined,
    roles: [],
    signedByKeys: [],
    signatureQuorum: 0
  };
}

function noSignatures(dto: ChainCallDTO | undefined): dto is Omit<ChainCallDTO, "signature" | "multisig"> {
  return !!dto && dto.signature === undefined && dto.multisig === undefined;
}

function singleSignature(
  dto: ChainCallDTO | undefined
): dto is Omit<ChainCallDTO, "multisig"> & { signature: string } {
  return !!dto && dto.signature !== undefined && dto.multisig === undefined;
}

function multipleSignatures(
  dto: ChainCallDTO | undefined
): dto is Omit<ChainCallDTO, "signature"> & { multisig: string[] } {
  return !!dto && dto.multisig !== undefined && dto.multisig.length >= 2 && dto.signature === undefined;
}

function singleSignAuthResult(profile: UserProfileStrict, publicKey: string): AuthenticateResult {
  const addr = profile.ethAddress ? { ethAddress: profile.ethAddress } : { tonAddress: profile.tonAddress };
  return {
    alias: profile.alias,
    ...addr,
    roles: profile.roles,
    signedByKeys: [publicKey],
    signatureQuorum: profile.signatureQuorum
  };
}

export function ensureSignatureQuorumIsMet(a: AuthenticateResult, quorum: number | undefined) {
  const numberOfSignedKeys = a.signedByKeys.length;

  // Quorum from options overrides quorum from UserProfile
  const requiredQuorum = quorum ?? a.signatureQuorum;

  if (requiredQuorum > numberOfSignedKeys) {
    throw new UnauthorizedError(
      `Insufficient number of signatures: got ${numberOfSignedKeys}, required ${a.signatureQuorum}.`
    );
  }
}
