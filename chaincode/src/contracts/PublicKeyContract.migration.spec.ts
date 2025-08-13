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
  RegisterEthUserDto,
  SubmitCallDTO,
  UpdateUserRolesDto,
  UserProfileWithRoles,
  UserRole,
  createValidSubmitDTO
} from "@gala-chain/api";
import { TestChaincode, transactionErrorKey, transactionSuccess, users } from "@gala-chain/test";

import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { Submit } from "./GalaTransaction";
import { PublicKeyContract } from "./PublicKeyContract";

const allowedOrg = "AllowedOrg";
const otherOrg = "OtherOrg";
const allowedRole = UserRole.CURATOR;

class TestContract extends GalaContract {
  @Submit({ allowedOrgs: [allowedOrg] })
  public async V1(ctx: GalaChainContext, dto: ChainCallDTO): Promise<string> {
    // dto is not used in this method, but it is required by the Submit decorator
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return `Hello ${ctx.callingUser}!`;
  }

  @Submit({ allowedRoles: [allowedRole] })
  public async V2(ctx: GalaChainContext, dto: ChainCallDTO): Promise<string> {
    // dto is not used in this method, but it is required by the Submit decorator
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return `Hello ${ctx.callingUser}!`;
  }
}

describe("Migration from allowedOrgs to allowedRoles", () => {
  const adminPrivateKey = process.env.DEV_ADMIN_PRIVATE_KEY as string;
  const user = users.random(undefined, []);
  const chaincode = new TestChaincode([PublicKeyContract, TestContract]);

  async function callChaincode(msp: string, method: "V1" | "V2") {
    const dto = await createValidSubmitDTO(SubmitCallDTO, {}).signed(user.privateKey);
    return await chaincode
      .setCallingUserMsp(msp)
      .invoke<GalaChainResponse<string>>(`TestContract:${method}`, dto);
  }

  async function getUserProfile() {
    const dto = new ChainCallDTO().signed(user.privateKey);
    const resp = await chaincode.invoke<GalaChainSuccessResponse<UserProfileWithRoles>>(
      "PublicKeyContract:GetMyProfile",
      dto
    );
    expect(resp).toEqual(transactionSuccess());
    return resp.Data;
  }

  test("When: User is registered with no allowed role", async () => {
    const dto = await createValidSubmitDTO(RegisterEthUserDto, { publicKey: user.publicKey }).signed(
      adminPrivateKey
    );
    expect(await chaincode.invoke("PublicKeyContract:RegisterEthUser", dto)).toEqual(transactionSuccess());

    const profile = await getUserProfile();
    expect(profile).toEqual(expect.objectContaining({ alias: user.identityKey }));
    expect(profile.roles).not.toContain(allowedRole);
  });

  test("Then: User is able to call V1 method from allowed org only", async () => {
    expect(await callChaincode(allowedOrg, "V1")).toEqual(transactionSuccess());
    expect(await callChaincode(otherOrg, "V2")).toEqual(transactionErrorKey("MISSING_ROLE"));
  });

  test("Then: User is not able to call V2 method", async () => {
    expect(await callChaincode(allowedOrg, "V2")).toEqual(transactionErrorKey("MISSING_ROLE"));
    expect(await callChaincode(otherOrg, "V2")).toEqual(transactionErrorKey("MISSING_ROLE"));
  });

  test("When: Admin grants the user the allowed role", async () => {
    const currentProfile = await getUserProfile();

    const updateRolesDto = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: user.identityKey,
      roles: [allowedRole, ...currentProfile.roles] // need to provide all roles
    }).signed(adminPrivateKey);
    const updateRolesResp = await chaincode
      .setCallingUserMsp("CuratorOrg") // required for the UpdateUserRoles method
      .invoke("PublicKeyContract:UpdateUserRoles", updateRolesDto);
    expect(updateRolesResp).toEqual(transactionSuccess());

    const updatedProfile = await getUserProfile();
    expect(updatedProfile.roles).toEqual(updateRolesDto.roles);
  });

  test("Then: User is able to call V2 method from any org", async () => {
    expect(await callChaincode(allowedOrg, "V2")).toEqual(transactionSuccess());
    expect(await callChaincode(otherOrg, "V2")).toEqual(transactionSuccess());
  });
});
