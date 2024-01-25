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
import { fixture, transactionSuccess } from "@gala-chain/test";

import { AppleContract } from "./AppleContract";

// The purpose of this test is to detect unexpected changes in API definition
test(`${AppleContract.name} API should match snapshot`, async () => {
  // Given
  const { contract, ctx } = fixture(AppleContract);

  // When
  const contractApi = await contract.GetContractAPI(ctx);

  // Then
  expect(contractApi).toEqual(transactionSuccess());
  expect({ ...contractApi.Data, contractVersion: "?.?.?" }).toMatchSnapshot();
});
