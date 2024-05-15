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
  UP_INDEX_KEY,
  UserProfile,
  normalizePublicKey,
  signatures
} from "@gala-chain/api";
import { Context } from "fabric-contract-api";

import { GalaChainContext } from "../types";
import { PkInvalidSignatureError, PkMissingError } from "./PublicKeyError";

export class PublicKeyService {
  private static PK_INDEX_KEY = PK_INDEX_KEY;
  private static UP_INDEX_KEY = UP_INDEX_KEY;

  private static getPublicKeyKey(ctx: Context, userId: string): string {
    return ctx.stub.createCompositeKey(PublicKeyService.PK_INDEX_KEY, [userId]);
  }

  private static getUserProfileKey(ctx: Context, ethAddress: string): string {
    return ctx.stub.createCompositeKey(PublicKeyService.UP_INDEX_KEY, [ethAddress]);
  }

  public static normalizePublicKey = normalizePublicKey;

  public static async putPublicKey(ctx: GalaChainContext, publicKey: string, userId?: string): Promise<void> {
    const key = PublicKeyService.getPublicKeyKey(ctx, userId || ctx.callingUser);
    const obj = new PublicKey();
    obj.publicKey = PublicKeyService.normalizePublicKey(publicKey);
    const data = Buffer.from(obj.serialize());
    await ctx.stub.putState(key, data);
  }

  public static async putUserProfile(
    ctx: GalaChainContext,
    ethAddress: string,
    userAlias: string
  ): Promise<void> {
    const key = PublicKeyService.getUserProfileKey(ctx, ethAddress);
    const obj = new UserProfile();
    obj.ethAddress = ethAddress;
    obj.alias = userAlias;
    const data = Buffer.from(obj.serialize());
    await ctx.stub.putState(key, data);
  }

  public static async deleteUserProfile(ctx: GalaChainContext, ethAddress: string): Promise<void> {
    const key = PublicKeyService.getUserProfileKey(ctx, ethAddress);
    await ctx.stub.deleteState(key);
  }

  public static async getUserProfile(ctx: Context, ethAddress: string): Promise<UserProfile | undefined> {
    const key = PublicKeyService.getUserProfileKey(ctx, ethAddress);
    const data = await ctx.stub.getState(key);

    if (data.length > 0) {
      const userProfile = ChainObject.deserialize<UserProfile>(UserProfile, data.toString());

      return userProfile;
    }

    // check if we want the profile of the admin
    if (process.env.DEV_ADMIN_PUBLIC_KEY !== undefined && process.env.DEV_ADMIN_USER_ID !== undefined) {
      const nonCompactPK = signatures.getNonCompactHexPublicKey(process.env.DEV_ADMIN_PUBLIC_KEY);
      const adminEthAddress = signatures.getEthAddress(nonCompact);

      if (adminEthAddress === ethAddress) {
        const message =
          `User Profile is not saved on chain for user ${adminEthAddress}. ` +
          `But env variables DEV_ADMIN_USER_ID and DEV_ADMIN_PUBLIC_KEY are set for the user. ` +
          `Thus, the public key from env will be used.`;
        ctx.logging.getLogger().warn(message);

        const adminProfile = new UserProfile();
        adminProfile.ethAddress = adminEthAddress;
        adminProfile.alias = process.env.DEV_ADMIN_USER_ID;
        return adminProfile;
      }
    }

    return undefined;
  }

  public static async getPublicKey(ctx: Context, userId: string): Promise<PublicKey | undefined> {
    const key = PublicKeyService.getPublicKeyKey(ctx, userId);
    const data = await ctx.stub.getState(key);

    if (data.length > 0) {
      const publicKey = ChainObject.deserialize<PublicKey>(PublicKey, data.toString());

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
}
