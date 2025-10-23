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
  ChainObject,
  NotImplementedError,
  PK_INDEX_KEY,
  PublicKey,
  SigningScheme,
  UP_INDEX_KEY,
  UnauthorizedError,
  UserAlias,
  UserProfile,
  UserProfileStrict,
  ValidationFailedError,
  asValidUserAlias,
  createValidChainObject,
  normalizePublicKey,
  signatures
} from "@gala-chain/api";
import { Context } from "fabric-contract-api";

import { GalaChainContext } from "../types";
import {
  PkExistsError,
  PkInvalidSignatureError,
  PkMissingError,
  PkNotFoundError,
  ProfileExistsError,
  UserProfileNotFoundError
} from "./PublicKeyError";

export class PublicKeyService {
  private static PK_INDEX_KEY = PK_INDEX_KEY;
  private static UP_INDEX_KEY = UP_INDEX_KEY;

  public static getPublicKeyKey(ctx: Context, userAlias: string): string {
    return ctx.stub.createCompositeKey(PublicKeyService.PK_INDEX_KEY, [userAlias]);
  }

  public static getUserProfileKey(ctx: Context, ethAddress: string): string {
    return ctx.stub.createCompositeKey(PublicKeyService.UP_INDEX_KEY, [ethAddress]);
  }

  public static normalizePublicKey = normalizePublicKey;

  public static async putPublicKey(
    ctx: GalaChainContext,
    publicKey: string,
    userAlias: string,
    signing: SigningScheme
  ): Promise<PublicKey> {
    const key = PublicKeyService.getPublicKeyKey(ctx, userAlias);
    const obj = new PublicKey();
    obj.signing = signing;

    obj.publicKey =
      signing === SigningScheme.TON //
        ? publicKey
        : PublicKeyService.normalizePublicKey(publicKey);

    const data = Buffer.from(obj.serialize());
    await ctx.stub.putState(key, data);

    return obj;
  }

  public static async putUserProfile(
    ctx: GalaChainContext,
    userAlias: UserAlias,
    roles: string[] | undefined,
    address: { ethAddress?: string; tonAddress?: string } | undefined,
    signers: UserAlias[] | undefined,
    signatureQuorum: number
  ): Promise<void> {
    const upKeyPart = address?.ethAddress ?? address?.tonAddress ?? userAlias;
    const key = PublicKeyService.getUserProfileKey(ctx, upKeyPart);
    const obj = new UserProfile();
    obj.alias = userAlias;
    obj.signatureQuorum = signatureQuorum;
    obj.roles = roles ?? Array.from(UserProfile.DEFAULT_ROLES);

    if (address?.tonAddress) {
      obj.tonAddress = address?.tonAddress;
    }

    if (address?.ethAddress) {
      obj.ethAddress = address.ethAddress;
    }

    if (signers) {
      obj.signers = signers.sort();
    }

    const data = Buffer.from(obj.serialize());
    await ctx.stub.putState(key, data);
  }

  public static async invalidateUserProfile(ctx: GalaChainContext, address: string): Promise<void> {
    const key = PublicKeyService.getUserProfileKey(ctx, address);
    const userProfile = await createValidChainObject(UserProfile, {
      alias: asValidUserAlias(`client|invalidated`),
      ethAddress: "0000000000000000000000000000000000000000",
      roles: []
    });

    const data = Buffer.from(userProfile.serialize());
    await ctx.stub.putState(key, data);
  }

  public static getUserAddress(publicKey: string, signing: SigningScheme): string {
    return signing === SigningScheme.TON
      ? signatures.ton.getTonAddress(Buffer.from(publicKey, "base64"))
      : signatures.getEthAddress(signatures.getNonCompactHexPublicKey(publicKey));
  }

  public static async getUserProfile(ctx: Context, address: string): Promise<UserProfileStrict | undefined> {
    const key = PublicKeyService.getUserProfileKey(ctx, address);
    const data = await ctx.stub.getState(key);

    if (data.length > 0) {
      const userProfile = ChainObject.deserialize<UserProfile>(UserProfile, data.toString());

      if (userProfile.roles === undefined) {
        userProfile.roles = Array.from(UserProfile.DEFAULT_ROLES);
      }

      if (userProfile.signatureQuorum === undefined) {
        userProfile.signatureQuorum = 1;
      }

      return userProfile as UserProfileStrict;
    }

    // check if we want the profile of the admin
    if (process.env.DEV_ADMIN_PUBLIC_KEY) {
      const nonCompactPK = signatures.getNonCompactHexPublicKey(process.env.DEV_ADMIN_PUBLIC_KEY);
      const adminEthAddress = signatures.getEthAddress(nonCompactPK);

      if (adminEthAddress === address) {
        const message =
          `User Profile is not saved on chain for user ${adminEthAddress}. ` +
          `But env variable DEV_ADMIN_PUBLIC_KEY is set for the user. ` +
          `Thus, the public key from env will be used with signature quorum 1. ` +
          `It is highly recommended to register the admin user with multisig enabled.`;
        ctx.logging.getLogger().warn(message);

        const alias = (process.env.DEV_ADMIN_USER_ID ?? `eth|${adminEthAddress}`) as UserAlias;

        if (!alias.startsWith("eth|") && !alias.startsWith("client|")) {
          const message = `Invalid alias for user: ${alias} with public key: ${process.env.DEV_ADMIN_PUBLIC_KEY}`;
          throw new UnauthorizedError(message, { alias, publicKey: process.env.DEV_ADMIN_PUBLIC_KEY });
        }

        const adminProfile = new UserProfile();
        adminProfile.ethAddress = adminEthAddress;
        adminProfile.alias = alias;
        adminProfile.roles = Array.from(UserProfile.ADMIN_ROLES);
        adminProfile.signatureQuorum = 1;

        return adminProfile as UserProfileStrict;
      }
    }

    return undefined;
  }

  public static getDefaultPublicKey(publicKey: string, signing: SigningScheme): PublicKey {
    const pk = new PublicKey();
    pk.publicKey = publicKey;
    pk.signing = signing;

    return pk;
  }

  public static getDefaultUserProfile(publicKey: string, signing: SigningScheme): UserProfileStrict {
    const address = this.getUserAddress(publicKey, signing);
    const profile = new UserProfile();
    profile.alias = asValidUserAlias(`${signing.toLowerCase()}|${address}`);
    profile.ethAddress = signing === SigningScheme.ETH ? address : undefined;
    profile.tonAddress = signing === SigningScheme.TON ? address : undefined;
    profile.roles = Array.from(UserProfile.DEFAULT_ROLES);
    profile.signatureQuorum = 1;

    return profile as UserProfileStrict;
  }

  public static async getPublicKey(ctx: Context, userId: UserAlias): Promise<PublicKey | undefined> {
    const key = PublicKeyService.getPublicKeyKey(ctx, userId);
    const data = await ctx.stub.getState(key);

    if (data.length > 0) {
      const publicKey = ChainObject.deserialize<PublicKey>(PublicKey, data.toString());
      publicKey.signing = publicKey.signing ?? SigningScheme.ETH;

      return publicKey;
    }

    if (userId === process.env.DEV_ADMIN_USER_ID && process.env.DEV_ADMIN_PUBLIC_KEY !== undefined) {
      const message =
        `Public key is not saved on chain for user ${userId}. ` +
        `But env variables DEV_ADMIN_USER_ID and DEV_ADMIN_PUBLIC_KEY are set for the user. ` +
        `Thus, the public key from env will be used.`;
      ctx.logging.getLogger().warn(message);

      const pk = new PublicKey();
      pk.publicKey = process.env.DEV_ADMIN_PUBLIC_KEY;
      pk.signing = SigningScheme.ETH;
      return pk;
    }

    return undefined;
  }

  public static async registerUser(
    ctx: GalaChainContext,
    publicKey: string | undefined,
    signers: UserAlias[] | undefined,
    userAlias: UserAlias,
    signing: SigningScheme,
    signatureQuorum: number
  ): Promise<string> {
    if (publicKey && signers) {
      throw new ValidationFailedError("Cannot use both publicKey and signers");
    }

    const isMultisig = signers && !publicKey;

    if (isMultisig && signing === SigningScheme.TON) {
      throw new ValidationFailedError("Multiple signers are not supported with TON signing scheme");
    }

    if (!isMultisig && signatureQuorum !== 1) {
      throw new ValidationFailedError("Signature quorum must be 1 for non-multisig users");
    }

    // Validate signature quorum doesn't exceed number of public keys
    if (signatureQuorum > (signers?.length ?? 1)) {
      throw new ValidationFailedError("Signature quorum cannot exceed number of signers");
    }

    // Check for duplicate signers. Note: signers is a list of UserAlias objects
    // (unique and unambiguous user idetfiers on chain)
    if (signers && signers.length !== new Set(signers).size) {
      throw new ValidationFailedError(`Found duplicate signers in: ${signers.join(",")}`);
    }

    const currPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);

    if (currPublicKey) {
      throw new PkExistsError(userAlias);
    }

    // put public key only for single signed users
    if (publicKey && !signers) {
      await PublicKeyService.putPublicKey(ctx, publicKey, userAlias, signing);
    }

    // If public key is used, use the address derived from the public key
    // Otherwise, for multisig, we use the provided user alias as the address
    const address = publicKey ? PublicKeyService.getUserAddress(publicKey, signing) : userAlias;

    // If User Profile already exists on chain for this ethereum address,
    // we should not allow registering the same user again
    const existingUserProfile = await PublicKeyService.getUserProfile(ctx, address);
    if (existingUserProfile !== undefined) {
      throw new ProfileExistsError(address, existingUserProfile.alias);
    }

    const addressObj = signers
      ? {}
      : signing === SigningScheme.ETH
        ? { ethAddress: address }
        : { tonAddress: address };

    // Create user profile for this address
    await PublicKeyService.putUserProfile(ctx, userAlias, undefined, addressObj, signers, signatureQuorum);

    return userAlias;
  }

  public static async updatePublicKey(
    ctx: GalaChainContext,
    dto: { publicKey: string; publicKeySignature?: string },
    signing: SigningScheme
  ): Promise<void> {
    const userAlias = ctx.callingUser;
    const newPublicKey = dto.publicKey;
    const { publicKeySignature: newPublicKeySignature, ...dtoRemaining } = dto;

    if (ctx.callingUserSignedBy.length !== 1) {
      const msg =
        `Expected exactly 1 signed by key for user ${userAlias}, ` +
        `but was signed by: ${ctx.callingUserSignedBy.join(", ")}`;
      throw new UnauthorizedError(msg);
    }

    if (newPublicKeySignature === undefined) {
      throw new ValidationFailedError("Public key signature is missing");
    }

    const isSignatureValid = signatures.isValidSignature(
      newPublicKeySignature,
      dtoRemaining,
      newPublicKey,
      signing
    );
    if (!isSignatureValid) {
      throw new ValidationFailedError(`Invalid ${signing} public key signature`);
    }

    if (newPublicKeySignature === undefined) {
      throw new ValidationFailedError("Public key signature is missing");
    }

    const currentPublicKeyObj = await PublicKeyService.getPublicKey(ctx, userAlias);
    if (currentPublicKeyObj === undefined) {
      throw new PkNotFoundError(userAlias);
    }

    if (currentPublicKeyObj.publicKey === undefined) {
      throw new NotImplementedError("UpdatePublicKey for multisig is not supported");
    }

    const currentSigning = currentPublicKeyObj.signing ?? SigningScheme.ETH;
    if (currentSigning !== signing) {
      const msg = `Current public key signing scheme ${currentSigning} does not match new signing scheme ${signing}`;
      throw new ValidationFailedError(msg);
    }

    // need to fetch userProfile from old address
    const oldAddress = PublicKeyService.getUserAddress(currentPublicKeyObj.publicKey, signing);
    const userProfile = await PublicKeyService.getUserProfile(ctx, oldAddress);
    const signatureQuorum = userProfile?.signatureQuorum ?? 1;

    // invalidate old user profile to prevent double registration under old public key
    if (userProfile !== undefined) {
      await PublicKeyService.invalidateUserProfile(ctx, oldAddress);
    }

    // ensure no user profile exists under new address
    const newAddress = PublicKeyService.getUserAddress(newPublicKey, signing);
    const newUserProfile = await PublicKeyService.getUserProfile(ctx, newAddress);
    if (newUserProfile !== undefined) {
      throw new ProfileExistsError(newAddress, newUserProfile.alias);
    }

    const newNormalizedPublicKey =
      signing === SigningScheme.ETH //
        ? PublicKeyService.normalizePublicKey(newPublicKey)
        : newPublicKey;

    const addressObj =
      signing === SigningScheme.ETH ? { ethAddress: newAddress } : { tonAddress: newAddress };

    // update PublicKey, and add user profile under new eth address
    await PublicKeyService.putPublicKey(ctx, newNormalizedPublicKey, userAlias, signing);
    await PublicKeyService.putUserProfile(
      ctx,
      userAlias,
      userProfile?.roles,
      addressObj,
      undefined,
      signatureQuorum
    );
  }

  public static async updateUserRoles(
    ctx: GalaChainContext,
    user: UserAlias,
    roles: string[]
  ): Promise<void> {
    const publicKey = await PublicKeyService.getPublicKey(ctx, user);

    const address = publicKey
      ? PublicKeyService.getUserAddress(publicKey.publicKey, publicKey.signing ?? SigningScheme.ETH)
      : user;

    const userProfile = await PublicKeyService.getUserProfile(ctx, address);
    if (userProfile === undefined) {
      throw new UserProfileNotFoundError(user);
    }

    const newRoles = Array.from(new Set(roles)).sort();

    await PublicKeyService.putUserProfile(
      ctx,
      user,
      newRoles,
      userProfile,
      userProfile.signers,
      userProfile.signatureQuorum
    );
  }

  public static async addSigner(ctx: GalaChainContext, newSigner: UserAlias): Promise<void> {
    const userAlias = ctx.callingUser;
    const currentUserProfile = await PublicKeyService.getUserProfile(ctx, userAlias);

    if (currentUserProfile === undefined) {
      throw new UserProfileNotFoundError(userAlias);
    }

    if (currentUserProfile.signers === undefined) {
      throw new ValidationFailedError("Cannot add signer to a single signed user");
    }

    const allSigners = currentUserProfile.signers ?? [];

    // Check if the new public key already exists
    if (allSigners.includes(newSigner)) {
      throw new ValidationFailedError(`Signer ${newSigner} is already in the list of signers`);
    }

    // Add the new signer
    allSigners.push(newSigner);
    allSigners.sort();

    await PublicKeyService.putUserProfile(
      ctx,
      userAlias,
      currentUserProfile.roles,
      currentUserProfile,
      allSigners,
      currentUserProfile.signatureQuorum
    );
  }

  public static async removeSigner(ctx: GalaChainContext, signerToRemove: UserAlias): Promise<void> {
    const userAlias = ctx.callingUser;
    const currentUserProfile = await PublicKeyService.getUserProfile(ctx, userAlias);

    if (currentUserProfile === undefined) {
      throw new UserProfileNotFoundError(userAlias);
    }

    const allSigners = currentUserProfile.signers ?? [];

    // Check if we have multiple signers (multisig setup)
    if (allSigners.length <= 1) {
      throw new ValidationFailedError("Cannot remove the only signer");
    }

    // Check if removing this key would make the number of keys below quorum
    if (allSigners.length - 1 < currentUserProfile.signatureQuorum) {
      throw new ValidationFailedError("Cannot remove signer: would make number of signers below quorum");
    }

    // Check if the signer to remove is the calling transaction signer
    if (ctx.callingUserSignedBy.includes(signerToRemove)) {
      const msg = `Cannot remove the signer ${signerToRemove} that is the calling transaction signer`;
      throw new ValidationFailedError(msg);
    }

    // Update signers list by removing the signer to remove
    const updatedSigners = allSigners.filter((signer) => signer !== signerToRemove);
    updatedSigners.sort();

    await PublicKeyService.putUserProfile(
      ctx,
      userAlias,
      currentUserProfile.roles,
      currentUserProfile,
      updatedSigners,
      currentUserProfile.signatureQuorum
    );
  }

  public static async updateQuorum(ctx: GalaChainContext, newQuorum: number): Promise<void> {
    const userAlias = ctx.callingUser;
    const currentUserProfile = await PublicKeyService.getUserProfile(ctx, userAlias);

    if (currentUserProfile === undefined) {
      throw new UserProfileNotFoundError(userAlias);
    }

    if (currentUserProfile.signers === undefined) {
      throw new ValidationFailedError("Quorum can only be updated for multisig users");
    }

    const allSigners = currentUserProfile.signers ?? [];

    // Check if new quorum exceeds number of signers
    if (newQuorum > allSigners.length) {
      throw new ValidationFailedError(`Quorum cannot exceed number of signers (${allSigners.length})`);
    }

    await PublicKeyService.putUserProfile(
      ctx,
      userAlias,
      currentUserProfile.roles,
      currentUserProfile,
      allSigners,
      newQuorum
    );
  }

  /**
   * Verifies if the data is properly signed. Throws exception instead.
   */
  public static async ensurePublicKeySignatureIsValid(
    ctx: GalaChainContext,
    userAlias: UserAlias,
    dto: ChainCallDTO
  ): Promise<PublicKey> {
    const pk = await PublicKeyService.getPublicKey(ctx, userAlias);

    if (pk === undefined) {
      throw new PkMissingError(userAlias);
    }

    const isSignatureValid = dto.isSignatureValid(pk.publicKey ?? "");

    if (!isSignatureValid) {
      throw new PkInvalidSignatureError(userAlias);
    }

    return pk;
  }
}
