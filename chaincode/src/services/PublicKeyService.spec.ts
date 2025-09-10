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
import { ChainObject, SigningScheme, UserAlias, UserProfile } from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import TestGalaContract from "../__test__/TestGalaContract";
import { GalaChainContext } from "../types";
import { PublicKeyService } from "./PublicKeyService";

it(`should normalize secp256k1 public key`, async () => {
  // Given
  // source: https://privatekeys.pw/key/e0b739030ad0edaf7dcda1bf6675da9519dc994edf48a827904e7fc947a16543#public
  const inputBase64Compressed = "Arcbr1zlt/HN/ILijy/v2mJ2whRs0Zfl+hD6/h9+ravH";
  const inputBase64 =
    "BLcbr1zlt/HN/ILijy/v2mJ2whRs0Zfl+hD6/h9+ravHeN8bcGXUC5ndxTtKogYk+b1TElMCu+2VlC2BujwT1qY=";

  const inputHexCompressed = "02b71baf5ce5b7f1cdfc82e28f2fefda6276c2146cd197e5fa10fafe1f7eadabc7";
  const inputHex =
    "04b71baf5ce5b7f1cdfc82e28f2fefda6276c2146cd197e5fa10fafe1f7eadabc778df1b7065d40b99ddc53b4aa20624f9bd53125302bbed95942d81ba3c13d6a6";

  const inputHex0xCompressed = `0x${inputHexCompressed}`;
  const inputHex0x = `0x${inputHex}`;

  const inputInvalid1 = inputBase64 + "a"; // invalid length
  const inputInvalid2 = inputHex.replace("0", "1");

  // When
  const keyFromBase64C = PublicKeyService.normalizePublicKey(inputBase64Compressed);
  const keyFromBase64 = PublicKeyService.normalizePublicKey(inputBase64);
  const keyFromHexC = PublicKeyService.normalizePublicKey(inputHexCompressed);
  const keyFromHex = PublicKeyService.normalizePublicKey(inputHex);
  const keyFromHex0xC = PublicKeyService.normalizePublicKey(inputHex0xCompressed);
  const keyFromHex0x = PublicKeyService.normalizePublicKey(inputHex0x);
  const fails1 = new Promise((res) => res(PublicKeyService.normalizePublicKey(inputInvalid1)));
  const fails2 = new Promise((res) => res(PublicKeyService.normalizePublicKey(inputInvalid2)));

  // Then
  expect(keyFromBase64C).toEqual(inputBase64Compressed);
  expect(keyFromBase64).toEqual(inputBase64Compressed);
  expect(keyFromHexC).toEqual(inputBase64Compressed);
  expect(keyFromHex).toEqual(inputBase64Compressed);
  expect(keyFromHex0xC).toEqual(inputBase64Compressed);
  expect(keyFromHex0x).toEqual(inputBase64Compressed);
  expect(await fails1.catch((e) => e.message)).toEqual(expect.stringContaining("Cannot normalize secp256k1"));
  expect(await fails2.catch((e) => e.message)).toEqual(expect.stringContaining("Unknown point format"));
});

it("should put user profiles for all unique addresses derived from public keys", async () => {
  const { ctx, getWrites } = fixture<GalaChainContext, TestGalaContract>(TestGalaContract).callingUser(
    users.testUser1
  );

  const pk1 = users.random().publicKey;
  const pk2 = users.random().publicKey;
  const alias = "client|multi" as UserAlias;

  await PublicKeyService.registerUser(ctx, [pk1, pk2], alias, SigningScheme.ETH);

  await ctx.stub.flushWrites();

  const addr1 = PublicKeyService.getUserAddress(pk1, SigningScheme.ETH);
  const addr2 = PublicKeyService.getUserAddress(pk2, SigningScheme.ETH);
  const key1 = PublicKeyService.getUserProfileKey(ctx, addr1);
  const key2 = PublicKeyService.getUserProfileKey(ctx, addr2);
  const wrongKey = PublicKeyService.getUserProfileKey(
    ctx,
    "0000000000000000000000000000000000000000"
  );

  const writes = getWrites();
  expect(Object.keys(writes)).toContain(key1);
  expect(Object.keys(writes)).toContain(key2);
  expect(Object.keys(writes)).not.toContain(wrongKey);

  const profile1 = ChainObject.deserialize<UserProfile>(UserProfile, writes[key1]);
  const profile2 = ChainObject.deserialize<UserProfile>(UserProfile, writes[key2]);

  expect(profile1.alias).toBe(alias);
  expect(profile2.alias).toBe(alias);
  expect(profile1.pubKeyCount).toBe(2);
  expect(profile1.requiredSignatures).toBe(2);
  expect(profile2.pubKeyCount).toBe(2);
  expect(profile2.requiredSignatures).toBe(2);
});

it("should load legacy public key format", async () => {
  const { ctx } = fixture<GalaChainContext, TestGalaContract>(TestGalaContract).callingUser(
    users.testUser1
  );

  const alias = "client|legacy" as UserAlias;
  const pk = users.random().publicKey;
  const pkKey = PublicKeyService.getPublicKeyKey(ctx, alias);
  const legacyPk = JSON.stringify({ publicKey: pk, signing: SigningScheme.ETH });
  await ctx.stub.putState(pkKey, Buffer.from(legacyPk));

  const loaded = await PublicKeyService.getPublicKey(ctx, alias);

  expect(loaded?.publicKeys).toEqual([pk]);
  expect(loaded?.publicKey).toEqual(pk);
});

it("should populate profile counts for legacy entries", async () => {
  const { ctx } = fixture<GalaChainContext, TestGalaContract>(TestGalaContract).callingUser(
    users.testUser1
  );

  const alias = "client|profile" as UserAlias;
  const pk1 = users.random().publicKey;
  const pk2 = users.random().publicKey;

  const pkKey = PublicKeyService.getPublicKeyKey(ctx, alias);
  const pkObj = { publicKeys: [pk1, pk2], signing: SigningScheme.ETH };
  await ctx.stub.putState(pkKey, Buffer.from(JSON.stringify(pkObj)));

  const address = PublicKeyService.getUserAddress(pk1, SigningScheme.ETH);
  const profileKey = PublicKeyService.getUserProfileKey(ctx, address);
  const legacyProfile = JSON.stringify({ alias, ethAddress: address, roles: ["SUBMIT"] });
  await ctx.stub.putState(profileKey, Buffer.from(legacyProfile));

  const profile = await PublicKeyService.getUserProfile(ctx, address);

  expect(profile?.pubKeyCount).toBe(2);
  expect(profile?.requiredSignatures).toBe(2);
});
