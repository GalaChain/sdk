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
    publicKeys: string[],
    userAlias: string,
    signing: SigningScheme
  ): Promise<void> {
    if (publicKeys.length === 0) {
      throw new PkMissingError(userAlias);
    }

    const normalizedKeys =
      signing === SigningScheme.ETH
        ? publicKeys.map((pk) => PublicKeyService.normalizePublicKey(pk))
        : publicKeys;

    if (new Set(normalizedKeys).size !== normalizedKeys.length) {
      throw new ValidationFailedError(
        `Found duplicate public keys in ${userAlias}: ${normalizedKeys.join(", ")}. ` +
          `Public keys must be unique.`
      );
    }

    const key = PublicKeyService.getPublicKeyKey(ctx, userAlias);
    const obj = new PublicKey();
    obj.signing = signing;

    if (normalizedKeys.length === 1) {
      obj.publicKey = normalizedKeys[0];
    } else {
      obj.publicKeys = normalizedKeys;
    }

    const data = Buffer.from(obj.serialize());
    await ctx.stub.putState(key, data);
  }

  public static async putUserProfile(
    ctx: GalaChainContext,
    address: string,
    userAlias: UserAlias,
    signing: SigningScheme,
    signatureQuorum: number
  ): Promise<void> {
    const key = PublicKeyService.getUserProfileKey(ctx, address);
    const obj = new UserProfile();
    obj.alias = userAlias;
    obj.signatureQuorum = signatureQuorum;
    obj.roles = Array.from(UserProfile.DEFAULT_ROLES);

    if (signing === SigningScheme.TON) {
      obj.tonAddress = address;
    } else {
      obj.ethAddress = address;
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

  public static async getPublicKey(ctx: Context, userId: string): Promise<PublicKey | undefined> {
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
    publicKeys: string[],
    userAlias: UserAlias,
    signing: SigningScheme,
    signatureQuorum: number
  ): Promise<string> {
    // Validate signature quorum doesn't exceed number of public keys
    if (signatureQuorum > publicKeys.length) {
      throw new ValidationFailedError("Signature quorum cannot exceed number of public keys");
    }

    // Validate that multiple public keys are not used with TON signing scheme
    if (signing === SigningScheme.TON && publicKeys.length > 1) {
      throw new ValidationFailedError("Multiple public keys are not supported with TON signing scheme");
    }

    const currPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);

    if (currPublicKey) {
      throw new PkExistsError(userAlias);
    }

    await PublicKeyService.putPublicKey(ctx, publicKeys, userAlias, signing);

    for (const publicKey of publicKeys) {
      const address = PublicKeyService.getUserAddress(publicKey, signing);

      // If User Profile already exists on chain for this ethereum address,
      // we should not allow registering the same user again
      const existingUserProfile = await PublicKeyService.getUserProfile(ctx, address);
      if (existingUserProfile !== undefined) {
        throw new ProfileExistsError(address, existingUserProfile.alias);
      }

      // Create user profile for this address
      await PublicKeyService.putUserProfile(ctx, address, userAlias, signing, signatureQuorum);
    }

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

    if (ctx.callingUserSignedByKeys.length !== 1) {
      const msg = `Expected exactly 1 signed by key for user ${userAlias}, got ${ctx.callingUserSignedByKeys.length}`;
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

    const oldPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);
    if (oldPublicKey === undefined) {
      throw new PkNotFoundError(userAlias);
    }

    const oldPublicKeySigning = oldPublicKey.signing ?? SigningScheme.ETH;
    if (oldPublicKeySigning !== signing) {
      throw new ValidationFailedError(
        `Old public key signing scheme ${oldPublicKeySigning} does not match new signing scheme ${signing}`
      );
    }

    const allPublicKeys = oldPublicKey.getAllPublicKeys();
    const oldPublicKeyNormalized =
      signing === SigningScheme.ETH
        ? PublicKeyService.normalizePublicKey(ctx.callingUserSignedByKeys[0])
        : ctx.callingUserSignedByKeys[0];

    const index = allPublicKeys.indexOf(oldPublicKeyNormalized);
    if (index === -1) {
      const allPKsStr = `[${allPublicKeys.join(", ")}]`;
      const msg = `New public key ${newPublicKey} was not found in old public keys: ${allPKsStr}`;
      throw new ValidationFailedError(msg);
    }

    // replace old public key with new public key
    allPublicKeys[index] = newPublicKey;

    // need to fetch userProfile from old address
    const oldAddress = PublicKeyService.getUserAddress(oldPublicKeyNormalized, signing);
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

    // update Public Key, and add user profile under new eth address
    await PublicKeyService.putPublicKey(ctx, allPublicKeys, userAlias, signing);
    await PublicKeyService.putUserProfile(ctx, newAddress, userAlias, signing, signatureQuorum);
  }

  public static async updateUserRoles(ctx: GalaChainContext, user: string, roles: string[]): Promise<void> {
    const publicKey = await PublicKeyService.getPublicKey(ctx, user);

    if (publicKey === undefined) {
      throw new PkNotFoundError(user);
    }

    if (publicKey.publicKey === undefined) {
      throw new NotImplementedError("UpdateUserRoles when publicKey is undefined");
    }

    const address = PublicKeyService.getUserAddress(
      publicKey.publicKey,
      publicKey.signing ?? SigningScheme.ETH
    );
    const profile = await PublicKeyService.getUserProfile(ctx, address);

    if (profile === undefined) {
      throw new UserProfileNotFoundError(user);
    }

    profile.roles = Array.from(new Set(roles)).sort();

    const key = PublicKeyService.getUserProfileKey(ctx, address);
    const data = Buffer.from(profile.serialize());
    await ctx.stub.putState(key, data);
  }

  public static async addPublicKey(
    ctx: GalaChainContext,
    newPublicKey: string,
    signing: SigningScheme
  ): Promise<void> {
    const userAlias = ctx.callingUser;
    const currentPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);

    if (currentPublicKey === undefined) {
      throw new PkNotFoundError(userAlias);
    }

    const currentSigning = currentPublicKey.signing ?? SigningScheme.ETH;
    if (currentSigning !== signing) {
      throw new ValidationFailedError(
        `Current signing scheme ${currentSigning} does not match new signing scheme ${signing}`
      );
    }

    const allPublicKeys = currentPublicKey.getAllPublicKeys();

    // Check if the new public key already exists
    const normalizedNewKey =
      signing === SigningScheme.ETH ? PublicKeyService.normalizePublicKey(newPublicKey) : newPublicKey;

    if (allPublicKeys.includes(normalizedNewKey)) {
      throw new ValidationFailedError("Public key already exists");
    }

    // Add the new public key
    allPublicKeys.push(normalizedNewKey);

    // Get the current signature quorum from any existing profile
    const existingProfile = await PublicKeyService.getUserProfile(
      ctx,
      PublicKeyService.getUserAddress(allPublicKeys[0], signing)
    );
    const signatureQuorum = existingProfile?.signatureQuorum ?? 1;

    // Create user profile for the new public key
    const newAddress = PublicKeyService.getUserAddress(normalizedNewKey, signing);
    const existingNewProfile = await PublicKeyService.getUserProfile(ctx, newAddress);
    if (existingNewProfile !== undefined) {
      throw new ProfileExistsError(newAddress, existingNewProfile.alias);
    }

    await PublicKeyService.putUserProfile(ctx, newAddress, userAlias, signing, signatureQuorum);
    await PublicKeyService.putPublicKey(ctx, allPublicKeys, userAlias, signing);
  }

  public static async removePublicKey(
    ctx: GalaChainContext,
    publicKeyToRemove: string,
    signing: SigningScheme
  ): Promise<void> {
    const userAlias = ctx.callingUser;
    const currentPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);

    if (currentPublicKey === undefined) {
      throw new PkNotFoundError(userAlias);
    }

    const currentSigning = currentPublicKey.signing ?? SigningScheme.ETH;
    if (currentSigning !== signing) {
      throw new ValidationFailedError(
        `Current signing scheme ${currentSigning} does not match signing scheme ${signing}`
      );
    }

    const allPublicKeys = currentPublicKey.getAllPublicKeys();

    // Check if we have multiple public keys (multisig setup)
    if (allPublicKeys.length <= 1) {
      throw new ValidationFailedError("Cannot remove the only public key");
    }

    // Find and remove the public key
    const normalizedKeyToRemove =
      signing === SigningScheme.ETH
        ? PublicKeyService.normalizePublicKey(publicKeyToRemove)
        : publicKeyToRemove;

    const index = allPublicKeys.indexOf(normalizedKeyToRemove);
    if (index === -1) {
      throw new ValidationFailedError("Public key not found");
    }

    // Get current signature quorum
    const existingProfile = await PublicKeyService.getUserProfile(
      ctx,
      PublicKeyService.getUserAddress(allPublicKeys[0], signing)
    );
    const signatureQuorum = existingProfile?.signatureQuorum ?? 1;

    // Check if removing this key would make the number of keys below quorum
    if (allPublicKeys.length - 1 < signatureQuorum) {
      throw new ValidationFailedError("Cannot remove public key: would make number of keys below quorum");
    }

    // Remove the public key
    allPublicKeys.splice(index, 1);

    // Invalidate the user profile for the removed key
    const addressToInvalidate = PublicKeyService.getUserAddress(normalizedKeyToRemove, signing);
    await PublicKeyService.invalidateUserProfile(ctx, addressToInvalidate);

    // Update the public key
    await PublicKeyService.putPublicKey(ctx, allPublicKeys, userAlias, signing);
  }

  public static async updateQuorum(ctx: GalaChainContext, newQuorum: number): Promise<void> {
    const userAlias = ctx.callingUser;
    const currentPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);

    if (currentPublicKey === undefined) {
      throw new PkNotFoundError(userAlias);
    }

    const allPublicKeys = currentPublicKey.getAllPublicKeys();

    // Check if new quorum exceeds number of public keys
    if (newQuorum > allPublicKeys.length) {
      throw new ValidationFailedError("Quorum cannot exceed number of public keys");
    }

    const signing = currentPublicKey.signing ?? SigningScheme.ETH;

    // Update all user profiles with the new quorum
    for (const publicKey of allPublicKeys) {
      const address = PublicKeyService.getUserAddress(publicKey, signing);
      const profile = await PublicKeyService.getUserProfile(ctx, address);

      if (profile !== undefined) {
        profile.signatureQuorum = newQuorum;
        const key = PublicKeyService.getUserProfileKey(ctx, address);
        const data = Buffer.from(profile.serialize());
        await ctx.stub.putState(key, data);
      }
    }
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
