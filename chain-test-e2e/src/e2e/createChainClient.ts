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
import { ChainClient, ChainUser, ChainUserAPI, ContractConfig } from "@gala-chain/api";

import { ContractTestClient } from "./ContractTestClient";

/**
 * Creates a chain client for the specified user and contract configuration.
 *
 * This is a convenience function that creates a curator-level client using the ContractTestClient.
 * The returned client provides both basic ChainClient functionality and ChainUserAPI methods.
 *
 * @param user - The chain user to authenticate with
 * @param contract - Contract configuration including channel, chaincode, and contract details
 * @returns Chain client with user API capabilities
 *
 * @example
 * ```typescript
 * const client = createChainClient(testUser, {
 *   channel: "product-channel",
 *   chaincode: "basic-product",
 *   contract: "GalaChainToken"
 * });
 *
 * // Use client for transactions
 * await client.submitTransaction("CreateTokenClass", dto);
 * ```
 */
export function createChainClient(user: ChainUser, contract: ContractConfig): ChainClient & ChainUserAPI {
  return ContractTestClient.createForCurator(user, contract);
}
