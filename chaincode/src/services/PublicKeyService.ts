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
  PkMismatchError,
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
        userProfile.signatureQuorum = UserProfile.DEFAULT_SIGNATURE_QUORUM;
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
    profile.signatureQuorum = UserProfile.DEFAULT_SIGNATURE_QUORUM;

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

  // TODO test to verify that all user profile entries are saved
  public static async registerUser(
    ctx: GalaChainContext,
    publicKeys: string[],
    userAlias: UserAlias,
    signing: SigningScheme,
    signatureQuorum: number
  ): Promise<string> {
    const currPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);

    // First, validate that no user profile exists for any of the provided addresses
    for (const [index, publicKey] of publicKeys.entries()) {
      const currPubKey = currPublicKey?.getAllPublicKeys()?.[index];

      if (currPubKey !== undefined) {
        // Migration from legacy user is not supported for multiple public keys
        if (currPublicKey?.publicKeys) {
          throw new NotImplementedError("UpdatePublicKey when publicKeys is defined");
        }

        // If we are migrating a legacy user to new flow, the public key should match
        const providedPkHex = signatures.getNonCompactHexPublicKey(publicKey);
        const nonCompactCurrPubKey = signatures.getNonCompactHexPublicKey(currPubKey);
        if (nonCompactCurrPubKey !== providedPkHex) {
          throw new PkMismatchError(userAlias);
        }
      }

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

    await PublicKeyService.putPublicKey(ctx, publicKeys, userAlias, signing);

    return userAlias;
  }

  public static async updatePublicKey(
    ctx: GalaChainContext,
    newPkHex: string,
    newAddress: string,
    signing: SigningScheme
  ): Promise<void> {
    const userAlias = ctx.callingUser;

    // fetch old public key for finding old user profile
    const oldPublicKey = await PublicKeyService.getPublicKey(ctx, ctx.callingUser);
    if (oldPublicKey === undefined) {
      throw new PkNotFoundError(userAlias);
    }

    if (oldPublicKey.publicKey === undefined) {
      throw new NotImplementedError("UpdatePublicKey when publicKey is undefined");
    }

    // need to fetch userProfile from old address
    const oldAddress = PublicKeyService.getUserAddress(oldPublicKey.publicKey, signing);
    const userProfile = await PublicKeyService.getUserProfile(ctx, oldAddress);
    const signatureQuorum = userProfile?.signatureQuorum ?? UserProfile.DEFAULT_SIGNATURE_QUORUM;

    // Note: we don't throw an error if userProfile is undefined in order to support legacy users with unsaved profiles
    if (userProfile !== undefined) {
      // invalidate old user profile
      await PublicKeyService.invalidateUserProfile(ctx, oldAddress);
    }

    // ensure no user profile exists under new address
    const newUserProfile = await PublicKeyService.getUserProfile(ctx, newAddress);
    if (newUserProfile !== undefined) {
      throw new ProfileExistsError(newAddress, newUserProfile.alias);
    }

    // update Public Key, and add user profile under new eth address
    await PublicKeyService.putPublicKey(ctx, [newPkHex], userAlias, signing);
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
}

function log(s: string) {
  throw new Error(s);
}
