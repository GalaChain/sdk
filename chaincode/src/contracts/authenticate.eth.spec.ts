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
import { ChainCallDTO, UserProfile, asValidUserRef, signatures } from "@gala-chain/api";
import { TestChaincode, transactionSuccess } from "@gala-chain/test";
import { instanceToPlain, plainToClass } from "class-transformer";

import { PublicKeyContract } from "./PublicKeyContract";
import {
  createDerSignedDto,
  createRegisteredUser,
  createSignedDto,
  createUser
} from "./authenticate.testutils.spec";

/**
 * Tests below cover a wide range of scenarios for GetMyProfile method, and in
 * general, public key recovery and determining whether user is registered.
 * There is a lot of edge cases that needs to be tested out:
 * - Signature in DTO (regular or DER)
 * - Public key in DTO (present or not)
 * - Public key on chain (present or not)
 *
 * Also for each of the above cases, we need to test if the signature is valid,
 * matches public key, etc.
 */

// Signature can be either regular or DER
type Signature = (dto: ChainCallDTO, privateKey: string) => ChainCallDTO;
const __valid___ = labeled<Signature>("valid signature")((dto, privK) => createSignedDto(dto, privK));
const __validDER = labeled<Signature>("valid DER signature")((dto, privK) => createDerSignedDto(dto, privK));
const invalid___ = labeled<Signature>("invalid signature")((srcDto, privK) => {
  const dto = plainToClass(ChainCallDTO, instanceToPlain(srcDto));
  dto.signature = signatures.getSignature({ invalid: true }, Buffer.from(privK, "hex"));
  return dto;
});

// Public key can be either present or not
type PublicKey = (dto: ChainCallDTO, u: User) => void;
const otherPK = signatures.genKeyPair().publicKey;
const otherAdd = signatures.getEthAddress(otherPK);
const signerKey = labeled<PublicKey>("signer key")((dto, u) => (dto.signerPublicKey = u.publicKey));
const _wrongKey = labeled<PublicKey>("wrong signer key")((dto) => (dto.signerPublicKey = otherPK));
const signerAdd = labeled<PublicKey>("signer address")(
  (dto, u) => (dto.signerAddress = asValidUserRef(u.ethAddress))
);
const _wrongAdd = labeled<PublicKey>("wrong signer address")(
  (dto) => (dto.signerAddress = asValidUserRef(otherAdd))
);
const _________ = labeled<PublicKey>("raw dto")(() => ({}));

// User can be registered or not
type UserRegistered = (ch: TestChaincode) => Promise<User>;
const ___registered = labeled<UserRegistered>("user registered")((ch) => createRegisteredUser(ch));
const notRegistered = labeled<UserRegistered>("user not registered")(() => createUser());

type Expectation = (response: unknown, user: User) => void;

const Success = labeled<Expectation>("Success")((response, user) => {
  expect(response).toEqual(
    transactionSuccess({
      alias: user.alias,
      ethAddress: user.ethAddress,
      roles: UserProfile.DEFAULT_ROLES,
      signatureQuorum: 1,
      signers: [user.alias]
    })
  );
});

const SuccessNoCustomAlias = labeled<Expectation>("SuccessNoCustomAlias")((response, user) => {
  expect(response).toEqual(
    transactionSuccess({
      alias: `eth|${user.ethAddress}`,
      ethAddress: user.ethAddress,
      roles: UserProfile.DEFAULT_ROLES,
      signatureQuorum: 1,
      signers: [`eth|${user.ethAddress}`]
    })
  );
});

const SuccessUnknownKey = labeled<Expectation>("SuccessUnknownKey")((response, user) => {
  expect(response).toEqual(
    transactionSuccess({
      alias: expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/),
      ethAddress: expect.stringMatching(/^[a-fA-F0-9]{40}$/),
      roles: UserProfile.DEFAULT_ROLES,
      signatureQuorum: 1,
      signers: [expect.stringMatching(/^eth\|[a-fA-F0-9]{40}$/)]
    })
  );
});

const Error: (errorKey: string) => Expectation = (errorKey) =>
  labeled<Expectation>(errorKey)((response) => {
    expect(response).toEqual(expect.objectContaining({ Status: 0, ErrorKey: errorKey }));
  });

const testFn = async (
  signatureFn: Signature,
  publicKeyFn: PublicKey,
  createUserFn: UserRegistered,
  expectation: Expectation
) => {
  // Given
  const chaincode = new TestChaincode([PublicKeyContract]);
  const userObj = await createUserFn(chaincode);
  chaincode.setCallingUser(userObj.alias);

  const dto = new ChainCallDTO();
  publicKeyFn(dto, userObj);
  const signedDto = signatureFn(dto, userObj.privateKey);

  // When
  const response = await chaincode.invoke("PublicKeyContract:GetMyProfile", signedDto);

  // Then
  expectation(response, userObj);
};

describe("regular flow", () => {
  test.each([
    [__valid___, _________, ___registered, Success],
    [__valid___, _________, notRegistered, SuccessNoCustomAlias],
    [__valid___, signerKey, ___registered, Error("REDUNDANT_SIGNER_PUBLIC_KEY")],
    [__valid___, _wrongKey, ___registered, Error("PUBLIC_KEY_MISMATCH")],
    [__valid___, signerKey, notRegistered, Error("REDUNDANT_SIGNER_PUBLIC_KEY")],
    [__valid___, _wrongKey, ___registered, Error("PUBLIC_KEY_MISMATCH")],
    [__valid___, signerAdd, ___registered, Error("REDUNDANT_SIGNER_ADDRESS")],
    [__valid___, _wrongAdd, ___registered, Error("ADDRESS_MISMATCH")],
    [__valid___, signerAdd, notRegistered, Error("REDUNDANT_SIGNER_ADDRESS")],
    [__valid___, _wrongAdd, notRegistered, Error("ADDRESS_MISMATCH")],
    [__validDER, _________, ___registered, Error("MISSING_SIGNER")],
    [__validDER, _________, notRegistered, Error("MISSING_SIGNER")],
    [__validDER, signerKey, ___registered, Success],
    [__validDER, _wrongKey, ___registered, Error("PK_INVALID_SIGNATURE")],
    [__validDER, signerKey, notRegistered, SuccessNoCustomAlias],
    [__validDER, signerAdd, ___registered, Success],
    [__validDER, _wrongAdd, ___registered, Error("USER_NOT_REGISTERED")],
    [__validDER, signerAdd, notRegistered, Error("USER_NOT_REGISTERED")],
    [invalid___, _________, ___registered, SuccessUnknownKey], // it's just recovered to a different key
    [invalid___, _________, notRegistered, SuccessUnknownKey], // it's just recovered to a different key
    [invalid___, signerKey, ___registered, Error("PUBLIC_KEY_MISMATCH")],
    [invalid___, signerKey, notRegistered, Error("PUBLIC_KEY_MISMATCH")],
    [invalid___, signerAdd, ___registered, Error("ADDRESS_MISMATCH")],
    [invalid___, signerAdd, notRegistered, Error("ADDRESS_MISMATCH")]
  ])("(sig: %s, dto: %s, user: %s) => %s", testFn);
});

interface User {
  alias: string;
  privateKey: string;
  publicKey: string;
  ethAddress: string;
}

// this is a hack to make pretty display of test cases
function labeled<F>(label: string): (fn: F) => F & { toString: () => string } {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (fn) => Object.assign(fn, { toString: () => label });
}
