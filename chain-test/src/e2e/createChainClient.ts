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
import { ChainClient, ChainUser, ChainUserAPI, ContractConfig } from "@gala-chain/client";

import { ContractTestClient } from "./ContractTestClient";

function contractConfig(c: string | ContractConfig): ContractConfig {
  if (typeof c === "string") {
    return {
      channelName: "product-channel",
      chaincodeName: "basic-product",
      contractName: c
    };
  } else {
    return c;
  }
}

export function createChainClient(
  user: ChainUser,
  contract: string | ContractConfig
): ChainClient & ChainUserAPI {
  const cfg = contractConfig(contract);
  return ContractTestClient.createForCurator(user, cfg);
}
