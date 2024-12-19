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
  PK_INDEX_KEY,
  PublicKey,
  SigningScheme,
  UP_INDEX_KEY,
  UnauthorizedError,
  UserAlias,
  UserProfile,
  asValidUserAlias,
  normalizePublicKey,
  signatures
} from "@gala-chain/api";
import { Context } from "fabric-contract-api";

import { GalaChainContext } from "../types";
import {
  PkInvalidSignatureError,
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
    publicKey: string,
    userAlias: string,
    signing: SigningScheme
  ): Promise<void> {
    const key = PublicKeyService.getPublicKeyKey(ctx, userAlias);
    const obj = new PublicKey();
    obj.publicKey =
      signing !== SigningScheme.TON ? PublicKeyService.normalizePublicKey(publicKey) : publicKey;
    obj.signing = signing;
    const data = Buffer.from(obj.serialize());
    await ctx.stub.putState(key, data);
  }

  public static async putUserProfile(
    ctx: GalaChainContext,
    address: string,
    userAlias: UserAlias,
    signing: SigningScheme
  ): Promise<void> {
    const key = PublicKeyService.getUserProfileKey(ctx, address);
    const obj = new UserProfile();
    obj.alias = userAlias;

    if (signing === SigningScheme.TON) {
      obj.tonAddress = address;
    } else {
      obj.ethAddress = address;
    }

    const data = Buffer.from(obj.serialize());
    await ctx.stub.putState(key, data);
  }

  public static async deleteUserProfile(ctx: GalaChainContext, ethAddress: string): Promise<void> {
    const key = PublicKeyService.getUserProfileKey(ctx, ethAddress);
    await ctx.stub.deleteState(key);
  }

  public static getUserAddress(publicKey: string, signing: SigningScheme): string {
    return signing === SigningScheme.TON
      ? signatures.ton.getTonAddress(Buffer.from(publicKey, "base64"))
      : signatures.getEthAddress(signatures.getNonCompactHexPublicKey(publicKey));
  }

  public static async getUserProfile(ctx: Context, address: string): Promise<UserProfile | undefined> {
    const key = PublicKeyService.getUserProfileKey(ctx, address);
    const data = await ctx.stub.getState(key);

    if (data.length > 0) {
      const userProfile = ChainObject.deserialize<UserProfile>(UserProfile, data.toString());

      if (userProfile.roles === undefined) {
        userProfile.roles = Array.from(UserProfile.DEFAULT_ROLES);
      }

      return userProfile;
    }

    // check if we want the profile of the admin
    if (process.env.DEV_ADMIN_PUBLIC_KEY) {
      const nonCompactPK = signatures.getNonCompactHexPublicKey(process.env.DEV_ADMIN_PUBLIC_KEY);
      const adminEthAddress = signatures.getEthAddress(nonCompactPK);

      if (adminEthAddress === address) {
        const message =
          `User Profile is not saved on chain for user ${adminEthAddress}. ` +
          `But env variable DEV_ADMIN_PUBLIC_KEY is set for the user. ` +
          `Thus, the public key from env will be used.`;
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

        return adminProfile;
      }
    }

    return undefined;
  }

  public static getDefaultUserProfile(publicKey: string, signing: SigningScheme): UserProfile {
    const address = this.getUserAddress(publicKey, signing);
    const profile = new UserProfile();
    profile.alias = asValidUserAlias(`${signing.toLowerCase()}|${address}`);
    profile.ethAddress = signing === SigningScheme.ETH ? address : undefined;
    profile.tonAddress = signing === SigningScheme.TON ? address : undefined;
    profile.roles = Array.from(UserProfile.DEFAULT_ROLES);
    return profile;
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

  /**
   * Verifies if the data is properly signed. Throws exception instead.
   */
  public static async ensurePublicKeySignatureIsValid(
    ctx: GalaChainContext,
    userId: string,
    dto: ChainCallDTO
  ): Promise<PublicKey> {
    const pk = await PublicKeyService.getPublicKey(ctx, userId);

    if (pk === undefined) {
      throw new PkMissingError(userId);
    }

    const isSignatureValid = dto.isSignatureValid(pk.publicKey);

    if (!isSignatureValid) {
      throw new PkInvalidSignatureError(userId);
    }

    return pk;
  }

  public static async registerUser(
    ctx: GalaChainContext,
    providedPkHex: string,
    ethAddress: string,
    userAlias: UserAlias,
    signing: SigningScheme
  ): Promise<string> {
    const currPublicKey = await PublicKeyService.getPublicKey(ctx, userAlias);

    // If we are migrating a legacy user to new flow, the public key should match
    if (currPublicKey !== undefined) {
      const nonCompactCurrPubKey = signatures.getNonCompactHexPublicKey(currPublicKey.publicKey);
      if (nonCompactCurrPubKey !== providedPkHex) {
        throw new PkMismatchError(userAlias);
      }
    }

    // If User Profile already exists on chain for this ethereum address, we should not allow registering the same user again
    const existingUserProfile = await PublicKeyService.getUserProfile(ctx, ethAddress);
    if (existingUserProfile !== undefined) {
      throw new ProfileExistsError(ethAddress, existingUserProfile.alias);
    }

    // supports legacy flow (required for backwards compatibility)
    await PublicKeyService.putPublicKey(ctx, providedPkHex, userAlias, signing);

    // for the new flow, we need to store the user profile separately
    await PublicKeyService.putUserProfile(ctx, ethAddress, userAlias, signing);

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

    // need to fetch userProfile from old address
    const oldAddress = PublicKeyService.getUserAddress(oldPublicKey.publicKey, signing);
    const userProfile = await PublicKeyService.getUserProfile(ctx, oldAddress);

    // Note: we don't throw an error if userProfile is undefined in order to support legacy users with unsaved profiles
    if (userProfile !== undefined) {
      // remove old user profile
      await PublicKeyService.deleteUserProfile(ctx, oldAddress);
    }

    // update Public Key, and add user profile under new eth address
    await PublicKeyService.putPublicKey(ctx, newPkHex, userAlias, signing);
    await PublicKeyService.putUserProfile(ctx, newAddress, userAlias, signing);
  }

  public static async updateUserRoles(ctx: GalaChainContext, user: string, roles: string[]): Promise<void> {
    const publicKey = await PublicKeyService.getPublicKey(ctx, user);

    if (publicKey === undefined) {
      throw new PkNotFoundError(user);
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
