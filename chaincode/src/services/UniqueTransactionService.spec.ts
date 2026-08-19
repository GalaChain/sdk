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
import { createValidDTO } from "@gala-chain/api";
import { TestChaincode, transactionError, transactionErrorKey, transactionSuccess } from "@gala-chain/test";

import TestGalaContract, { KVDto, SuperheroDto } from "../__test__/TestGalaContract";

describe("UniqueTransactionService", () => {
  it("should not error if transaction with uniqueKey does not exist on chain", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const adminPrivateKey = process.env.DEV_ADMIN_PRIVATE_KEY as string;

    const dto = await createValidDTO(SuperheroDto, {
      name: "foo",
      age: 2,
      uniqueKey: "foo1"
    }).signed(adminPrivateKey);

    const saveResponse = await chaincode.invoke("TestGalaContract:CreateSuperhero", dto.serialize());
    expect(saveResponse).toEqual(transactionSuccess());
  });

  it("should error if transaction with uniqueKey already exists on chain", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);

    const dto = await createValidDTO(SuperheroDto, {
      name: "foo",
      age: 2,
      uniqueKey: "foo2"
    });

    await chaincode.invoke("TestGalaContract:CreateSuperhero", dto.serialize());

    const saveResponse = await chaincode.invoke("TestGalaContract:CreateSuperhero", dto.serialize());
    expect(saveResponse).toEqual(transactionError());
  });

  it("should consume uniqueKey when the submit handler fails", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const dto = await createValidDTO(KVDto, {
      uniqueKey: "failed-submit-uk",
      key: "should-not-persist",
      value: "robot"
    });

    // When
    const first = await chaincode.invoke("TestGalaContract:ErrorAfterPutKv", dto.serialize());
    const second = await chaincode.invoke("TestGalaContract:ErrorAfterPutKv", dto.serialize());

    // Then the business write is discarded, but the uniqueKey is consumed
    expect(first).toEqual(transactionError());
    expect(chaincode.getStateAll()["should-not-persist"]).toBeUndefined();
    expect(second).toEqual(transactionErrorKey("UNIQUE_TRANSACTION_CONFLICT"));
  });
});
