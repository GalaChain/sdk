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
  GetMyProfileDto,
  PublicKey,
  RegisterUserDto,
  SigningScheme,
  UpdatePublicKeyDto,
  UserAlias,
  UserProfile,
  UserRole,
  createValidSubmitDTO,
  signatures
} from "@gala-chain/api";
import {
  TestChaincode,
  transactionErrorKey,
  transactionErrorMessageContains,
  transactionSuccess
} from "@gala-chain/test";

import { PublicKeyService } from "../services";
import { PublicKeyContract } from "./PublicKeyContract";
import { createRegisteredMultiSigUser, getPublicKey, getUserProfile } from "./authenticate.testutils.spec";

describe("PublicKeyContract Multisignature", () => {
  describe("RegisterUser with multiple public keys", () => {
    it("should register user with 3 public keys and save 3 user profile objects", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const key1 = signatures.genKeyPair();
      const key2 = signatures.genKeyPair();
      const key3 = signatures.genKeyPair();

      const publicKeys = [key1.publicKey, key2.publicKey, key3.publicKey];
      const ethAddresses = publicKeys.map((pk) => signatures.getEthAddress(pk));
      const userAlias = "client|multisig-test" as UserAlias;
      const signatureQuorum = 2;

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: userAlias,
        publicKeys,
        signatureQuorum
      });
      const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(transactionSuccess(userAlias));

      // Verify that all 3 user profile objects are saved
      for (const ethAddress of ethAddresses) {
        const profileResponse = await getUserProfile(chaincode, ethAddress);
        expect(profileResponse).toEqual(
          transactionSuccess({
            alias: userAlias,
            ethAddress,
            roles: UserProfile.DEFAULT_ROLES,
            signatureQuorum
          })
        );
      }

      // Verify that the public key is stored correctly
      const publicKeyResponse = await getPublicKey(chaincode, userAlias);
      expect(publicKeyResponse).toEqual(
        transactionSuccess({
          publicKeys: publicKeys.map((pk) => PublicKeyService.normalizePublicKey(pk)),
          signing: SigningScheme.ETH
        })
      );
    });

    it("should fail when registering with duplicate public keys", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const key1 = signatures.genKeyPair();
      const publicKeys = [key1.publicKey, key1.publicKey, key1.publicKey]; // All same key

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: "client|duplicate-test" as UserAlias,
        publicKeys,
        signatureQuorum: 2
      });
      const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(transactionErrorMessageContains("Found duplicate public keys"));
    });

    it("should fail when signature quorum exceeds number of public keys", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const key1 = signatures.genKeyPair();
      const key2 = signatures.genKeyPair();
      const publicKeys = [key1.publicKey, key2.publicKey];

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: "client|quorum-test" as UserAlias,
        publicKeys,
        signatureQuorum: 5 // More than available keys - this should fail
      });
      const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(
        transactionErrorMessageContains("Signature quorum cannot exceed number of public keys")
      );
    });

    it("should use all public keys as default signature quorum when not specified", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const key1 = signatures.genKeyPair();
      const key2 = signatures.genKeyPair();
      const key3 = signatures.genKeyPair();
      const publicKeys = [key1.publicKey, key2.publicKey, key3.publicKey];

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: "client|default-quorum" as UserAlias,
        publicKeys
        // signatureQuorum not specified - should default to publicKeys.length
      });
      const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(transactionSuccess());

      // Verify that signature quorum is set to the number of public keys
      const ethAddress = signatures.getEthAddress(publicKeys[0]);
      const profileResponse = await getUserProfile(chaincode, ethAddress);
      expect(profileResponse).toEqual(
        transactionSuccess(
          expect.objectContaining({
            signatureQuorum: 3 // Should be 3, same as publicKeys.length
          })
        )
      );
    });
  });

  describe("GetMyProfile with multiple public keys", () => {
    it("should get saved profile (ETH) with multiple public keys", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);

      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [keys1, keys2, keys3] = keys;

      // signed by first and second key
      const dto1 = new GetMyProfileDto().signed(keys1.privateKey).signed(keys2.privateKey);

      // signed by second and third key
      const dto2 = new GetMyProfileDto().signed(keys2.privateKey).signed(keys3.privateKey);

      // signed by all keys
      const dto3 = new GetMyProfileDto()
        .signed(keys1.privateKey)
        .signed(keys2.privateKey)
        .signed(keys3.privateKey);

      // signed by first key only
      const dto4 = new GetMyProfileDto().signed(keys1.privateKey);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);
      const resp2 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto2);
      const resp3 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto3);
      const resp4 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto4);

      // Then
      expect(resp1).toEqual(
        transactionSuccess({
          alias,
          roles: [UserRole.EVALUATE, UserRole.SUBMIT],
          signatureQuorum: 2
        })
      );

      expect(resp2).toEqual(resp1);
      expect(resp3).toEqual(resp1);

      expect(resp4).toEqual(transactionErrorKey("UNAUTHORIZED"));
      expect(resp4).toEqual(transactionErrorMessageContains("Insufficient signatures: got 1, required 2."));
    });

    it("should fail when signing with wrong combination of keys", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [keys1] = keys;

      // Create a different key pair that's not registered
      const wrongKey = signatures.genKeyPair();

      // signed by one registered key and one wrong key
      const dto1 = new GetMyProfileDto().signed(keys1.privateKey).signed(wrongKey.privateKey);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);

      // Then
      expect(resp1).toEqual(transactionErrorKey("USER_NOT_REGISTERED"));
    });

    it("should fail when signing with duplicate keys", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [keys1] = keys;

      // signed by the same key twice
      const dto1 = new GetMyProfileDto().signed(keys1.privateKey).signed(keys1.privateKey);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);

      // Then
      expect(resp1).toEqual(transactionErrorKey("DUPLICATE_SIGNER_PUBLIC_KEY"));
    });

    it("should work with different signature quorum requirements", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);

      // Test with quorum = 1 (any single key)
      const { keys: keys1, alias: alias1 } = await createRegisteredMultiSigUser(chaincode, {
        keys: 3,
        quorum: 1
      });
      const [key1_1] = keys1;

      // Test with quorum = 3 (all keys required)
      const { keys: keys2, alias: alias2 } = await createRegisteredMultiSigUser(chaincode, {
        keys: 3,
        quorum: 3
      });
      const [key2_1, key2_2, key2_3] = keys2;

      // When & Then
      // Quorum = 1: should work with any single key
      const dto1 = new GetMyProfileDto().signed(key1_1.privateKey);
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);
      expect(resp1).toEqual(
        transactionSuccess(
          expect.objectContaining({
            alias: alias1,
            signatureQuorum: 1
          })
        )
      );

      // Quorum = 3: should fail with only 2 keys
      const dto2 = new GetMyProfileDto().signed(key2_1.privateKey).signed(key2_2.privateKey);
      const resp2 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto2);
      expect(resp2).toEqual(transactionErrorKey("UNAUTHORIZED"));
      expect(resp2).toEqual(transactionErrorMessageContains("Insufficient signatures: got 2, required 3."));

      // Quorum = 3: should work with all 3 keys
      const dto3 = new GetMyProfileDto()
        .signed(key2_1.privateKey)
        .signed(key2_2.privateKey)
        .signed(key2_3.privateKey);
      const resp3 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto3);
      expect(resp3).toEqual(
        transactionSuccess(
          expect.objectContaining({
            alias: alias2,
            signatureQuorum: 3
          })
        )
      );
    });
  });

  describe("UpdatePublicKey with multiple public keys", () => {
    async function setup() {
      const chaincode = new TestChaincode([PublicKeyContract]);
      const cfg = { keys: 3, quorum: 2 };
      const resp = await createRegisteredMultiSigUser(chaincode, cfg);
      return { chaincode, keys: resp.keys, alias: resp.alias, quorum: cfg.quorum };
    }

    function userProfileKV(alias: UserAlias, publicKey: string, quorum: number): Record<string, string> {
      const up = new UserProfile();
      up.alias = alias;
      up.ethAddress = signatures.getEthAddress(publicKey);
      up.roles = [UserRole.EVALUATE, UserRole.SUBMIT];
      up.signatureQuorum = quorum;
      return {
        [`\u0000GCUP\u0000${up.ethAddress}\u0000`]: up.serialize()
      };
    }

    function userProfileInvalidatedKV(alias: UserAlias, publicKey: string): Record<string, string> {
      const up = new UserProfile();
      up.alias = `client|invalidated` as UserAlias;
      up.ethAddress = "0000000000000000000000000000000000000000";
      up.roles = [];
      return {
        [`\u0000GCUP\u0000${signatures.getEthAddress(publicKey)}\u0000`]: up.serialize()
      };
    }

    function publicKeyKV(alias: UserAlias, publicKeys: string[]): Record<string, string> {
      const pk = new PublicKey();
      pk.signing = SigningScheme.ETH;
      if (publicKeys.length === 1) {
        pk.publicKey = signatures.normalizePublicKey(publicKeys[0]).toString("base64");
      } else {
        pk.publicKeys = publicKeys.map((pk) => signatures.normalizePublicKey(pk).toString("base64"));
      }
      return {
        [`\u0000GCPK\u0000${alias}\u0000`]: pk.serialize()
      };
    }

    it("should update public key for multisig user with single signature", async () => {
      // Given
      const { chaincode, keys, alias, quorum } = await setup();
      const [key1, key2, key3] = keys;
      const newKey = signatures.genKeyPair();

      // verify the current state
      expect(chaincode.getState()).toEqual({
        ...userProfileKV(alias, key1.publicKey, quorum),
        ...userProfileKV(alias, key2.publicKey, quorum),
        ...userProfileKV(alias, key3.publicKey, quorum),
        ...publicKeyKV(alias, [key1.publicKey, key2.publicKey, key3.publicKey])
      });

      const dtoWrongQuorum = await createValidSubmitDTO(UpdatePublicKeyDto, newKey)
        .signed(key1.privateKey)
        .signed(key2.privateKey);
      expect(dtoWrongQuorum.signature).toBeUndefined();
      expect(dtoWrongQuorum.signatures?.length).toEqual(2);

      const dto = await createValidSubmitDTO(UpdatePublicKeyDto, newKey) //
        .signed(key3.privateKey);
      expect(dto.signature).toBeDefined();
      expect(dto.signatures).toBeUndefined();

      // When
      const failure = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", dtoWrongQuorum);
      const success = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", dto);

      // Then
      expect(failure).toEqual(transactionErrorKey("VALIDATION_FAILED"));
      expect(failure).toEqual(transactionErrorMessageContains("requires exactly 1 signature"));
      expect(success).toEqual(transactionSuccess());

      // Verify the new state
      expect(chaincode.getState()).toEqual({
        ...userProfileKV(alias, key1.publicKey, quorum),
        ...userProfileKV(alias, key2.publicKey, quorum),
        ...userProfileKV(alias, newKey.publicKey, quorum), // key3 was replaced by newKey
        ...publicKeyKV(alias, [key1.publicKey, key2.publicKey, newKey.publicKey]),
        ...userProfileInvalidatedKV(alias, key3.publicKey) // key3 profile was invalidated
      });
    });
  });
});
