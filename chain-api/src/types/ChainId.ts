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

/**
 * @description
 *
 * Define identifiers of other blockchains external to GalaChain, or
 * other channels within the GalaChain ecosystem.
 *
 * Primarily used for bridging operations.
 *
 */
export enum ChainId {
  Ethereum = 2,
  TON = 1001
}

/**
 * @description
 *
 * Defines the list of external blockchains and/or GalaChain
 * channels that can potentially be configured by channel operators
 * to support bridge fees on `RequestTokenBridgeOut` actions.
 *
 * @remarks
 *
 * See also the `OracleBridgeFeeAssertion` within the `gala-chain/api` package,
 * and the `requestTokenBridgeOutFeeGate` implementation in the
 * `gala-chain/chaincode` package.
 */
export const ChainsWithBridgeFeeSupport: ChainId[] = [ChainId.Ethereum, ChainId.TON];
