import {
  ChainCallDTO,
  GalaChainResponse,
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
  const privateKey = "a2e0b584004a7dd3f6257078b38b4271cb39c7a3ecba4f2a2c541ef44a940922";
  const publicKey =
    "04215291d9d04aad96832bffe808acdc1d985b4b547c8b16f841e14e8fbfb11284d5a5a5c71d95bd520b90403abff8fe7ccf793e755baf69672ab6cf25b60fc942";
  const ethAddress = "a2a29d98b18C28EF5764f3944F01eEE1A54a668d";
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
  dto.signature = signatures.getSignature(dto, Buffer.from(privateKey, "hex"));
  expect(dto.signature).toHaveLength(130);
  return dto;
}

export function createDerSignedDto(unsigned: ChainCallDTO, privateKey: string) {
  const dto = instanceToInstance(unsigned);
  dto.signature = signatures.getDERSignature(dto, Buffer.from(privateKey, "hex"));
  expect([140, 142, 144]).toContain(dto.signature.length);
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

test.skip("Workaround", () => {
  // workaround for: Your test suite must contain at least one test.
});
