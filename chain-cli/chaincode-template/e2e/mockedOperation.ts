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
// The in-memory stub reports asset-channel and basic-asset.
// A network started from this template reports product-channel and basic-product.
export function mockedOperation(method: string): string {
  const prefix =
    process.env.CURATORORG_MOCKED_CHAINCODE_DIR === undefined
      ? "product-channel_basic-product_"
      : "asset-channel_basic-asset_";
  return `${prefix}${method}`;
}
