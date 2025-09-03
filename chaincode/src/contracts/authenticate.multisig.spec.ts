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
  RegisterUserDto,
  createValidSubmitDTO,
  signatures
} from "@gala-chain/api";
import { TestChaincode, transactionSuccess } from "@gala-chain/test";

import { PublicKeyContract } from "./PublicKeyContract";
import { createRegisteredUser, createUser } from "./authenticate.testutils.spec";

describe("authenticate multisig", () => {
  it("throws on duplicate signer public keys", async () => {
    const chaincode = new TestChaincode([PublicKeyContract]);

    const user = await createUser();
    const other = signatures.genKeyPair();

    const regDto = await createValidSubmitDTO(RegisterUserDto, {
      user: user.alias,
      publicKeys: [user.publicKey, other.publicKey],
      requiredSignatures: 2
    });
    const regSigned = regDto.signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);
    const regResp = await chaincode.invoke("PublicKeyContract:RegisterUser", regSigned);
    expect(regResp).toEqual(transactionSuccess());

    const dto = new GetMyProfileDto();
    dto.sign(user.privateKey);
    dto.sign(user.privateKey);

    const resp = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto);
    expect(resp).toEqual(expect.objectContaining({ Status: 0, ErrorKey: "DUPLICATE_SIGNER_PUBLIC_KEY" }));
  });

  it("throws when signer info is missing", async () => {
    const chaincode = new TestChaincode([PublicKeyContract]);
    const user = await createRegisteredUser(chaincode);

    const dto = new GetMyProfileDto();
    dto.sign(user.privateKey, true);
    if (dto.signatures) {
      dto.signatures[0].signerPublicKey = undefined;
      dto.signatures[0].signerAddress = undefined;
    }
    // remove legacy fields as well
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (dto as any).signerPublicKey;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (dto as any).signerAddress;

    const resp = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto);
    expect(resp).toEqual(expect.objectContaining({ Status: 0, ErrorKey: "MISSING_SIGNER" }));
  });

  it("throws when signatures come from different aliases", async () => {
    const chaincode = new TestChaincode([PublicKeyContract]);
    const userA = await createRegisteredUser(chaincode);
    const userB = await createRegisteredUser(chaincode);

    const dto = new GetMyProfileDto();
    dto.sign(userA.privateKey);
    dto.sign(userB.privateKey);

    const resp = await chaincode.invoke("PublicKeyContract:GetMyProfile", dto);
    expect(resp).toEqual(
      expect.objectContaining({ Status: 0, ErrorKey: "SIGNER_ALIAS_MISMATCH" })
    );
  });
});

