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
import { GalaChainResponse, SubmitCallDTO, createValidSubmitDTO } from "@gala-chain/api";
import { Wrapped, fixture, transactionErrorKey, transactionSuccess, users } from "@gala-chain/test";
import { ChainUserWithRoles } from "@gala-chain/test";

import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { Submit } from "./GalaTransaction";

class TestContract extends GalaContract {
  constructor() {
    super("TestContract", "1.0.0");
  }

  @Submit({
    in: SubmitCallDTO,
    out: "string"
  })
  async TestMethod(ctx: GalaChainContext, dto: SubmitCallDTO) {
    return GalaChainResponse.Success("Hello!");
  }
}

describe("Transaction expiration", () => {
  let contract: Wrapped<TestContract>;
  let ctx: GalaChainContext;
  let user: ChainUserWithRoles;

  beforeAll(async () => {
    user = users.testUser1;
    const f = await fixture(TestContract).registeredUsers(user);
    contract = f.contract;
    ctx = f.ctx;
  });

  it("should verify transaction with no expiration", async () => {
    // Given
    const dto = await createValidSubmitDTO(SubmitCallDTO, {}).signed(user.privateKey);

    // When
    const response = await contract.TestMethod(ctx, dto);

    // Then
    expect(response).toEqual(transactionSuccess());
  });

  it("should verify transaction with expiration in the future", async () => {
    // Given
    const dto = await createValidSubmitDTO(SubmitCallDTO, {
      transactionExpiresAt: Date.now() + 1000 * 60 * 60
    }).signed(user.privateKey);

    // When
    const response = await contract.TestMethod(ctx, dto);

    // Then
    expect(response).toEqual(transactionSuccess());
  });

  it("should reject transaction with expiration in the past", async () => {
    // Given
    const dto = await createValidSubmitDTO(SubmitCallDTO, {
      transactionExpiresAt: Date.now() - 1000 * 60 * 60
    }).signed(user.privateKey);

    // When
    const response = await contract.TestMethod(ctx, dto);

    // Then
    expect(response).toEqual(transactionErrorKey("TRANSACTION_EXPIRED"));
  });

  it("should reject transaction with expiration more than a year in the future", async () => {
    // Given
    const dto = await createValidSubmitDTO(SubmitCallDTO, {
      transactionExpiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365 * 2
    }).signed(user.privateKey);

    // When
    const response = await contract.TestMethod(ctx, dto);

    // Then
    expect(response).toEqual(transactionErrorKey("TRANSACTION_EXPIRATION_TOO_FAR"));
  });
});
