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
import { ChainError, ErrorCode, PlatformFeeConfig, SaleStatus } from "@gala-chain/api";
import { DefaultError, NotFoundError } from "@gala-chain/api";
import Decimal from "decimal.js";

import { GalaChainContext } from "../types/GalaChainContext";
import { getObjectByKey } from "./state";

export async function fetchAndValidateSale(
  ctx: GalaChainContext,
  vaultAddress: string
): Promise<LaunchPadSale> {
  const key = ctx.stub.createCompositeKey(LaunchPadSale.INDEX_KEY, [vaultAddress]);
  const sale = await getObjectByKey(ctx, LaunchPadSale, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  if (sale === undefined) {
    throw new NotFoundError("Sale record not found.");
  } else if (sale.saleStatus === SaleStatus.END) {
    throw new DefaultError("This sale has already ended.");
  }

  return sale;
}

export function getBondingConstants() {
  return {
    exponentFactor: new Decimal("1166069000000"), // exponent factor / b
    euler: new Decimal("2.7182818284590452353602874713527"), // e
    decimals: new Decimal("1e+18") // scaling factor for decimals
  };
}

export async function fetchPlatformFeeAddress(ctx: GalaChainContext): Promise<PlatformFeeConfig | undefined> {
  const key = ctx.stub.createCompositeKey(PlatformFeeConfig.INDEX_KEY, []);

  let platformFeeAddress = await getObjectByKey(ctx, PlatformFeeConfig, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  return platformFeeAddress;
}
