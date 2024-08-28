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
  GetMyProfileDto,
  GetObjectDto,
  GetPublicKeyDto,
  PublicKey,
  RegisterTonUserDto,
  RegisterUserDto,
  SigningScheme,
  UserProfile,
  createValidDTO,
  signatures
} from "@gala-chain/api";
import { transactionSuccess } from "@gala-chain/test";
import { instanceToInstance } from "class-transformer";
import { randomUUID } from "crypto";

import TestChaincode from "../__test__/TestChaincode";

export interface User {
  alias: string;
  privateKey: string;
  publicKey: string;
  ethAddress: string;
}

export interface TonUser {
  alias: string;
  privateKey: string;
  publicKey: string;
  tonAddress: string;
}

export async function createUser(): Promise<User> {
  const name = "client|user-" + randomUUID();
  const { privateKey, publicKey } = signatures.genKeyPair();
  const ethAddress = signatures.getEthAddress(publicKey);
  return { alias: name, privateKey, publicKey, ethAddress };
}

export async function createRegisteredUser(chaincode: TestChaincode): Promise<User> {
  const { alias, privateKey, publicKey, ethAddress } = await createUser();
  const dto = await createValidDTO(RegisterUserDto, { user: alias, publicKey });
  const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);
  const response = await chaincode.invoke("PublicKeyContract:RegisterUser", signedDto);
  expect(response).toEqual(transactionSuccess());
  return { alias: alias, privateKey, publicKey, ethAddress };
}

export async function createTonUser(): Promise<TonUser> {
  const pair = await signatures.ton.genKeyPair();
  const privateKey = Buffer.from(pair.secretKey).toString("base64");
  const publicKey = Buffer.from(pair.publicKey).toString("base64");
  const tonAddress = signatures.ton.getTonAddress(pair.publicKey);
  const alias = `ton|${tonAddress}`;
  return { alias, privateKey, publicKey, tonAddress };
}

export async function createRegisteredTonUser(chaincode: TestChaincode): Promise<TonUser> {
  const user = await createTonUser();
  const dto = await createValidDTO(RegisterTonUserDto, { publicKey: user.publicKey });
  const signedDto = dto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);
  const response = await chaincode.invoke("PublicKeyContract:RegisterTonUser", signedDto);
  expect(response).toEqual(transactionSuccess());
  return user;
}

export function createSignedDto(unsigned: ChainCallDTO, privateKey: string) {
  const dto = instanceToInstance(unsigned);
  const keyBuff = signatures.normalizePrivateKey(privateKey);
  dto.signature = signatures.getSignature(dto, keyBuff);
  expect(dto.signature).toHaveLength(130);
  return dto;
}

export function createDerSignedDto(unsigned: ChainCallDTO, privateKey: string) {
  const dto = instanceToInstance(unsigned);
  const keyBuff = signatures.normalizePrivateKey(privateKey);
  dto.signature = signatures.getDERSignature(dto, keyBuff);
  expect([138, 140, 142, 144]).toContain(dto.signature.length);
  return dto;
}

export function createTonSignedDto(unsigned: ChainCallDTO, privateKey: string) {
  const dto = instanceToInstance(unsigned);
  dto.signing = SigningScheme.TON;

  const sigBuff = signatures.ton.getSignature(dto, Buffer.from(privateKey, "base64"), undefined);
  expect(sigBuff).toHaveLength(64);

  dto.signature = sigBuff.toString("base64");
  return dto;
}

export async function getPublicKey(
  chaincode: TestChaincode,
  userAlias?: string
): Promise<GalaChainResponse<PublicKey>> {
  const dto = await createValidDTO<GetPublicKeyDto>(GetPublicKeyDto, { user: userAlias });
  return chaincode.invoke("PublicKeyContract:GetPublicKey", dto);
}

export async function getUserProfile(
  chaincode: TestChaincode,
  address: string
): Promise<GalaChainResponse<UserProfile>> {
  const dto = await createValidDTO(GetObjectDto, {
    objectId: `\u0000GCUP\u0000${address}\u0000`
  });
  return chaincode.invoke("PublicKeyContract:GetObjectByKey", dto);
}

export async function getMyProfile(
  chaincode: TestChaincode,
  privateKey: string
): Promise<GalaChainResponse<UserProfile>> {
  const dto = new GetMyProfileDto();
  dto.sign(privateKey);
  return chaincode.invoke("PublicKeyContract:GetMyProfile", dto);
}

test.skip("Workaround", () => {
  // workaround for: Your test suite must contain at least one test.
});
