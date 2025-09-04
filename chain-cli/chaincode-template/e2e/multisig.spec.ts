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
  UserAlias,
  createValidSubmitDTO,
  signatures
} from "@gala-chain/api";
import { AdminChainClients, TestClients, transactionErrorKey, transactionSuccess } from "@gala-chain/test";

jest.setTimeout(30000);

describe("multisig template e2e", () => {
  let client: AdminChainClients;
  let key1: string;
  let key2: string;
  let alias: UserAlias;

  beforeAll(async () => {
    client = await TestClients.createForAdmin();

    const kp1 = signatures.genKeyPair();
    const kp2 = signatures.genKeyPair();
    key1 = kp1.privateKey;
    key2 = kp2.privateKey;
    alias = "client|tmpl-multi" as UserAlias;

    const regDto = await createValidSubmitDTO(RegisterUserDto, {
      user: alias,
      publicKeys: [kp1.publicKey, kp2.publicKey],
      requiredSignatures: 2
    });
    const regResp = await client.pk.RegisterUser(regDto.signed(client.pk.privateKey));
    expect(regResp).toEqual(transactionSuccess());
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it("fails when only one signature provided", async () => {
    const dto = new GetMyProfileDto();
    dto.sign(key1);
    const resp = await client.pk.GetMyProfile(dto);
    expect(resp).toEqual(transactionErrorKey("UNAUTHORIZED"));
  });

  it("fails when duplicate signatures provided", async () => {
    const dto = new GetMyProfileDto();
    dto.sign(key1);
    dto.sign(key1);
    const resp = await client.pk.GetMyProfile(dto);
    expect(resp).toEqual(transactionErrorKey("DUPLICATE_SIGNER_PUBLIC_KEY"));
  });

  it("succeeds when quorum is met", async () => {
    const dto = new GetMyProfileDto();
    dto.sign(key1);
    dto.sign(key2);
    const resp = await client.pk.GetMyProfile(dto);
    expect(resp).toEqual(
      transactionSuccess(expect.objectContaining({ alias, pubKeyCount: 2, requiredSignatures: 2 }))
    );
  });
});

