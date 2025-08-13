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
  UserProfileWithRoles,
  ValidationFailedError,
  signatures
} from "@gala-chain/api";
import * as protos from "fabric-protos";

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

/**
 *
 * @param ctx
 * @param dto
 * @returns User alias of the calling user.
 */
export async function authenticate(
  ctx: GalaChainContext,
  dto: ChainCallDTO | undefined
): Promise<{ alias: string; ethAddress?: string; tonAddress?: string; roles: string[] }> {
  if (!dto || dto.signature === undefined) {
    if (dto?.signerAddress?.startsWith("service|")) {
      const chaincode = dto.signerAddress.slice(8);
      return await authenticateAsOriginChaincode(ctx, dto, chaincode);
    }

    throw new MissingSignatureError();
  }

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
      const address = PublicKeyService.getUserAddress(dto.signerPublicKey, dto.signing ?? SigningScheme.ETH);
      throw new PkInvalidSignatureError(address);
    }

    return await getUserProfile(ctx, dto.signerPublicKey, dto.signing ?? SigningScheme.ETH); // new flow only
  } else {
    throw new MissingSignerError(dto.signature);
  }
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
