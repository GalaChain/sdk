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
  SignatureDto,
  SigningScheme,
  UserProfileWithRoles,
  ValidationFailedError,
  convertLegacySignatures,
  signatures
} from "@gala-chain/api";
import * as protos from "fabric-protos";

import { PkInvalidSignatureError, PublicKeyService } from "../services";
import { PkMissingError } from "../services/PublicKeyError";
import { GalaChainContext } from "../types";

class MissingSignatureError extends ValidationFailedError {
  constructor() {
    super("DTO must include a signature.");
  }
}

class PublicKeyMismatchError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Recovered public key does not match signerPublicKey.", { recovered, inDto });
  }
}

class AddressMismatchError extends ValidationFailedError {
  constructor(recovered: string, inDto: string) {
    super("Recovered signer address does not match signerAddress.", {
      recovered,
      inDto
    });
  }
}

class MissingSignerError extends ValidationFailedError {
  constructor(signature: string) {
    super("Missing signerPublicKey or signerAddress for signature.", { signature });
  }
}

class DuplicateSignerPublicKeyError extends ValidationFailedError {
  constructor(key: string) {
    super("Each signature must use a unique public key.", { key });
  }
}

class SignerAliasMismatchError extends ValidationFailedError {
  constructor(aliases: string[]) {
    super("All signatures must belong to the same user alias.", { aliases });
  }
}

class UserNotRegisteredError extends ValidationFailedError {
  constructor(userId: string) {
    super(`User ${userId} is not registered.`, { userId });
  }
}

export class ChaincodeAuthorizationError extends ForbiddenError {}

/**
 *
 * @param ctx
 * @param dto
 * @returns User alias of the calling user.
 */
export async function authenticate(
  ctx: GalaChainContext,
  dto: ChainCallDTO | undefined
): Promise<{
  alias: string;
  ethAddress?: string;
  tonAddress?: string;
  roles: string[];
  signedByKeys: string[];
  pubKeyCount: number;
  requiredSignatures: number;
}> {
  if (!dto || (dto.signature === undefined && (!dto.signatures || dto.signatures.length === 0))) {
    if (dto?.signerAddress?.startsWith("service|")) {
      const chaincode = dto.signerAddress.slice(8);
      const res = await authenticateAsOriginChaincode(ctx, dto, chaincode);
      return { ...res, signedByKeys: [], pubKeyCount: 1, requiredSignatures: 1 };
    }

    throw new MissingSignatureError();
  }

  const dtoWithSignatures = convertLegacySignatures(dto);
  const sigs = dtoWithSignatures.signatures ?? [];

  const authResults = await Promise.all(sigs.map((s) => authenticateSingle(ctx, dtoWithSignatures, s)));

  const aliases = authResults.map((r) => r.profile.alias);
  const uniqueAliases = Array.from(new Set(aliases));
  if (uniqueAliases.length > 1) {
    throw new SignerAliasMismatchError(uniqueAliases);
  }

  const keys = authResults.map((r) => r.signedByKey);
  const uniqueKeys = new Set(keys);
  if (uniqueKeys.size !== keys.length) {
    const dup = keys.find((k, i) => keys.indexOf(k) !== i) ?? "";
    throw new DuplicateSignerPublicKeyError(dup);
  }

  const profile = authResults[0].profile;
  return {
    alias: profile.alias,
    ethAddress: profile.ethAddress,
    tonAddress: profile.tonAddress,
    roles: profile.roles,
    signedByKeys: keys,
    pubKeyCount: profile.pubKeyCount,
    requiredSignatures: profile.requiredSignatures
  };
}

export async function authenticateSingle(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  sig: SignatureDto
): Promise<{ profile: UserProfileWithRoles; signedByKey: string }> {
  if (!sig.signature) {
    throw new MissingSignatureError();
  }

  const signing = sig.signing ?? dto.signing ?? SigningScheme.ETH;
  const recoveredPkHex = recoverPublicKey(
    sig.signature,
    dto,
    sig.prefix ?? dto.prefix ?? "",
    sig.signing ?? dto.signing
  );

  if (recoveredPkHex !== undefined) {
    if (sig.signerPublicKey !== undefined) {
      const hexKey = signatures.getNonCompactHexPublicKey(sig.signerPublicKey);
      if (recoveredPkHex !== hexKey) {
        throw new PublicKeyMismatchError(recoveredPkHex, hexKey);
      }
    }
    if (sig.signerAddress !== undefined) {
      const ethAddress = signatures.getEthAddress(recoveredPkHex);
      if (sig.signerAddress !== ethAddress) {
        throw new AddressMismatchError(ethAddress, sig.signerAddress);
      }
    }
    const profile = await getUserProfile(ctx, recoveredPkHex, signing);
    return { profile, signedByKey: recoveredPkHex };
  } else if (sig.signerAddress !== undefined) {
    const { profile, publicKey } = await getUserProfileAndPublicKey(ctx, sig.signerAddress);

    if (!dto.isSignatureValid(sig, publicKey.publicKey!)) {
      throw new PkInvalidSignatureError(profile.alias);
    }

    const keyHex =
      signing === SigningScheme.TON
        ? publicKey.publicKey!
        : signatures.getNonCompactHexPublicKey(publicKey.publicKey!);
    return { profile, signedByKey: keyHex };
  } else if (sig.signerPublicKey !== undefined) {
    if (!dto.isSignatureValid(sig)) {
      const address = PublicKeyService.getUserAddress(sig.signerPublicKey, signing);
      throw new PkInvalidSignatureError(address);
    }

    const profile = await getUserProfile(ctx, sig.signerPublicKey, signing);
    const keyHex =
      signing === SigningScheme.TON
        ? sig.signerPublicKey
        : signatures.getNonCompactHexPublicKey(sig.signerPublicKey);
    return { profile, signedByKey: keyHex };
  }

  throw new MissingSignerError(sig.signature);
}

async function getUserProfile(
  ctx: GalaChainContext,
  publicKey: string,
  signing: SigningScheme
): Promise<UserProfileWithRoles> {
  const address = PublicKeyService.getUserAddress(publicKey, signing);
  const profile = await PublicKeyService.getUserProfile(ctx, address);

  if (profile === undefined) {
    if (ctx.config.allowNonRegisteredUsers) {
      return PublicKeyService.getDefaultUserProfile(publicKey, signing);
    } else {
      throw new UserNotRegisteredError(address);
    }
  }

  return profile;
}

async function getUserProfileAndPublicKey(
  ctx: GalaChainContext,
  address
): Promise<{ profile: UserProfileWithRoles; publicKey: PublicKey }> {
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

function recoverPublicKey(
  signature: string,
  dto: ChainCallDTO,
  prefix = "",
  signing?: SigningScheme
): string | undefined {
  const scheme = signing ?? dto.signing;
  if (scheme === SigningScheme.TON) {
    return undefined;
  }

  const payload: Record<string, unknown> = {
    ...dto,
    signature: undefined,
    signatures: undefined,
    signerPublicKey: undefined,
    signerAddress: undefined,
    prefix: undefined
  };

  if (scheme !== undefined) {
    payload.signing = scheme;
  }

  try {
    return signatures.recoverPublicKey(signature, payload, prefix);
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
): Promise<{ alias: string; ethAddress?: string; roles: string[] }> {
  const signedProposal = ctx.stub.getSignedProposal();
  if (signedProposal === undefined) {
    const message = "Chaincode authorization failed: got empty signed proposal.";
    throw new ChaincodeAuthorizationError(message);
  }

  // @ts-expect-error error in fabric types mapping
  const proposalPayload = signedProposal.proposal.payload?.array?.[0];

  if (proposalPayload === undefined) {
    const message = "Chaincode authorization failed: got empty proposal payload in signed proposal.";
    throw new ChaincodeAuthorizationError(message);
  }

  const decodedProposal = protos.protos.ChaincodeProposalPayload.decode(proposalPayload);
  const invocationSpec = protos.protos.ChaincodeInvocationSpec.decode(decodedProposal.input);
  const chaincodeId = invocationSpec.chaincode_spec?.chaincode_id?.name;

  if (chaincodeId === undefined) {
    const message = "Chaincode authorization failed: got empty chaincodeId in signed proposal.";
    throw new ChaincodeAuthorizationError(message);
  }

  if (chaincodeId !== chaincode) {
    const message = `Chaincode authorization failed. Got DTO with signerAddress: ${dto.signerAddress}, but signed proposal has chaincodeId: ${chaincodeId}.`;
    throw new ChaincodeAuthorizationError(message);
  }

  return { alias: `service|${chaincode}`, ethAddress: undefined, roles: [] };
}
