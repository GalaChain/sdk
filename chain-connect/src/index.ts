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
 * @fileoverview Main entry point for the GalaChain Connect library.
 *
 * This library provides high-level client APIs and wallet integration for interacting
 * with GalaChain networks. It includes browser wallet connectivity, signing abstractions,
 * and chaincode API clients.
 *
 * @example
 * ```typescript
 * import { BrowserConnectClient, TokenApi } from '@gala-chain/connect';
 *
 * // Connect to a browser wallet
 * const client = new BrowserConnectClient();
 * await client.connect();
 *
 * // Create API instance
 * const tokenApi = new TokenApi('https://api.galachain.com', client);
 *
 * // Make chaincode calls
 * const balance = await tokenApi.FetchBalances({ owner: 'eth|...' });
 * ```
 */
export * from "./customClients";
export * from "./GalaChainClient";
export * from "./utils/WalletUtils";
export * from "./chainApis";
export * from "./helpers";
export * from "./types";
