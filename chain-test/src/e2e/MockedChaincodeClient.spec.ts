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
import { ChainCallDTO } from "@gala-chain/api";

import { transactionErrorKey } from "../matchers";
import { MockedChaincodeClientBuilder } from "./MockedChaincodeClient";

it("should call chaincode", async () => {
  const path = "/Users/jakubdzikowski/IdeaProjects/gh-sdk/chain-cli/chaincode-template/lib/src/index.js";
  const contractName = "PublicKeyContract";
  const client = new MockedChaincodeClientBuilder({ mockedChaincodeDir: path }).forContract({
    channel: "mychannel",
    chaincode: "mychaincode",
    contract: contractName
  });

  const response = await client.submitTransaction("GetPublicKey", new ChainCallDTO());

  expect(response).toEqual(transactionErrorKey("PK_NOT_FOUND"));
});
