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
  UserAlias,
  UserProfileStrict,
  UserRef,
  ValidationFailedError,
  signatures
} from "@gala-chain/api";

import { PkInvalidSignatureError, PublicKeyService, resolveUserAlias } from "../services";
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
      `Multiple signature authentication is supported only for ETH signing scheme, ` +
        "and requires valid signerAddress and dtoExpiresAt, " +
        "and no other signer parameters (signerPublicKey or prefix)."
    );
  }
}

class CannotRecoverPublicKeyError extends ValidationFailedError {
  constructor(index: number, signature: string) {
    super(`Cannot recover public key from signature: ${signature}.`, { index, signature });
  }
}

class DuplicateSignerError extends ValidationFailedError {
  constructor(signedBy: string[]) {
    super(`Duplicate signer in: ${signedBy.join(", ")}.`, { signedBy });
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
  signedBy: UserAlias[];
  signatureQuorum?: number;
  allowedSigners?: UserAlias[];
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
        // potentially a multisig profile
        const p = await PublicKeyService.getUserProfile(ctx, dto.signerAddress);
        const alias = await resolveUserAlias(ctx, ethAddress);
        if (p && (p.signers ?? []).includes(alias)) {
          return multisigAuthResult(p, [alias]);
        } else {
          throw new AddressMismatchError(ethAddress, dto.signerAddress);
        }
      } else {
        throw new RedundantSignerAddressError(ethAddress, dto.signerAddress);
      }
    }

    const p = await getUserProfile(ctx, recoveredPkHex, signing);
    return singleSignAuthResult(p);
  } else if (dto.signerAddress !== undefined) {
    if (dto.signerPublicKey !== undefined) {
      throw new RedundantSignerPublicKeyError(dto.signerAddress, dto.signerPublicKey);
    }

    const resp = await getUserProfileAndPublicKey(ctx, dto.signerAddress, signing);

    if (!dto.isSignatureValid(resp.publicKey.publicKey)) {
      throw new PkInvalidSignatureError(resp.profile.alias);
    }

    return singleSignAuthResult(resp.profile);
  } else if (dto.signerPublicKey !== undefined) {
    if (!dto.isSignatureValid(dto.signerPublicKey)) {
      const address = PublicKeyService.getUserAddress(dto.signerPublicKey, signing);
      throw new PkInvalidSignatureError(address);
    }

    const p = await getUserProfile(ctx, dto.signerPublicKey, signing);
    return singleSignAuthResult(p);
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
    dto.signerPublicKey !== undefined ||
    dto.prefix !== undefined ||
    dto.signerAddress === undefined ||
    dto.dtoExpiresAt === undefined ||
    dto.multisig.length < 2
  ) {
    throw new MultipleSignaturesNotAllowedError();
  }

  const userAlias = await resolveUserAlias(ctx, dto.signerAddress);

  const multisigProfile = await PublicKeyService.getUserProfile(ctx, userAlias);
  if (multisigProfile === undefined) {
    throw new UserNotRegisteredError(userAlias);
  }

  if (!multisigProfile.signers) {
    throw new UnauthorizedError("Multisig profile does not have signers.");
  }

  const signerProfiles: UserProfileStrict[] = [];

  for (const [index, signature] of dto.multisig.entries()) {
    const recoveredPkHex = recoverPublicKey(signature, dto, dto.prefix ?? "");
    if (recoveredPkHex === undefined) {
      throw new CannotRecoverPublicKeyError(index, signature);
    }
    const profile = await getUserProfile(ctx, recoveredPkHex, signing);

    if (!multisigProfile.signers.includes(profile.alias)) {
      const msg = `Signer ${profile.alias} is not allowed to sign ${dto.signerAddress}.`;
      throw new UnauthorizedError(msg, { signer: profile.alias, signerAddress: dto.signerAddress });
    }

    signerProfiles.push(profile);
  }

  const signedBy = signerProfiles.map((p) => p.alias);
  const signedBySet = new Set(signedBy);
  if (signedBySet.size !== signedBy.length) {
    throw new DuplicateSignerError(signedBy);
  }

  return multisigAuthResult(multisigProfile, signedBy);
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
  signerAddress: string,
  signing: SigningScheme
): Promise<{ profile: UserProfileStrict; publicKey: PublicKey }> {
  // it is allowed to use prefixed address
  let addr = signerAddress;
  if (signing === SigningScheme.TON && addr.startsWith("ton|")) {
    addr = addr.slice(4);
  } else if (signing === SigningScheme.ETH && addr.startsWith("eth|")) {
    addr = addr.slice(4);
  }

  const profile = await PublicKeyService.getUserProfile(ctx, addr);

  if (profile === undefined) {
    throw new UserNotRegisteredError(addr);
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
    signedBy: []
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
): dto is Omit<ChainCallDTO, "signature"> & { multisig: string[] & { signerAddress: UserRef } } {
  return !!dto && dto.multisig !== undefined && dto.multisig.length >= 2 && dto.signature === undefined;
}

function singleSignAuthResult(profile: UserProfileStrict): AuthenticateResult {
  const addr = profile.ethAddress ? { ethAddress: profile.ethAddress } : { tonAddress: profile.tonAddress };
  return {
    alias: profile.alias,
    ...addr,
    roles: profile.roles,
    signedBy: [profile.alias]
  };
}

function multisigAuthResult(profile: UserProfileStrict, signedBy: UserAlias[]): AuthenticateResult {
  return {
    alias: profile.alias,
    roles: profile.roles,
    signedBy,
    signatureQuorum: profile.signatureQuorum,
    allowedSigners: profile.signers
  };
}

export function ensureSignatureQuorumIsMet(a: AuthenticateResult, quorum: number | undefined) {
  const numberOfSignedKeys = a.signedBy.length;

  // Quorum from options overrides quorum from UserProfile
  const requiredQuorum = quorum ?? a.signatureQuorum ?? 1;

  if (requiredQuorum > numberOfSignedKeys) {
    throw new UnauthorizedError(
      `Insufficient number of signatures: got ${numberOfSignedKeys}, required ${requiredQuorum}.`
    );
  }
}
