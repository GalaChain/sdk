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
  GalaChainSuccessResponse,
  GetMyProfileDto,
  GetPublicKeyDto,
  RegisterUserDto,
  SigningScheme,
  SubmitCallDTO,
  UpdatePublicKeyDto,
  UpdateUserRolesDto,
  UserAlias,
  UserProfile,
  UserProfileStrict,
  UserRole,
  createValidDTO,
  createValidSubmitDTO,
  signatures
} from "@gala-chain/api";
import { asValidUserRef } from "@gala-chain/api";
import {
  TestChaincode,
  fixture,
  transactionErrorKey,
  transactionErrorMessageContains,
  transactionSuccess
} from "@gala-chain/test";

import { PublicKeyService } from "../services";
import { PublicKeyContract } from "./PublicKeyContract";
import {
  createDerSignedDto,
  createEthUser,
  createRegisteredMultiSigUserForUsers,
  createRegisteredUser,
  createSignedDto,
  createTonUser,
  createUser,
  getMyProfile,
  getPublicKey,
  getUserProfile
} from "./authenticate.testutils.spec";

it("should serve proper API", async () => {
  // Given
  const { contract, ctx } = fixture(PublicKeyContract);

  // When
  const response = await contract.GetContractAPI(ctx);

  // Then
  expect(response).toEqual(transactionSuccess());

  const api = response as unknown as GalaChainSuccessResponse<Record<string, unknown>>;
  api.Data.contractVersion = "0.0.0";
  api.Data.channelId = "channel-id";
  api.Data.chaincodeId = "chaincode-id";
  expect(response).toMatchSnapshot();
});

describe("RegisterUser", () => {
  it("should register user", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const keyPair = signatures.genKeyPair();
    const publicKey = keyPair.publicKey;
    const privateKey = keyPair.privateKey;
    const ethAddress = signatures.getEthAddress(publicKey);

    const dto = await createValidSubmitDTO(RegisterUserDto, { user: "client|user1" as UserAlias, publicKey });
    const signedDto = dto
      .withPublicKeySignedBy(privateKey)
      .signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

    // Then
    expect(response).toEqual(transactionSuccess());

    expect(await getPublicKey(chaincode, dto.user)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(publicKey)
      })
    );

    expect(await getUserProfile(chaincode, ethAddress)).toEqual(
      transactionSuccess({
        alias: dto.user,
        ethAddress,
        roles: UserProfile.DEFAULT_ROLES,
        signatureQuorum: 1
      })
    );
  });

  it("should fail when public key signature is missing or invalid", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const adminPrivateKey = process.env.DEV_ADMIN_PRIVATE_KEY as string;
    const keyPair = signatures.genKeyPair();

    // no public key signature (but DTO is signed by admin)
    const dto1 = await createValidSubmitDTO(RegisterUserDto, {
      user: "client|user1" as UserAlias,
      publicKey: keyPair.publicKey
    });
    const signedDto1 = dto1.signed(adminPrivateKey);

    // invalid public key signature (signed by wrong key)
    const dto2 = dto1.withPublicKeySignedBy(adminPrivateKey);
    const signedDto2 = dto2.signed(adminPrivateKey);

    // When
    const response1 = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto1);
    const response2 = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto2);

    // Then
    expect(response1).toEqual(transactionErrorKey("VALIDATION_FAILED"));
    expect(response1).toEqual(transactionErrorMessageContains("Public key signature is missing"));

    expect(response2).toEqual(transactionErrorKey("VALIDATION_FAILED"));
    expect(response2).toEqual(transactionErrorMessageContains("Invalid secp256k1 public key signature"));
  });

  it("should fail when user publicKey and UserProfile are already registered", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredUser(chaincode);

    const registerDto = await createValidSubmitDTO(RegisterUserDto, {
      publicKey: user.publicKey,
      user: user.alias
    });
    const signedRegisterDto = registerDto
      .withPublicKeySignedBy(user.privateKey)
      .signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const registerResponse = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto);

    // Then
    expect(registerResponse).toEqual(expect.objectContaining({ Status: 0, ErrorKey: "PK_EXISTS" }));
  });

  it("should fail when registering a new user with the same publiKey/eth address as existing user", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredUser(chaincode);

    const registerDto = await createValidSubmitDTO(RegisterUserDto, {
      publicKey: user.publicKey,
      user: "client|new_user" as UserAlias
    });
    const signedRegisterDto = registerDto
      .withPublicKeySignedBy(user.privateKey)
      .signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const registerResponse = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto);

    // Then
    expect(registerResponse).toEqual(expect.objectContaining({ Status: 0, ErrorKey: "PROFILE_EXISTS" }));
  });

  it("should register user with valid public key signature", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const newPrivateKey = "62fa12aaf85829fab618755747a7f75c256bfc5ceab2cc24c668c55f1985cfad";
    const newPublicKey =
      "040e8bda5af346c5a7a7312a94b34023e8c9610abf40e550de9696422312a9a67ea748dbe2686f9a115c58021fe538163285a97368f44b6bf8b13a8306c86e8c5a";
    const ethAddress = signatures.getEthAddress(newPublicKey);

    const registerDto = await createValidSubmitDTO(RegisterUserDto, {
      user: "client|user-with-signature" as UserAlias,
      publicKey: newPublicKey
    });
    const signedRegisterDto = registerDto
      .withPublicKeySignedBy(newPrivateKey)
      .signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto);

    // Then
    expect(response).toEqual(transactionSuccess());

    expect(await getPublicKey(chaincode, registerDto.user)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(newPublicKey)
      })
    );

    expect(await getUserProfile(chaincode, ethAddress)).toEqual(
      transactionSuccess({
        alias: registerDto.user,
        ethAddress,
        roles: UserProfile.DEFAULT_ROLES,
        signatureQuorum: 1
      })
    );
  });

  it("should reject registration with missing or invalid public key signature", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const newPublicKey =
      "040e8bda5af346c5a7a7312a94b34023e8c9610abf40e550de9696422312a9a67ea748dbe2686f9a115c58021fe538163285a97368f44b6bf8b13a8306c86e8c5a";
    // Wrong private key that doesn't correspond to newPublicKey
    const wrongPrivateKey = "0000000000000000000000000000000000000000000000000000000000000001";

    const registerDto = await createValidSubmitDTO(RegisterUserDto, {
      user: "client|user-missing-sig" as UserAlias,
      publicKey: newPublicKey
    });

    // Missing public key signature
    const signedRegisterDto1 = registerDto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);
    expect(signedRegisterDto1.publicKeySignature).toBeUndefined();

    // Invalid public key signature (signed by wrong private key that doesn't match newPublicKey)
    const signedRegisterDto2 = registerDto
      .withPublicKeySignedBy(wrongPrivateKey)
      .signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);
    expect(signedRegisterDto2.publicKeySignature).toBeDefined();

    // When
    const registerResponse1 = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto1);
    const registerResponse2 = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto2);

    // Then
    expect(registerResponse1).toEqual(transactionErrorKey("VALIDATION_FAILED"));
    expect(registerResponse1).toEqual(transactionErrorMessageContains("Public key signature is missing"));

    expect(registerResponse2).toEqual(transactionErrorKey("VALIDATION_FAILED"));
    expect(registerResponse2).toEqual(
      transactionErrorMessageContains("Invalid secp256k1 public key signature")
    );
  });

  // TODO: this test will be redesigned in a follow-up story
  it.skip("should fail when migrating existing user to UserProfile, but PublicKey doesn't match", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user2 = await createUser();
    chaincode.setCallingUser(user2.alias);
    const dto = await createValidSubmitDTO<RegisterUserDto>(RegisterUserDto, {
      user: user2.alias,
      publicKey: user2.publicKey
    });

    const response = await chaincode.invoke("PublicKeyContract:SavePublicKey", dto);
    expect(response).toEqual(transactionSuccess());

    const newPublicKey =
      "048e1adb2489bdd6f387da77315a8902be3a7a06bc10bedbd099cdfc5a59a74a4c0e14c1bebc8e38e9f0e18a466e1e603b8faab4d4d354afbb57d979f2b16886db";
    expect(newPublicKey).not.toEqual(user2.publicKey);
    expect(user2.publicKey.length).toEqual(newPublicKey.length);

    chaincode.setCallingUser("client|admin");
    const registerDto = await createValidSubmitDTO(RegisterUserDto, {
      publicKey: newPublicKey,
      user: user2.alias
    });
    const signedRegisterDto = registerDto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const registerResponse = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto);

    // Then
    expect(registerResponse).toEqual(expect.objectContaining({ Status: 0, ErrorKey: "PK_MISMATCH" }));

    // New key is saved
    const getPublicKeyDto = await createValidDTO<GetPublicKeyDto>(GetPublicKeyDto, { user: user2.alias });
    const savedPk = await chaincode.invoke("PublicKeyContract:GetPublicKey", getPublicKeyDto);
    expect(savedPk).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(user2.publicKey)
      })
    );
  });

  // TODO: this test will be redesigned in a follow-up story
  it.skip("should save UserProfile for existing legacy User", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user2 = await createUser();
    chaincode.setCallingUser(user2.alias);
    const dto = await createValidSubmitDTO<RegisterUserDto>(RegisterUserDto, {
      user: user2.alias,
      publicKey: user2.publicKey
    });

    const response = await chaincode.invoke(
      "PublicKeyContract:RegisterUser",
      dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string)
    );
    expect(response).toEqual(transactionSuccess());

    chaincode.setCallingUser("client|admin");
    const registerDto = await createValidSubmitDTO(RegisterUserDto, {
      publicKey: user2.publicKey,
      user: user2.alias
    });
    const signedRegisterDto = registerDto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const registerResponse = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto);

    // Then
    expect(registerResponse).toEqual(transactionSuccess());

    const getPublicKeyDto = await createValidDTO<GetPublicKeyDto>(GetPublicKeyDto, {
      user: registerDto.user
    });
    const getPublicKeyResponse = await chaincode.invoke("PublicKeyContract:GetPublicKey", getPublicKeyDto);
    expect(getPublicKeyResponse).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(user2.publicKey)
      })
    );
  });

  it("RegisterEthUser should return deprecation message", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const dto = await createValidSubmitDTO(SubmitCallDTO, {});
    const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:RegisterEthUser", signedDto);

    // Then
    expect(response).toEqual(transactionSuccess("Registration of eth| users is no longer required."));
  });
});

describe("UpdatePublicKey", () => {
  it("should allow to update public key", async () => {
    // Given
    const { chaincode, user } = await setup();
    const newPrivateKey = "62fa12aaf85829fab618755747a7f75c256bfc5ceab2cc24c668c55f1985cfad";
    const newPublicKey =
      "040e8bda5af346c5a7a7312a94b34023e8c9610abf40e550de9696422312a9a67ea748dbe2686f9a115c58021fe538163285a97368f44b6bf8b13a8306c86e8c5a";
    expect(newPublicKey).not.toEqual(user.publicKey);

    const updateDto = await createValidSubmitDTO(UpdatePublicKeyDto, { publicKey: newPublicKey });
    const signedUpdateDto = updateDto.withPublicKeySignedBy(newPrivateKey).signed(user.privateKey);

    // When
    const updateResponse = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", signedUpdateDto);

    // Then
    expect(updateResponse).toEqual(transactionSuccess());

    // New key is saved
    expect(await getPublicKey(chaincode, user.alias)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(newPublicKey)
      })
    );

    // New key works for signature verification
    const signedWithNewKey = updateDto.signed(newPrivateKey);
    const verifyResponse = await chaincode.invoke("PublicKeyContract:VerifySignature", signedWithNewKey);
    expect(verifyResponse).toEqual(transactionSuccess());
  });

  it("should reject update public key with missing or invalid public key signature", async () => {
    // Given
    const { chaincode, user } = await setup();
    const newPublicKey =
      "040e8bda5af346c5a7a7312a94b34023e8c9610abf40e550de9696422312a9a67ea748dbe2686f9a115c58021fe538163285a97368f44b6bf8b13a8306c86e8c5a";
    expect(newPublicKey).not.toEqual(user.publicKey);

    const updateDto = await createValidSubmitDTO(UpdatePublicKeyDto, { publicKey: newPublicKey });

    const signedUpdateDto1 = updateDto.signed(user.privateKey);
    expect(signedUpdateDto1.publicKeySignature).toBeUndefined();

    // public key signature is signed by old private key
    const signedUpdateDto2 = updateDto.withPublicKeySignedBy(user.privateKey).signed(user.privateKey);
    expect(signedUpdateDto2.publicKeySignature).toBeDefined();

    // When
    const updateResponse1 = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", signedUpdateDto1);
    const updateResponse2 = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", signedUpdateDto2);

    // Then
    expect(updateResponse1).toEqual(transactionErrorKey("VALIDATION_FAILED"));
    expect(updateResponse1).toEqual(transactionErrorMessageContains("Public key signature is missing"));

    expect(updateResponse2).toEqual(transactionErrorKey("VALIDATION_FAILED"));
    expect(updateResponse2).toEqual(transactionErrorMessageContains("Invalid public key signature"));

    // Old key is still there
    expect(await getPublicKey(chaincode, user.alias)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(user.publicKey)
      })
    );
  });

  it("should prevent new user from reusing old public key after update", async () => {
    // Given
    const { chaincode, user } = await setup();
    const oldPrivateKey = user.privateKey;
    const oldPublicKey = user.publicKey;

    const newPrivateKey = "62fa12aaf85829fab618755747a7f75c256bfc5ceab2cc24c668c55f1985cfad";
    const newPublicKey =
      "040e8bda5af346c5a7a7312a94b34023e8c9610abf40e550de9696422312a9a67ea748dbe2686f9a115c58021fe538163285a97368f44b6bf8b13a8306c86e8c5a";
    expect(newPublicKey).not.toEqual(user.publicKey);

    const updateDto = await createValidSubmitDTO(UpdatePublicKeyDto, { publicKey: newPublicKey });
    const signedUpdateDto = updateDto.withPublicKeySignedBy(newPrivateKey).signed(user.privateKey);

    // When
    const updateResponse = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", signedUpdateDto);

    // Then
    expect(updateResponse).toEqual(transactionSuccess());

    // New key is saved
    expect(await getPublicKey(chaincode, user.alias)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(newPublicKey)
      })
    );

    // New key works for signature verification
    const signedWithNewKey = updateDto.signed(newPrivateKey);
    const verifyResponse = await chaincode.invoke("PublicKeyContract:VerifySignature", signedWithNewKey);
    expect(verifyResponse).toEqual(transactionSuccess());

    // Case 1: new User Register under old public key. It is not allowed,
    // and the old public key GCUP-key is marked as invalidated.

    // Given
    const dto = await createValidSubmitDTO<RegisterUserDto>(RegisterUserDto, {
      user: "client|newUser" as UserAlias,
      publicKey: oldPublicKey
    });
    const signedDto = dto
      .withPublicKeySignedBy(oldPrivateKey)
      .signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

    // Then
    expect(response).toEqual(transactionErrorKey("PROFILE_EXISTS"));
    expect(response).toEqual(transactionErrorMessageContains("user client|invalidated"));
    expect(await getPublicKey(chaincode, dto.user)).toEqual(transactionErrorKey("PK_NOT_FOUND"));

    // Case 2: UpdatePublicKey with old public key. It also won't work because
    // the old GCUP-key is marked as invalidated.

    // Given
    const updateDto2 = await createValidSubmitDTO(UpdatePublicKeyDto, { publicKey: oldPublicKey });
    const signedUpdateDto2 = updateDto2.withPublicKeySignedBy(oldPrivateKey).signed(newPrivateKey);

    // When
    const response2 = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", signedUpdateDto2);

    // Then
    expect(response2).toEqual(transactionErrorKey("PROFILE_EXISTS"));
    expect(response2).toEqual(transactionErrorMessageContains("user client|invalidated"));

    // Case 3: UpdatePublicKey where dto is signed with old private key.
    // It won't work because the old GCUP-key is marked as invalidated.

    // Given
    const randomKeyPair = signatures.genKeyPair();
    const updateDto3 = await createValidSubmitDTO(UpdatePublicKeyDto, { publicKey: randomKeyPair.publicKey });
    const signedUpdateDto3 = updateDto3.signed(oldPrivateKey);

    // When
    const response3 = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", signedUpdateDto3);

    // Then
    const expectedMsg = `User client|invalidated does not have one of required roles: SUBMIT (has: no roles)`;
    expect(response3).toEqual(transactionErrorKey("MISSING_ROLE"));
    expect(response3).toEqual(transactionErrorMessageContains(expectedMsg));
  });
});

describe("VerifySignature", () => {
  it("should verify signature", async () => {
    // Given
    const { chaincode, user } = await setup();
    const signedDto = createSignedDto(new ChainCallDTO(), user.privateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:VerifySignature", signedDto);

    // Then
    expect(response).toEqual(transactionSuccess());
  });

  it("should fail to verify signature if signerPublicKey is different", async () => {
    // Given
    const { chaincode, user } = await setup();
    const otherUserPublicKey = process.env.DEV_ADMIN_PUBLIC_KEY as string;
    expect(otherUserPublicKey).not.toEqual(user.publicKey);

    const dto = new ChainCallDTO();
    dto.signerPublicKey = otherUserPublicKey;
    const signedDto = createSignedDto(dto, user.privateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:VerifySignature", signedDto);

    // Then
    expect(response).toEqual(transactionErrorKey("PUBLIC_KEY_MISMATCH"));
  });

  it("should verify DER signature", async () => {
    // Given
    const { chaincode, user } = await setup();
    const dto = new ChainCallDTO();
    dto.signerPublicKey = user.publicKey;
    const signedDto = createDerSignedDto(dto, user.privateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:VerifySignature", signedDto);

    // Then
    expect(response).toEqual(transactionSuccess());
  });

  it("should fail to verify DER signature if signerPublicKey is different", async () => {
    // Given
    const { chaincode, user } = await setup();
    const otherUserPublicKey = process.env.DEV_ADMIN_PUBLIC_KEY as string;
    expect(otherUserPublicKey).not.toEqual(user.publicKey);

    const dto = new ChainCallDTO();
    dto.signerPublicKey = otherUserPublicKey;
    const signedDto = createDerSignedDto(dto, user.privateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:VerifySignature", signedDto);

    // Then
    expect(response).toEqual(transactionErrorKey("PK_INVALID_SIGNATURE"));
  });
});

describe("GetMyProfile", () => {
  it("should get saved profile (client|)", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredUser(chaincode);
    expect(user.alias).toContain("client|");

    // regular signing
    const dto1 = new GetMyProfileDto();
    dto1.sign(user.privateKey);

    // DER + signerPublicKey
    const dto2 = new GetMyProfileDto();
    dto2.signerPublicKey = user.publicKey;
    dto2.sign(user.privateKey, true);

    // DER + signerAddress
    const dto3 = new GetMyProfileDto();
    dto3.signerAddress = asValidUserRef(user.ethAddress);
    dto3.sign(user.privateKey, true);

    // When
    const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);
    const resp2 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto2);
    const resp3 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto3);

    // Then
    expect(resp1).toEqual(
      transactionSuccess({
        alias: user.alias,
        ethAddress: user.ethAddress,
        roles: [UserRole.EVALUATE, UserRole.SUBMIT],
        signatureQuorum: 1,
        signers: [user.alias]
      })
    );
    expect(resp2).toEqual(resp1);
    expect(resp3).toEqual(resp1);
  });

  it("should get unregistered profile (eth|)", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createEthUser();
    expect(user.alias).toContain("eth|");

    // regular signing
    const dto1 = new GetMyProfileDto();
    dto1.sign(user.privateKey);

    // DER + signerPublicKey
    const dto2 = new GetMyProfileDto();
    dto2.signerPublicKey = user.publicKey;
    dto2.sign(user.privateKey, true);

    // DER + signerAddress
    const dto3 = new GetMyProfileDto();
    dto3.signerAddress = asValidUserRef(user.ethAddress);
    dto3.sign(user.privateKey, true);

    // When
    const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);
    const resp2 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto2);
    const resp3 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto3);

    // Then
    expect(resp1).toEqual(
      transactionSuccess({
        alias: user.alias,
        ethAddress: user.ethAddress,
        roles: [UserRole.EVALUATE, UserRole.SUBMIT],
        signatureQuorum: 1,
        signers: [user.alias]
      })
    );
    expect(resp2).toEqual(resp1);

    // it is not possible to recover public key from the provided payload
    expect(resp3).toEqual(transactionErrorKey("USER_NOT_REGISTERED"));
  });

  it("should get saved profile (client| with multiple signers)", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);

    const user1 = await createRegisteredUser(chaincode);
    const user2 = await createRegisteredUser(chaincode);
    const user3 = await createRegisteredUser(chaincode);

    const { alias } = await createRegisteredMultiSigUserForUsers(chaincode, {
      users: [user1, user2, user3],
      quorum: 2
    });

    const operationId = "asset-channel_basic-asset_PublicKeyContract:GetMyProfile";

    // signed by first and second key
    const dto1 = new GetMyProfileDto()
      .expiresInMs(60_000)
      .withSigner(alias)
      .withOperation(operationId)
      .signed(user1.privateKey)
      .signed(user2.privateKey);

    // signed by second and third key
    const dto2 = new GetMyProfileDto()
      .expiresInMs(60_000)
      .withSigner(alias)
      .withOperation(operationId)
      .signed(user2.privateKey)
      .signed(user3.privateKey);

    // signed by all keys
    const dto3 = new GetMyProfileDto()
      .expiresInMs(60_000)
      .withSigner(alias)
      .withOperation(operationId)
      .signed(user1.privateKey)
      .signed(user2.privateKey)
      .signed(user3.privateKey);

    // signed by first key only
    const dto4 = new GetMyProfileDto().withSigner(alias).withOperation(operationId).signed(user1.privateKey);

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
        signers: [user1.alias, user2.alias, user3.alias].sort()
      })
    );

    expect(resp2).toEqual(resp1);
    expect(resp3).toEqual(resp1);

    expect(resp4).toEqual(transactionErrorKey("UNAUTHORIZED"));
    expect(resp4).toEqual(
      transactionErrorMessageContains("Insufficient number of signatures: got 1, required 2.")
    );
  });
});

describe("UpdateUserRoles", () => {
  it("should allow registrar to update user roles for registered client| user", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);

    const adminPrivateKey = process.env.DEV_ADMIN_PRIVATE_KEY as string;
    const adminProfile = await getMyProfile(chaincode, adminPrivateKey);
    expect(adminProfile.Data?.roles).toContain(UserRole.REGISTRAR);

    const user = await createRegisteredUser(chaincode);
    const userProfile = await getUserProfile(chaincode, user.ethAddress);
    expect(userProfile.Data?.roles).not.toContain("CUSTOM_CLIENT_ROLE");
    expect(userProfile.Data?.alias).toContain("client|");

    const dto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: user.alias,
      roles: ["CUSTOM_CLIENT_ROLE"]
    }).signed(adminPrivateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:UpdateUserRoles", dto);

    // Then
    expect(response).toEqual(transactionSuccess());

    const updatedUserProfile = await getUserProfile(chaincode, user.ethAddress);
    expect(updatedUserProfile.Data?.roles).toContain("CUSTOM_CLIENT_ROLE");
  });

  it("should allow registrar to update user roles for non-registered eth| user", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const adminPrivateKey = process.env.DEV_ADMIN_PRIVATE_KEY as string;

    const user = await createEthUser();
    const userProfile = await getUserProfile(chaincode, user.ethAddress);
    expect(userProfile.Data).toBeUndefined();

    const dto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: user.alias,
      roles: ["CUSTOM_ETH_ROLE"]
    }).signed(adminPrivateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:UpdateUserRoles", dto);

    // Then
    expect(response).toEqual(transactionSuccess());

    const updatedUserProfile = await getUserProfile(chaincode, user.ethAddress);
    expect(updatedUserProfile.Data?.roles).toContain("CUSTOM_ETH_ROLE");
  });

  it("should allow registrar to update user roles for non-registered ton| user", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const adminPrivateKey = process.env.DEV_ADMIN_PRIVATE_KEY as string;

    const user = await createTonUser();
    const userProfile = await getUserProfile(chaincode, user.tonAddress);
    expect(userProfile.Data).toBeUndefined();

    const dto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: user.alias,
      roles: ["CUSTOM_TON_ROLE"]
    }).signed(adminPrivateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:UpdateUserRoles", dto);

    // Then
    expect(response).toEqual(transactionSuccess());

    const updatedUserProfile = await getUserProfile(chaincode, user.tonAddress);
    expect(updatedUserProfile.Data?.roles).toContain("CUSTOM_TON_ROLE");
  });

  it("should not allow user to update roles if they do not have the registrar role", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);

    const user = await createRegisteredUser(chaincode);
    const userProfile = await getUserProfile(chaincode, user.ethAddress);
    expect(userProfile.Data?.roles).not.toContain(UserRole.REGISTRAR);

    const dto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: user.alias,
      roles: ["CUSTOM_ROLE"]
    }).signed(user.privateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:UpdateUserRoles", dto);

    // Then
    expect(response).toEqual(transactionErrorKey("MISSING_ROLE"));
    expect(response).toEqual(
      transactionErrorMessageContains("does not have one of required roles: REGISTRAR")
    );
  });

  it("should allow to remove only some of self-roles", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);

    const adminPrivateKey = process.env.DEV_ADMIN_PRIVATE_KEY as string;
    const adminProfileResponse = await getMyProfile(chaincode, adminPrivateKey);
    expect(adminProfileResponse).toEqual(transactionSuccess());

    const adminProfile = adminProfileResponse.Data as UserProfileStrict;
    expect(adminProfile.roles).toEqual([
      UserRole.CURATOR,
      UserRole.EVALUATE,
      UserRole.REGISTRAR,
      UserRole.SUBMIT
    ]);

    const removeSubmitDto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: adminProfile.alias,
      roles: adminProfile.roles.filter((role) => role !== UserRole.SUBMIT)
    }).signed(adminPrivateKey);

    const removeCuratorDto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: adminProfile.alias,
      roles: UserProfile.ADMIN_ROLES.filter((role) => role !== UserRole.CURATOR)
    }).signed(adminPrivateKey);

    const removeRegistrarDto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: adminProfile.alias,
      roles: UserProfile.ADMIN_ROLES.filter((role) => role !== UserRole.REGISTRAR)
    }).signed(adminPrivateKey);

    // When
    const removeSubmitResp = await chaincode.invoke("PublicKeyContract:UpdateUserRoles", removeSubmitDto);
    const removeCuratorResp = await chaincode.invoke("PublicKeyContract:UpdateUserRoles", removeCuratorDto);
    const removeRegistrarResp = await chaincode.invoke(
      "PublicKeyContract:UpdateUserRoles",
      removeRegistrarDto
    );

    // Then
    expect(removeSubmitResp).toEqual(transactionSuccess());
    expect(removeCuratorResp).toEqual(
      transactionErrorMessageContains("Cannot remove own admin role: CURATOR")
    );
    expect(removeRegistrarResp).toEqual(
      transactionErrorMessageContains("Cannot remove own admin role: REGISTRAR")
    );

    const updatedAdminProfile = await getMyProfile(chaincode, adminPrivateKey);
    expect(updatedAdminProfile).toEqual(transactionSuccess());
    expect(updatedAdminProfile.Data?.roles).toEqual([UserRole.EVALUATE, ...UserProfile.ADMIN_ROLES].sort());
  });
});

async function setup() {
  const chaincode = new TestChaincode([PublicKeyContract]);
  const user = await createRegisteredUser(chaincode);
  chaincode.setCallingUser(user.alias);
  return { chaincode, user };
}
