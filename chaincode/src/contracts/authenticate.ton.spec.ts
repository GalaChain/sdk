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
  RegisterTonUserDto,
  SigningScheme,
  UserProfile,
  createValidSubmitDTO,
  signatures
} from "@gala-chain/api";
import { TestChaincode, transactionSuccess } from "@gala-chain/test";
import { instanceToPlain, plainToClass } from "class-transformer";

import { PublicKeyContract } from "./PublicKeyContract";
import {
  TonUser,
  createRegisteredTonUser,
  createTonSignedDto,
  createTonUser
} from "./authenticate.testutils.spec";

/**
 * Tests below cover a wide range of scenarios for GetMyProfile method for TON signing scheme,
 * and in general, public key recovery and determining whether user is registered.
 * There is a lot of edge cases that needs to be tested out:
 * - Signature in DTO (valid or invalid)
 * - Public key in DTO (present or not)
 * - Public key on chain (present or not)
 *
 * Also for each of the above cases, we need to test if the signature is valid,
 * matches public key, etc.
 */

type Signature = (dto: ChainCallDTO, privateKey: string) => ChainCallDTO;
const __valid = labeled<Signature>("valid signature")((dto, privK) => createTonSignedDto(dto, privK));
const invalid = labeled<Signature>("invalid signature")((srcDto, privK) => {
  const dto = plainToClass(ChainCallDTO, instanceToPlain(srcDto));
  dto.signature = signatures.ton
    .getSignature({ invalid: true }, Buffer.from(privK, "base64"), undefined)
    .toString("base64");
  return dto;
});

type PublicKey = (dto: ChainCallDTO, u: TonUser) => void;
const signerKey = labeled<PublicKey>("signer key")((dto, u) => (dto.signerPublicKey = u.publicKey));
const signerAdd = labeled<PublicKey>("signer address")((dto, u) => (dto.signerAddress = u.tonAddress));
const _________ = labeled<PublicKey>("raw dto")(() => ({}));

type UserRegistered = (ch: TestChaincode) => Promise<TonUser>;
const ___registered = labeled<UserRegistered>("user registered")((ch) => createRegisteredTonUser(ch));
const notRegistered = labeled<UserRegistered>("user not registered")(() => createTonUser());

type Expectation = (response: unknown, user: TonUser) => void;
const Success = labeled<Expectation>("Success")((response, user) => {
  expect(response).toEqual(
    transactionSuccess({
      alias: user.alias,
      tonAddress: user.tonAddress,
      roles: UserProfile.DEFAULT_ROLES,
      pubKeyCount: 1,
      requiredSignatures: 1
    })
  );
});

const Error: (errorKey: string) => Expectation = (errorKey) =>
  labeled<Expectation>(errorKey)((response) => {
    expect(response).toEqual(expect.objectContaining({ Status: 0, ErrorKey: errorKey }));
  });

test.each([
  [__valid, _________, ___registered, Error("MISSING_SIGNER")],
  [__valid, _________, notRegistered, Error("MISSING_SIGNER")],
  [__valid, signerKey, ___registered, Success],
  [__valid, signerKey, notRegistered, Error("USER_NOT_REGISTERED")],
  [__valid, signerAdd, ___registered, Success],
  [__valid, signerAdd, notRegistered, Error("USER_NOT_REGISTERED")],
  [invalid, _________, ___registered, Error("MISSING_SIGNER")],
  [invalid, _________, notRegistered, Error("MISSING_SIGNER")],
  [invalid, signerKey, ___registered, Error("PK_INVALID_SIGNATURE")],
  [invalid, signerKey, notRegistered, Error("PK_INVALID_SIGNATURE")],
  [invalid, signerAdd, ___registered, Error("PK_INVALID_SIGNATURE")],
  [invalid, signerAdd, notRegistered, Error("USER_NOT_REGISTERED")]
])(
  "(%s, %s, %s) => %s",
  async (
    signatureFn: Signature,
    publicKeyFn: PublicKey,
    createUserFn: UserRegistered,
    expectation: Expectation
  ) => {
    // Given
    const chaincode = new TestChaincode([PublicKeyContract]);
    const userObj = await createUserFn(chaincode);

    const dto = new ChainCallDTO();
    dto.signing = SigningScheme.TON;
    publicKeyFn(dto, userObj);
    const signedDto = signatureFn(dto, userObj.privateKey);

    // When
    const response = await chaincode.invoke("PublicKeyContract:GetMyProfile", signedDto);

    // Then
    expectation(response, userObj);
  }
);

it("authenticates secondary TON key by address", async () => {
  const chaincode = new TestChaincode([PublicKeyContract]);

  const pair1 = await signatures.ton.genKeyPair();
  const pair2 = await signatures.ton.genKeyPair();
  const pk1 = Buffer.from(pair1.publicKey).toString("base64");
  const pk2 = Buffer.from(pair2.publicKey).toString("base64");
  const addr1 = signatures.ton.getTonAddress(pair1.publicKey);
  const addr2 = signatures.ton.getTonAddress(pair2.publicKey);

  const regDto = await createValidSubmitDTO(RegisterTonUserDto, {
    publicKeys: [pk1, pk2]
  });
  const regResp = await chaincode.invoke(
    "PublicKeyContract:RegisterTonUser",
    regDto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string)
  );
  expect(regResp).toEqual(transactionSuccess());

  const dto = new ChainCallDTO();
  dto.signing = SigningScheme.TON;
  dto.signerAddress = addr2;
  dto.sign(Buffer.from(pair2.secretKey).toString("base64"));
  dto.signerAddress = addr1;
  dto.sign(Buffer.from(pair1.secretKey).toString("base64"));
  dto.signerAddress = undefined;

  const resp = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto);
  expect(resp).toEqual(
    transactionSuccess({
      alias: `ton|${addr1}`,
      tonAddress: addr2,
      roles: UserProfile.DEFAULT_ROLES,
      pubKeyCount: 2,
      requiredSignatures: 2
    })
  );
});

// this is a hack to make pretty display of test cases
function labeled<F>(label: string): (fn: F) => F & { toString: () => string } {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (fn) => Object.assign(fn, { toString: () => label });
}
