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
  AddSignerDto,
  GetMyProfileDto,
  RegisterUserDto,
  RemoveSignerDto,
  UpdatePublicKeyDto,
  UpdateQuorumDto,
  UpdateSignersDto,
  UpdateUserRolesDto,
  UserAlias,
  UserProfile,
  UserRole,
  asValidUserAlias,
  asValidUserRef,
  createValidSubmitDTO,
  signatures
} from "@gala-chain/api";
import {
  TestChaincode,
  transactionErrorKey,
  transactionErrorMessageContains,
  transactionSuccess
} from "@gala-chain/test";

import { PublicKeyContract } from "./PublicKeyContract";
import {
  createRegisteredMultiSigUser,
  createRegisteredMultiSigUserForUsers,
  createRegisteredUser,
  getPublicKey,
  getUserProfile
} from "./authenticate.testutils.spec";

describe("PublicKeyContract Multisignature", () => {
  describe("RegisterUser", () => {
    it("should register user with 3 signers", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const key1 = signatures.genKeyPair();
      const key2 = signatures.genKeyPair();
      const key3 = signatures.genKeyPair();

      const publicKeys = [key1.publicKey, key2.publicKey, key3.publicKey];
      const ethAddresses = publicKeys.map((pk) => signatures.getEthAddress(pk));
      const userAlias = asValidUserAlias("client|multisig-test");
      const signatureQuorum = 2;

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: userAlias,
        signers: ethAddresses.map(asValidUserRef),
        signatureQuorum
      });
      const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(transactionSuccess(userAlias));

      // Verify that a user profile pointing to user alias is saved
      const profileResponse = await getUserProfile(chaincode, userAlias);
      expect(profileResponse).toEqual(
        transactionSuccess({
          alias: userAlias,
          roles: UserProfile.DEFAULT_ROLES,
          signatureQuorum,
          signers: ethAddresses.sort().map((a) => `eth|${a}`)
        })
      );

      // No public key is stored for multisig users
      const publicKeyResponse = await getPublicKey(chaincode, userAlias);
      expect(publicKeyResponse).toEqual(transactionErrorKey("PK_NOT_FOUND"));
    });

    it("should fail when registering with duplicate signers", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const key1 = signatures.genKeyPair();
      const publicKeys = [key1.publicKey, key1.publicKey, key1.publicKey]; // All same key
      const ethAddresses = publicKeys.map((pk) => signatures.getEthAddress(pk));

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: "client|duplicate-test" as UserAlias,
        signers: ethAddresses.map(asValidUserRef),
        signatureQuorum: 2
      });
      const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(transactionErrorMessageContains("Found duplicate signers in"));
    });

    it("should fail when signature quorum exceeds number of public keys", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const key1 = signatures.genKeyPair();
      const key2 = signatures.genKeyPair();
      const publicKeys = [key1.publicKey, key2.publicKey];
      const ethAddresses = publicKeys.map((pk) => signatures.getEthAddress(pk));

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: asValidUserAlias("client|quorum-test"),
        signers: ethAddresses.map(asValidUserRef),
        signatureQuorum: 5 // More than available keys - this should fail
      });
      const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(
        transactionErrorMessageContains("Signature quorum cannot exceed number of signers")
      );
    });

    it("should use all signers as default signature quorum when not specified", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const key1 = signatures.genKeyPair();
      const key2 = signatures.genKeyPair();
      const key3 = signatures.genKeyPair();

      const userAlias = asValidUserAlias("client|default-quorum");

      const publicKeys = [key1.publicKey, key2.publicKey, key3.publicKey];
      const ethAddresses = publicKeys.map((pk) => signatures.getEthAddress(pk));

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: userAlias,
        signers: ethAddresses.map(asValidUserRef)
        // signatureQuorum not specified - should default to publicKeys.length
      });
      const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(transactionSuccess());

      // Verify that signature quorum is set to the number of public keys
      const profileResponse = await getUserProfile(chaincode, userAlias);
      expect(profileResponse).toEqual(
        transactionSuccess(
          expect.objectContaining({
            signatureQuorum: ethAddresses.length
          })
        )
      );
    });

    it("should fail to override existing multisig user with single signed user", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);

      const { alias } = await createRegisteredMultiSigUser(chaincode, { keys: 2, quorum: 1 });

      const newKey = signatures.genKeyPair();

      const dto = await createValidSubmitDTO(RegisterUserDto, {
        user: alias,
        publicKey: newKey.publicKey
      });
      const signedDto = dto
        .withPublicKeySignedBy(newKey.privateKey)
        .signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

      // When
      const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

      // Then
      expect(response).toEqual(transactionErrorKey("PROFILE_EXISTS"));
      expect(response).toEqual(
        transactionErrorMessageContains(`User profile is already saved for user ${alias}`)
      );
    });
  });

  describe("GetMyProfile", () => {
    it("should get saved profile (ETH) with multiple signers", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);

      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [keys1, keys2, keys3] = keys;
      const signers = keys.map((k) => `eth|${signatures.getEthAddress(k.publicKey)}`).sort();
      const operationId = "asset-channel_basic-asset_PublicKeyContract:GetMyProfile";

      // signed by first and second key
      const dto1 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .withSigner(alias)
        .signed(keys1.privateKey)
        .signed(keys2.privateKey);

      // signed by second and third key
      const dto2 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .withSigner(alias)
        .signed(keys2.privateKey)
        .signed(keys3.privateKey);

      // signed by all keys
      const dto3 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .withSigner(alias)
        .signed(keys1.privateKey)
        .signed(keys2.privateKey)
        .signed(keys3.privateKey);

      // signed by first key only
      const dto4 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .withSigner(alias)
        .signed(keys1.privateKey);

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
          signatureQuorum: 2,
          signers
        })
      );

      expect(resp2).toEqual(resp1);
      expect(resp3).toEqual(resp1);

      const err4Msg = "Insufficient number of signatures: got 1, required 2.";
      expect(resp4).toEqual(transactionErrorKey("UNAUTHORIZED"));
      expect(resp4).toEqual(transactionErrorMessageContains(err4Msg));
    });

    it("should fail when signing wrong operation", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [keys1, keys2] = keys;

      const correctMethod = "asset-channel_basic-asset_PublicKeyContract:GetMyProfile";
      const wrongMethod = "asset-channel_basic-asset_PublicKeyContract:Get42";

      // missing operation (requires manual addition of signatures)
      const dto1 = new GetMyProfileDto().expiresInMs(60_000).withSigner(alias);
      dto1.multisig = [
        signatures.getSignature(dto1, signatures.normalizePrivateKey(keys1.privateKey)),
        signatures.getSignature(dto1, signatures.normalizePrivateKey(keys2.privateKey))
      ];

      // signed with wrong method
      const dto2 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(wrongMethod)
        .withSigner(alias)
        .signed(keys1.privateKey)
        .signed(keys2.privateKey);

      // operation replaced after signing
      const dto3 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(wrongMethod)
        .withSigner(alias)
        .signed(keys1.privateKey)
        .signed(keys2.privateKey)
        .withOperation(correctMethod);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);
      const resp2 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto2);
      const resp3 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto3);

      // Then
      expect(resp1).toEqual(transactionErrorMessageContains("DTO operation is not provided"));

      const err2Msg = `The dto was signed to call ${wrongMethod} operation, but the current operation is ${correctMethod}.`;
      expect(resp2).toEqual(transactionErrorMessageContains(err2Msg));

      // signing is broken => recovers public key to non-existing user
      // and we cannot use default user for multisig even if the feature is enabled
      expect(resp3).toEqual(transactionErrorKey("UNAUTHORIZED"));
      expect(resp3).toEqual(transactionErrorMessageContains(`is not allowed to sign ${alias}.`));
    });

    it("should fail when signing with wrong combination of keys", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [keys1] = keys;
      const operationId = "asset-channel_basic-asset_PublicKeyContract:GetMyProfile";

      // Create a different key pair that's not registered
      const wrongKey = signatures.genKeyPair();

      // signed by one registered key and one wrong key
      const dto1 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .withSigner(alias)
        .signed(keys1.privateKey)
        .signed(wrongKey.privateKey);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);

      // Then
      expect(resp1).toEqual(transactionErrorKey("UNAUTHORIZED"));
      expect(resp1).toEqual(transactionErrorMessageContains(`is not allowed to sign ${alias}.`));
    });

    it("should fail when signing with duplicate keys", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [keys1] = keys;
      const operationId = "asset-channel_basic-asset_PublicKeyContract:GetMyProfile";

      // signed by the same key twice
      const dto1 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .withSigner(alias)
        .signed(keys1.privateKey)
        .signed(keys1.privateKey);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);

      // Then
      expect(resp1).toEqual(transactionErrorKey("DUPLICATE_SIGNER"));
      expect(resp1).toEqual(transactionErrorMessageContains("Duplicate signer in"));
    });

    it("should fail when missing signer address", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [keys1, keys2] = keys;
      const operationId = "asset-channel_basic-asset_PublicKeyContract:GetMyProfile";

      // signed by one registered key and one wrong key
      const dto1 = new GetMyProfileDto().expiresInMs(60_000).withOperation(operationId);

      // we need to manually add signatures, because of strict validation in `signed()` method
      dto1.multisig = [
        signatures.getSignature(dto1, signatures.normalizePrivateKey(keys1.privateKey)),
        signatures.getSignature(dto1, signatures.normalizePrivateKey(keys2.privateKey))
      ];

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);

      // Then
      expect(resp1).toEqual(transactionErrorKey("MULTIPLE_SIGNATURES_NOT_ALLOWED"));
      expect(resp1).toEqual(transactionErrorMessageContains("requires valid signerAddress"));
    });

    it("should fail when signing with wrong or mising DTO expiration time", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 2, quorum: 2 });
      const [keys1, keys2] = keys;
      const operationId = "asset-channel_basic-asset_PublicKeyContract:GetMyProfile";

      // no expiration requires manual addition of signatures
      const dto1 = new GetMyProfileDto().withOperation(operationId).withSigner(alias);
      dto1.multisig = [
        signatures.getSignature(dto1, signatures.normalizePrivateKey(keys1.privateKey)),
        signatures.getSignature(dto1, signatures.normalizePrivateKey(keys2.privateKey))
      ];

      // expired DTO
      const dto2 = new GetMyProfileDto()
        .expiresInMs(-1_000)
        .withOperation(operationId)
        .withSigner(alias)
        .signed(keys1.privateKey)
        .signed(keys2.privateKey);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);
      const resp2 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto2);

      // Then
      expect(resp1).toEqual(transactionErrorKey("MULTIPLE_SIGNATURES_NOT_ALLOWED"));
      expect(resp1).toEqual(transactionErrorMessageContains("requires valid signerAddress and dtoExpiresAt"));

      expect(resp2).toEqual(transactionErrorKey("EXPIRED"));
      expect(resp2).toEqual(transactionErrorMessageContains("DTO expired at"));
    });

    it("should work with single signature quorum requirements", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const operationId = "asset-channel_basic-asset_PublicKeyContract:GetMyProfile";

      // Test with quorum = 1 (any single key)
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 1 });
      const [key1] = keys;

      const individualUserRef = asValidUserRef(signatures.getEthAddress(key1.publicKey));
      const individualUserAlias = asValidUserAlias(`eth|${individualUserRef}`);
      const signers = keys.map((k) => `eth|${signatures.getEthAddress(k.publicKey)}`).sort();

      // Single signature, but no signer => individual profile
      const dto1 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .signed(key1.privateKey);

      // Single signature with individual signer => REDUNDANT_USER_ADDRESS error
      const dto2 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .withSigner(individualUserRef)
        .signed(key1.privateKey);

      // Single signature with multisig signer => multisig profile
      const dto3 = new GetMyProfileDto()
        .expiresInMs(60_000)
        .withOperation(operationId)
        .withSigner(alias)
        .signed(key1.privateKey);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);
      const resp2 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto2);
      const resp3 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto3);

      // Then
      expect(resp1).toEqual(
        transactionSuccess({
          alias: individualUserAlias,
          ethAddress: individualUserRef,
          roles: UserProfile.DEFAULT_ROLES,
          signatureQuorum: 1,
          signers: [`eth|${individualUserRef}`]
        })
      );

      expect(resp2).toEqual(transactionErrorKey("REDUNDANT_SIGNER_ADDRESS"));

      expect(resp3).toEqual(
        transactionSuccess({
          alias,
          roles: UserProfile.DEFAULT_ROLES,
          signatureQuorum: 1,
          signers
        })
      );
    });
  });

  describe("UpdatePublicKey", () => {
    it("should not allow to update public key for multisig user", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 1 });
      const [key1] = keys;
      const newKey = signatures.genKeyPair();

      const dto = (
        await createValidSubmitDTO(UpdatePublicKeyDto, {
          publicKey: newKey.publicKey,
          signerAddress: alias,
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:UpdatePublicKey"
        })
      )
        .withPublicKeySignedBy(newKey.privateKey)
        .signed(key1.privateKey);

      console.log("dto", JSON.stringify(dto, null, 2));

      // When
      const response = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", dto);

      // Then
      const errMsg = `No address known for user ${alias}`;
      expect(response).toEqual(transactionErrorKey("UNAUTHORIZED"));
      expect(response).toEqual(transactionErrorMessageContains(errMsg));
    });
  });

  describe("AddSigner", () => {
    it("should not allow to add signer to a single signed user", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const user1 = await createRegisteredUser(chaincode);
      const user2 = await createRegisteredUser(chaincode);

      const dto = await createValidSubmitDTO(AddSignerDto, {
        signer: user2.alias,
        dtoOperation: "asset-channel_basic-asset_PublicKeyContract:AddSigner",
        signerAddress: user1.alias
      }).signed(user1.privateKey);

      // When
      const response = await chaincode.invoke("PublicKeyContract:AddSigner", dto);

      // Then
      // Falls back to default single-signing logic, because the user profile is not multisig
      const errMsg = `Signer address recovered from signature is different from the one provided in dto.`;
      expect(response).toEqual(transactionErrorKey("ADDRESS_MISMATCH"));
      expect(response).toEqual(transactionErrorMessageContains(errMsg));
    });

    it("should add a second signer to a multisig user", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const user1 = await createRegisteredUser(chaincode);
      const user2 = await createRegisteredUser(chaincode);
      const multisigUser = await createRegisteredMultiSigUserForUsers(chaincode, {
        users: [user1],
        quorum: 1
      });

      // Create DTO with quorum signatures (1 out of 1)
      const dto = (
        await createValidSubmitDTO(AddSignerDto, {
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:AddSigner",
          signerAddress: multisigUser.alias,
          signer: user2.alias
        })
      )
        .expiresInMs(60_000)
        .signed(user1.privateKey);

      // When
      const response = await chaincode.invoke("PublicKeyContract:AddSigner", dto);

      // Then
      expect(response).toEqual(transactionSuccess());

      const profileResponse = await getUserProfile(chaincode, multisigUser.alias);
      expect(profileResponse).toEqual(
        transactionSuccess({
          alias: multisigUser.alias,
          roles: UserProfile.DEFAULT_ROLES,
          signatureQuorum: 1,
          signers: [user1.alias, user2.alias].sort()
        })
      );
    });

    it("should add a third signer to a multisig user", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const user1 = await createRegisteredUser(chaincode);
      const user2 = await createRegisteredUser(chaincode);
      const user3 = await createRegisteredUser(chaincode);
      const multisigUser = await createRegisteredMultiSigUserForUsers(chaincode, {
        users: [user1, user2],
        quorum: 2
      });

      // Create DTO with quorum signatures (1 out of 1)
      const dto = (
        await createValidSubmitDTO(AddSignerDto, {
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:AddSigner",
          signerAddress: multisigUser.alias,
          signer: user3.alias
        })
      )
        .expiresInMs(60_000)
        .signed(user1.privateKey)
        .signed(user2.privateKey);

      // When
      const response = await chaincode.invoke("PublicKeyContract:AddSigner", dto);

      // Then
      expect(response).toEqual(transactionSuccess());

      const profileResponse = await getUserProfile(chaincode, multisigUser.alias);
      expect(profileResponse).toEqual(
        transactionSuccess({
          alias: multisigUser.alias,
          roles: UserProfile.DEFAULT_ROLES,
          signatureQuorum: 2,
          signers: [user1.alias, user2.alias, user3.alias].sort()
        })
      );
    });
  });

  describe("RemoveSigner", () => {
    it("should remove public key for multisig user with quorum signatures", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [key1, key2, key3] = keys;

      const dtoOperation = "asset-channel_basic-asset_PublicKeyContract:RemoveSigner";

      const remove1Dto = (
        await createValidSubmitDTO(RemoveSignerDto, {
          signer: asValidUserRef(signatures.getEthAddress(key1.publicKey)),
          dtoOperation,
          signerAddress: alias
        })
      )
        .expiresInMs(60_000)
        .signed(key1.privateKey)
        .signed(key2.privateKey);

      const remove2Dto = (
        await createValidSubmitDTO(RemoveSignerDto, {
          signer: asValidUserRef(signatures.getEthAddress(key2.publicKey)),
          dtoOperation,
          signerAddress: alias
        })
      )
        .expiresInMs(60_000)
        .signed(key1.privateKey)
        .signed(key3.privateKey);

      const remove3Dto = (
        await createValidSubmitDTO(RemoveSignerDto, {
          signer: asValidUserRef(signatures.getEthAddress(key3.publicKey)),
          dtoOperation,
          signerAddress: alias
        })
      )
        .expiresInMs(60_000)
        .signed(key1.privateKey)
        .signed(key3.privateKey);

      // When
      const resp1 = await chaincode.invoke("PublicKeyContract:RemoveSigner", remove1Dto);
      const resp2 = await chaincode.invoke("PublicKeyContract:RemoveSigner", remove2Dto);
      const resp3 = await chaincode.invoke("PublicKeyContract:RemoveSigner", remove3Dto);

      // Then
      expect(resp1).toEqual(transactionErrorKey("VALIDATION_FAILED"));
      expect(resp1).toEqual(transactionErrorMessageContains("that is the calling transaction signer"));

      expect(resp2).toEqual(transactionSuccess());

      expect(resp3).toEqual(transactionErrorKey("VALIDATION_FAILED"));
      expect(resp3).toEqual(transactionErrorMessageContains("would make number of signers below quorum"));

      const profileResponse = await getUserProfile(chaincode, alias);
      expect(profileResponse).toEqual(
        transactionSuccess({
          alias,
          roles: UserProfile.DEFAULT_ROLES,
          signatureQuorum: 2,
          signers: [
            `eth|${signatures.getEthAddress(key1.publicKey)}`,
            `eth|${signatures.getEthAddress(key3.publicKey)}`
          ].sort()
        })
      );
    });
  });

  describe("UpdateSigners", () => {
    it("should add and remove signers in one call", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const user1 = await createRegisteredUser(chaincode);
      const user2 = await createRegisteredUser(chaincode);
      const user3 = await createRegisteredUser(chaincode);
      const user4 = await createRegisteredUser(chaincode);
      const multisigUser = await createRegisteredMultiSigUserForUsers(chaincode, {
        users: [user1, user2],
        quorum: 1
      });

      const dto = (
        await createValidSubmitDTO(UpdateSignersDto, {
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:UpdateSigners",
          signerAddress: multisigUser.alias,
          toAdd: [user3.alias, user4.alias],
          toRemove: [user2.alias]
        })
      )
        .expiresInMs(60_000)
        .signed(user1.privateKey);

      // When
      const response = await chaincode.invoke("PublicKeyContract:UpdateSigners", dto);

      // Then
      expect(response).toEqual(transactionSuccess());

      const profileResponse = await getUserProfile(chaincode, multisigUser.alias);
      expect(profileResponse).toEqual(
        transactionSuccess({
          alias: multisigUser.alias,
          roles: UserProfile.DEFAULT_ROLES,
          signatureQuorum: 1,
          signers: [user1.alias, user3.alias, user4.alias].sort()
        })
      );
    });

    it("should not allow removing self", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, { keys: 3, quorum: 2 });
      const [key1, key2] = keys;

      const dto = (
        await createValidSubmitDTO(UpdateSignersDto, {
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:UpdateSigners",
          signerAddress: alias,
          toRemove: [asValidUserRef(signatures.getEthAddress(key1.publicKey))]
        })
      )
        .expiresInMs(60_000)
        .signed(key1.privateKey)
        .signed(key2.privateKey);

      // When
      const response = await chaincode.invoke("PublicKeyContract:UpdateSigners", dto);

      // Then
      expect(response).toEqual(transactionErrorKey("VALIDATION_FAILED"));
      expect(response).toEqual(transactionErrorMessageContains("that is the calling transaction signer"));
    });

    it("should not allow adding a duplicate signer", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const user1 = await createRegisteredUser(chaincode);
      const user2 = await createRegisteredUser(chaincode);
      const multisigUser = await createRegisteredMultiSigUserForUsers(chaincode, {
        users: [user1, user2],
        quorum: 1
      });

      const dto = (
        await createValidSubmitDTO(UpdateSignersDto, {
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:UpdateSigners",
          signerAddress: multisigUser.alias,
          toAdd: [user2.alias]
        })
      )
        .expiresInMs(60_000)
        .signed(user1.privateKey);

      // When
      const response = await chaincode.invoke("PublicKeyContract:UpdateSigners", dto);

      // Then
      expect(response).toEqual(transactionErrorKey("VALIDATION_FAILED"));
      expect(response).toEqual(transactionErrorMessageContains("is already in the list of signers"));
    });

    it("should not allow to add and remove the same signer", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const user1 = await createRegisteredUser(chaincode);
      const user2 = await createRegisteredUser(chaincode);
      const user3 = await createRegisteredUser(chaincode);
      const multisigUser = await createRegisteredMultiSigUserForUsers(chaincode, {
        users: [user1, user2],
        quorum: 1
      });

      const dto = (
        await createValidSubmitDTO(UpdateSignersDto, {
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:UpdateSigners",
          signerAddress: multisigUser.alias,
          toAdd: [user3.alias],
          toRemove: [user3.alias]
        })
      )
        .expiresInMs(60_000)
        .signed(user1.privateKey);

      // When
      const response = await chaincode.invoke("PublicKeyContract:UpdateSigners", dto);

      // Then
      expect(response).toEqual(transactionErrorKey("VALIDATION_FAILED"));
      expect(response).toEqual(transactionErrorMessageContains("Cannot add and remove the same signer"));
    });
  });

  describe("UpdateQuorum", () => {
    it("should update quorum for multisig user with quorum signatures", async () => {
      // Given
      const chaincode = new TestChaincode([PublicKeyContract]);
      const { keys, alias } = await createRegisteredMultiSigUser(chaincode, {
        keys: 3,
        quorum: 2
      });
      const [key1, key2] = keys;

      const newQuorum = 1;
      const newInvalidQuorum = keys.length + 1;

      // Create DTO with quorum signatures (2 out of 3)
      const dto1 = (
        await createValidSubmitDTO(UpdateQuorumDto, {
          quorum: newQuorum,
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:UpdateQuorum",
          signerAddress: alias
        })
      )
        .expiresInMs(60_000)
        .signed(key1.privateKey)
        .signed(key2.privateKey);

      const dto2 = (
        await createValidSubmitDTO(UpdateQuorumDto, {
          quorum: newInvalidQuorum,
          dtoOperation: "asset-channel_basic-asset_PublicKeyContract:UpdateQuorum",
          signerAddress: alias
        })
      )
        .expiresInMs(60_000)
        .signed(key1.privateKey);

      // When
      const response1 = await chaincode.invoke("PublicKeyContract:UpdateQuorum", dto1);
      const response2 = await chaincode.invoke("PublicKeyContract:UpdateQuorum", dto2);

      // Then
      expect(response1).toEqual(transactionSuccess());
      expect(response2).toEqual(transactionErrorKey("VALIDATION_FAILED"));
      expect(response2).toEqual(
        transactionErrorMessageContains("Quorum cannot exceed number of signers (3)")
      );
    });
  });
});

describe("UpdateUserRoles", () => {
  async function setup() {
    const chaincode = new TestChaincode([PublicKeyContract]);
    const cfg = { keys: 3, quorum: 2 };
    const resp = await createRegisteredMultiSigUser(chaincode, cfg);
    return { chaincode, keys: resp.keys, alias: resp.alias, quorum: cfg.quorum };
  }

  it("should update user roles for multisig user with quorum signatures", async () => {
    // Given
    const { chaincode, keys, alias, quorum } = await setup();
    const [key1, key2, key3] = keys;

    expect(quorum).toEqual(2);
    const defaultRoles = [...UserProfile.DEFAULT_ROLES];
    const newRoles = [...defaultRoles, UserRole.REGISTRAR].sort();

    const dto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: alias,
      roles: newRoles
    }).signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:UpdateUserRoles", dto);

    // Then
    expect(response).toEqual(transactionSuccess());

    // Verify the new state
    const profileResponse = await getUserProfile(chaincode, alias);
    expect(profileResponse).toEqual(
      transactionSuccess({
        alias,
        roles: newRoles,
        signatureQuorum: quorum,
        signers: [
          `eth|${signatures.getEthAddress(key1.publicKey)}`,
          `eth|${signatures.getEthAddress(key2.publicKey)}`,
          `eth|${signatures.getEthAddress(key3.publicKey)}`
        ].sort()
      })
    );
  });
});
