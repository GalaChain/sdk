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
import { ChainCallDTO, SigningScheme, UserProfile, asValidUserRef, signatures } from "@gala-chain/api";
import { TestChaincode, transactionSuccess } from "@gala-chain/test";
import { instanceToPlain, plainToClass } from "class-transformer";

import { PublicKeyContract } from "./PublicKeyContract";
import { TonUser, createTonSignedDto, createTonUser } from "./authenticate.testutils.spec";

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
const signerRef = labeled<PublicKey>("signer ton| ref")(
  (dto, u) => (dto.signerAddress = asValidUserRef(`ton|${u.tonAddress}`))
);
const signerAdd = labeled<PublicKey>("signer address")(
  (dto, u) => (dto.signerAddress = asValidUserRef(u.tonAddress))
);
const _________ = labeled<PublicKey>("raw dto")(() => ({}));

type Expectation = (response: unknown, user: TonUser) => void;
const Success = labeled<Expectation>("Success")((response, user) => {
  expect(response).toEqual(
    transactionSuccess({
      alias: user.alias,
      tonAddress: user.tonAddress,
      roles: UserProfile.DEFAULT_ROLES,
      signatureQuorum: 1,
      signers: [user.alias]
    })
  );
});

const Error: (errorKey: string) => Expectation = (errorKey) =>
  labeled<Expectation>(errorKey)((response) => {
    expect(response).toEqual(expect.objectContaining({ Status: 0, ErrorKey: errorKey }));
  });

test.each([
  [__valid, _________, Error("MISSING_SIGNER")],
  [__valid, signerKey, Success],
  [__valid, signerRef, Error("USER_NOT_REGISTERED")],
  [__valid, signerAdd, Error("USER_NOT_REGISTERED")],
  [invalid, _________, Error("MISSING_SIGNER")],
  [invalid, signerKey, Error("PK_INVALID_SIGNATURE")],
  [invalid, signerRef, Error("USER_NOT_REGISTERED")],
  [invalid, signerAdd, Error("USER_NOT_REGISTERED")]
])("(%s, %s) => %s", performTest);

async function performTest(signatureFn: Signature, publicKeyFn: PublicKey, expectation: Expectation) {
  // Given
  const chaincode = new TestChaincode([PublicKeyContract]);
  const userObj = await createTonUser();

  const dto = new ChainCallDTO();
  dto.signing = SigningScheme.TON;
  publicKeyFn(dto, userObj);
  const signedDto = signatureFn(dto, userObj.privateKey);

  // When
  const response = await chaincode.invoke("PublicKeyContract:GetMyProfile", signedDto);

  // Then
  expectation(response, userObj);
}

// this is a hack to make pretty display of test cases
function labeled<F>(label: string): (fn: F) => F & { toString: () => string } {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (fn) => Object.assign(fn, { toString: () => label });
}
