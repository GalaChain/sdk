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
  ApplyRequestsDto,
  GalaChainResponseType,
  UpdateUserRolesDto,
  createValidSubmitDTO
} from "@gala-chain/api";
import { TestChaincode, transactionSuccess } from "@gala-chain/test";
import { plainToInstance } from "class-transformer";

import TestGalaContract, { KVDto } from "../__test__/TestGalaContract";
import { PublicKeyContract } from "./PublicKeyContract";
import { createRegisteredUser } from "./authenticate.testutils.spec";

describe("ApplyRequests uniqueKey", () => {
  it("echoes the queued request uniqueKey on each applied item", async () => {
    const chaincode = new TestChaincode([TestGalaContract, PublicKeyContract]);
    const applier = await createRegisteredUser(chaincode);
    const grantRoles = await createValidSubmitDTO(UpdateUserRolesDto, {
      user: applier.alias,
      roles: ["REQUEST_APPLIER"]
    }).signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);
    expect(await chaincode.invoke("PublicKeyContract:UpdateUserRoles", grantRoles)).toEqual(
      transactionSuccess()
    );

    const requestDto = plainToInstance(KVDto, {
      key: "queued-key",
      value: "queued-value",
      uniqueKey: "request-uk-1"
    }).signed(process.env.DEV_ADMIN_PRIVATE_KEY as string);
    const requestResponse = await chaincode.invoke("TestGalaContract:RequestPutKv", requestDto.serialize());
    expect(requestResponse).toEqual(transactionSuccess({ scheduled: true }));

    const applyDto = plainToInstance(ApplyRequestsDto, {
      uniqueKey: "apply-uk-1",
      minDelayMs: 0
    }).signed(applier.privateKey);
    const applyResponse = await chaincode.invoke("TestGalaContract:ApplyRequests", applyDto.serialize());

    expect(applyResponse).toEqual(
      transactionSuccess([
        {
          uniqueKey: "request-uk-1",
          result: {
            Status: GalaChainResponseType.Success,
            Data: { key: "queued-key", value: "queued-value" }
          }
        }
      ])
    );
    expect(await chaincode.invoke("TestGalaContract:Get", "queued-key")).toEqual(
      transactionSuccess("queued-value")
    );
  });
});
