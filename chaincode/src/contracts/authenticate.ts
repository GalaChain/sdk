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
  SignConfirmationDto,
  SigningScheme,
  UserProfileWithRoles,
  ValidationFailedError,
  createValidSubmitDTO,
  signatures
} from "@gala-chain/api";
import crypto from "crypto";

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

class ChaincodeAuthorizationError extends ForbiddenError {}

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
      if (dto.signerAddress.startsWith("service|")) {
        const chaincode = dto.signerAddress.slice(8);
        return await authenticateAsChaincode(ctx, dto, chaincode, recoveredPkHex);
      }

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
    throw new ForbiddenError(`Dto is authenticated by ${user.alias}, and not by ${expectedAlias}`, {
      authorized: user
    });
  }

  return user;
}

export async function authenticateAsChaincode(
  ctx: GalaChainContext,
  dto: ChainCallDTO,
  chaincode: string,
  recoveredPkHex: string
): Promise<{ alias: string; ethAddress?: string; roles: string[] }> {
  if (dto.uniqueKey === undefined || dto.uniqueKey.length < 16) {
    const message = "Chaincode authorization must use uniqueKey with at least 16 characters";
    throw new ChaincodeAuthorizationError(message);
  }

  if (chaincode.length < 3) {
    const message = "Chaincode authorization failed, chaincode must be at least 3 characters";
    throw new ChaincodeAuthorizationError(message);
  }

  const confirmDto = await createValidSubmitDTO(SignConfirmationDto, {
    uniqueKey: dto.uniqueKey,
    nonce: crypto.randomBytes(16).toString("base64")
  });

  const args = ["PublicKeyContract:SignConfirmation", confirmDto.serialize()];

  const response = await ctx.stub.invokeChaincode(chaincode, args, "");

  if (response.status !== 200) {
    const message = "Chaincode authorization failed, got non-200 response";
    throw new ChaincodeAuthorizationError(message);
  }

  if (response.payload === undefined) {
    const message = "Chaincode authorization failed, got empty response";
    throw new ChaincodeAuthorizationError(message);
  }

  const signedConfirmation = SignConfirmationDto.deserialize(
    SignConfirmationDto,
    response.payload.toString()
  );

  if (signedConfirmation.signature === undefined) {
    const message = "Chaincode authorization failed, got empty signature on confirmation";
    throw new ChaincodeAuthorizationError(message);
  }

  if (signedConfirmation.uniqueKey !== dto.uniqueKey) {
    const message = "Chaincode authorization failed, got different uniqueKey on confirmation";
    throw new ChaincodeAuthorizationError(message);
  }

  const recoveredKeyFromConfirmation = recoverPublicKey(signedConfirmation.signature, signedConfirmation);

  if (recoveredKeyFromConfirmation !== recoveredPkHex) {
    const message = "Chaincode authorization failed, got different public key on confirmation";
    throw new ChaincodeAuthorizationError(message);
  }

  return { alias: `service|${chaincode}`, ethAddress: undefined, roles: [] };
}
