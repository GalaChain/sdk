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
  GalaChainResponse,
  GalaChainSuccessResponse,
  GetMyProfileDto,
  GetPublicKeyDto,
  RegisterEthUserDto,
  RegisterTonUserDto,
  RegisterUserDto,
  SigningScheme,
  UpdatePublicKeyDto,
  UpdateUserRolesDto,
  UserProfile,
  UserRole,
  createValidDTO,
  createValidSubmitDTO,
  randomUniqueKey,
  signatures
} from "@gala-chain/api";
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
  createRegisteredTonUser,
  createRegisteredUser,
  createSignedDto,
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
  expect(response).toMatchSnapshot();
});

describe("RegisterUser", () => {
  const publicKey =
    "04215291d9d04aad96832bffe808acdc1d985b4b547c8b16f841e14e8fbfb11284d5a5a5c71d95bd520b90403abff8fe7ccf793e755baf69672ab6cf25b60fc942";
  const ethAddress = signatures.getEthAddress(publicKey);

  it("should register user", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const dto = await createValidSubmitDTO(RegisterUserDto, { user: "client|user1", publicKey });
    const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

    // Then
    expect(response).toEqual(transactionSuccess());

    expect(await getPublicKey(chaincode, dto.user)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(publicKey),
        signing: SigningScheme.ETH
      })
    );

    expect(await getUserProfile(chaincode, ethAddress)).toEqual(
      transactionSuccess({
        alias: dto.user,
        ethAddress
      })
    );
  });

  it("should fail when user publicKey and UserProfile are already registered", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredUser(chaincode);

    const registerDto = await createValidSubmitDTO(RegisterUserDto, {
      publicKey: user.publicKey,
      user: user.alias
    });
    const signedRegisterDto = registerDto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const registerResponse = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto);

    // Then
    expect(registerResponse).toEqual(expect.objectContaining({ Status: 0, ErrorKey: "PROFILE_EXISTS" }));
  });

  it("should fail when registering a new user with the same publiKey/eth address as existing user", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredUser(chaincode);

    const registerDto = await createValidSubmitDTO(RegisterUserDto, {
      publicKey: user.publicKey,
      user: "client|new_user"
    });
    const signedRegisterDto = registerDto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const registerResponse = await chaincode.invoke("PublicKeyContract:RegisterUser", signedRegisterDto);

    // Then
    expect(registerResponse).toEqual(expect.objectContaining({ Status: 0, ErrorKey: "PROFILE_EXISTS" }));
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

  it("RegisterEthUser should register user with eth address", async () => {
    // Given
    const pkHex = signatures.getNonCompactHexPublicKey(publicKey);
    const ethAddress = signatures.getEthAddress(pkHex);
    const alias = `eth|${ethAddress}`;

    const chaincode = new TestChaincode([PublicKeyContract]);
    const dto = await createValidSubmitDTO<RegisterEthUserDto>(RegisterEthUserDto, { publicKey });
    const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:RegisterEthUser", signedDto);

    // Then
    expect(response).toEqual(transactionSuccess(alias));

    expect(await getPublicKey(chaincode, alias)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(publicKey),
        signing: SigningScheme.ETH
      })
    );

    expect(await getUserProfile(chaincode, ethAddress)).toEqual(
      transactionSuccess({
        alias,
        ethAddress
      })
    );
  });

  it("RegisterTonUser should register user with ton address", async () => {
    // Given
    const tonKeyPair = await signatures.ton.genKeyPair();
    const publicKey = Buffer.from(tonKeyPair.publicKey).toString("base64");
    const address = signatures.ton.getTonAddress(tonKeyPair.publicKey);
    const alias = `ton|${address}`;

    const chaincode = new TestChaincode([PublicKeyContract]);
    const dto = await createValidSubmitDTO<RegisterTonUserDto>(RegisterTonUserDto, { publicKey });
    const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:RegisterTonUser", signedDto);

    // Then
    expect(response).toEqual(transactionSuccess(alias));

    expect(await getPublicKey(chaincode, alias)).toEqual(
      transactionSuccess({
        publicKey,
        signing: SigningScheme.TON
      })
    );

    expect(await getUserProfile(chaincode, address)).toEqual(
      transactionSuccess({
        alias,
        tonAddress: address
      })
    );
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
    const signedUpdateDto = updateDto.signed(user.privateKey);

    // When
    const updateResponse = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", signedUpdateDto);

    // Then
    expect(updateResponse).toEqual(transactionSuccess());

    // New key is saved
    expect(await getPublicKey(chaincode, user.alias)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(newPublicKey),
        signing: SigningScheme.ETH
      })
    );

    // New key works for signature verification
    const signedWithNewKey = updateDto.signed(newPrivateKey);
    const verifyResponse = await chaincode.invoke("PublicKeyContract:VerifySignature", signedWithNewKey);
    expect(verifyResponse).toEqual(transactionSuccess());
  });

  it("should allow new user to save under old public key after update", async () => {
    // Given
    const { chaincode, user } = await setup();
    const oldPublicKey = user.publicKey;

    const newPrivateKey = "62fa12aaf85829fab618755747a7f75c256bfc5ceab2cc24c668c55f1985cfad";
    const newPublicKey =
      "040e8bda5af346c5a7a7312a94b34023e8c9610abf40e550de9696422312a9a67ea748dbe2686f9a115c58021fe538163285a97368f44b6bf8b13a8306c86e8c5a";
    expect(newPublicKey).not.toEqual(user.publicKey);

    const updateDto = await createValidSubmitDTO(UpdatePublicKeyDto, { publicKey: newPublicKey });
    const signedUpdateDto = updateDto.signed(user.privateKey);

    // When
    const updateResponse = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", signedUpdateDto);

    // Then
    expect(updateResponse).toEqual(transactionSuccess());

    // New key is saved
    expect(await getPublicKey(chaincode, user.alias)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(newPublicKey),
        signing: SigningScheme.ETH
      })
    );

    // New key works for signature verification
    const signedWithNewKey = updateDto.signed(newPrivateKey);
    const verifyResponse = await chaincode.invoke("PublicKeyContract:VerifySignature", signedWithNewKey);
    expect(verifyResponse).toEqual(transactionSuccess());

    // new User Register under old public key
    // Given
    const dto = await createValidSubmitDTO<RegisterUserDto>(RegisterUserDto, {
      user: "client|newUser",
      publicKey: oldPublicKey
    });
    const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);

    // When
    const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);

    // Then
    expect(response).toEqual(transactionSuccess());

    expect(await getPublicKey(chaincode, dto.user)).toEqual(
      transactionSuccess({
        publicKey: PublicKeyService.normalizePublicKey(oldPublicKey),
        signing: SigningScheme.ETH
      })
    );
  });

  it("should update TON public key", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredTonUser(chaincode);
    const newPair = await signatures.ton.genKeyPair();
    const dto = await createValidSubmitDTO(UpdatePublicKeyDto, {
      publicKey: Buffer.from(newPair.publicKey).toString("base64"),
      signerPublicKey: user.publicKey,
      signing: SigningScheme.TON
    });

    // When
    const response = await chaincode.invoke("PublicKeyContract:UpdatePublicKey", dto.signed(user.privateKey));

    // Then
    expect(response).toEqual(transactionSuccess());

    expect(await getPublicKey(chaincode, user.alias)).toEqual(
      transactionSuccess({
        publicKey: dto.publicKey,
        signing: SigningScheme.TON
      })
    );
  });

  it("should prevent from changing key type", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const tonUser = await createRegisteredTonUser(chaincode);
    const ethUser = await createRegisteredUser(chaincode);

    const ethKeyPair = signatures.genKeyPair();
    const tonKeyPair = await signatures.ton.genKeyPair();

    const dtoTonToEth = await createValidSubmitDTO(UpdatePublicKeyDto, {
      publicKey: ethKeyPair.publicKey,
      signerPublicKey: tonUser.publicKey,
      signing: SigningScheme.TON
    });

    const dtoEthToTon = await createValidSubmitDTO(UpdatePublicKeyDto, {
      publicKey: Buffer.from(tonKeyPair.publicKey).toString("base64")
    });

    // When
    const responseTonToEth = await chaincode.invoke(
      "PublicKeyContract:UpdatePublicKey",
      dtoTonToEth.signed(tonUser.privateKey)
    );

    const responseEthToTon = await chaincode.invoke(
      "PublicKeyContract:UpdatePublicKey",
      dtoEthToTon.signed(ethUser.privateKey)
    );

    // Then
    expect(responseTonToEth).toEqual(transactionErrorMessageContains("Invalid public key length"));
    expect(responseEthToTon).toEqual(transactionErrorMessageContains("Public key seems to be invalid"));

    // Old keys are still there
    expect(await getPublicKey(chaincode, tonUser.alias)).toEqual(
      transactionSuccess({
        publicKey: tonUser.publicKey,
        signing: SigningScheme.TON
      })
    );
    expect(await getPublicKey(chaincode, ethUser.alias)).toEqual(
      transactionSuccess({
        publicKey: signatures.normalizePublicKey(ethUser.publicKey).toString("base64"),
        signing: SigningScheme.ETH
      })
    );
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
  it("should get saved profile (ETH)", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredUser(chaincode);

    // regular signing
    const dto1 = new GetMyProfileDto();
    dto1.sign(user.privateKey);

    // DER + signerPublicKey
    const dto2 = new GetMyProfileDto();
    dto2.signerPublicKey = user.publicKey;
    dto2.sign(user.privateKey, true);

    // DER + signerAddress
    const dto3 = new GetMyProfileDto();
    dto3.signerAddress = user.ethAddress;
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
        roles: [UserRole.EVALUATE, UserRole.SUBMIT]
      })
    );
    expect(resp2).toEqual(resp1);
    expect(resp3).toEqual(resp1);
  });

  it("should get saved profile (TON)", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredTonUser(chaincode);

    const dto1 = new GetMyProfileDto();
    dto1.signing = SigningScheme.TON;
    dto1.signerPublicKey = user.publicKey;
    dto1.sign(user.privateKey, true);

    const dto2 = new GetMyProfileDto();
    dto2.signing = SigningScheme.TON;
    dto2.signerAddress = user.tonAddress;
    dto2.sign(user.privateKey, true);

    // When
    const resp1 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto1);
    const resp2 = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto2);

    // Then
    expect(resp1).toEqual(
      transactionSuccess({
        alias: user.alias,
        tonAddress: user.tonAddress,
        roles: UserProfile.DEFAULT_ROLES
      })
    );
    expect(resp2).toEqual(resp1);
  });
});

describe("UpdateUserRoles", () => {
  it("should update user roles", async () => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);

    // admin has curator role
    const adminPrivateKey = process.env.DEV_ADMIN_PRIVATE_KEY as string;
    const adminProfileResp = await getMyProfile(chaincode, adminPrivateKey);
    expect(adminProfileResp).toEqual(
      transactionSuccess(
        expect.objectContaining({ roles: [UserRole.CURATOR, UserRole.EVALUATE, UserRole.SUBMIT] })
      )
    );

    // test users
    const user1 = await createRegisteredUser(chaincode);
    const user2 = await createRegisteredUser(chaincode);

    function setCuratorRole(user: string, signerPrivateKey: string) {
      return updateUserRoles(chaincode, user, [UserRole.CURATOR], signerPrivateKey);
    }

    // When
    const notAllowedByUser1 = await setCuratorRole(user2.alias, user1.privateKey);
    const allowedByAdmin = await setCuratorRole(user1.alias, adminPrivateKey);
    const allowedByUser1 = await setCuratorRole(user2.alias, user1.privateKey);

    // Then
    expect(notAllowedByUser1).toEqual(
      transactionErrorMessageContains("does not have one of required roles: CURATOR")
    );
    expect(allowedByAdmin).toEqual(transactionSuccess());
    expect(allowedByUser1).toEqual(transactionSuccess());
  });

  function updateUserRoles(
    chaincode: TestChaincode,
    user: string,
    roles: UserRole[],
    signerPrivateKey: string
  ): Promise<GalaChainResponse<any>> {
    const dto = new UpdateUserRolesDto();
    dto.user = user;
    dto.roles = roles;
    dto.uniqueKey = randomUniqueKey();
    dto.sign(signerPrivateKey);

    return chaincode.invoke("PublicKeyContract:UpdateUserRoles", dto);
  }
});

async function setup() {
  const chaincode = new TestChaincode([PublicKeyContract]);
  const user = await createRegisteredUser(chaincode);
  chaincode.setCallingUser(user.alias);
  return { chaincode, user };
}
