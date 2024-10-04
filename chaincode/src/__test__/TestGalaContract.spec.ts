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
import { TestChaincode, transactionSuccess } from "@gala-chain/test";

import TestGalaContract from "./TestGalaContract";

describe("TestChaincode", () => {
  it("should allow to get version", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);

    // This test may not work when it is running not from command line, because
    // it relies on version that is provided by Node.js on runtime.
    // See: https://stackoverflow.com/a/22339262
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const expectedVersion = require("../../package.json").version;

    // When
    const result = await chaincode.invoke("GetContractVersion");

    // Then
    expect(result).toEqual(transactionSuccess(expectedVersion));
  });

  it("should allow to put and get the state", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const [key, value] = ["test-chaincode-quality-check", "approved"];

    // When
    const response = await chaincode.invoke("TestGalaContract:Put", key, value);

    // Then
    expect(response).toEqual(transactionSuccess());
    expect(await chaincode.invoke("TestGalaContract:Get", key)).toEqual(transactionSuccess(value));
  });

  it("should not allow to increment twice (check if mock works as in HLF)", async () => {
    // Given
    const chaincode = new TestChaincode([TestGalaContract]);
    const key = "test-chaincode-incrementer";

    // When
    const response1 = await chaincode.invoke("TestGalaContract:IncrementTwiceWrong", key);

    // Then
    expect(response1).toEqual(transactionSuccess());
    expect(await chaincode.invoke("TestGalaContract:Get", key)).toEqual(transactionSuccess("1")); // and not "2"

    // When
    const response2 = await chaincode.invoke("TestGalaContract:IncrementTwiceWrong", key);

    // Then
    expect(response2).toEqual(transactionSuccess());
    expect(await chaincode.invoke("TestGalaContract:Get", key)).toEqual(transactionSuccess("2")); // and not "3"
  });
});
