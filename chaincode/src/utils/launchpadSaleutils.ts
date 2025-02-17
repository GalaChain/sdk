import { INITIAL_LAUNCHPAD_FEE_ADDRESS, SaleStatus } from "@gala-chain/api";
import { DefaultError, NotFoundError } from "@gala-chain/api";
import { LaunchPadSale } from "@gala-chain/api";
import { PlatformFeeAddress } from "@gala-chain/api";
import Decimal from "decimal.js";

import { GalaChainContext } from "../types/GalaChainContext";
import { getObjectByKey } from "./state";

export async function fetchAndValidateSale(
  ctx: GalaChainContext,
  vaultAddress: string
): Promise<LaunchPadSale> {
  const key = ctx.stub.createCompositeKey(LaunchPadSale.INDEX_KEY, [vaultAddress]);

  const sale = await getObjectByKey(ctx, LaunchPadSale, key).catch(() => undefined);
  if (sale === undefined) {
    throw new NotFoundError("Sale record not found.");
  }

  if (sale.SaleStatus === SaleStatus.END) {
    throw new DefaultError("This sale has already ended.");
  }

  return sale;
}

export async function fetchPlatformFeeAddress(ctx: GalaChainContext): Promise<string> {
  const key = ctx.stub.createCompositeKey(PlatformFeeAddress.INDEX_KEY, []);

  const platformFeeAddress = await getObjectByKey(ctx, PlatformFeeAddress, key).catch(() => undefined);
  if (platformFeeAddress === undefined) {
    return INITIAL_LAUNCHPAD_FEE_ADDRESS;
  }
  return platformFeeAddress.platformFeeAddress;
}

export function getBondingConstants() {
  return {
    exponentFactor: new Decimal("1166069000000"), // exponent factor / b
    euler: new Decimal("2.7182818284590452353602874713527"), // e
    decimals: new Decimal("1e+18") // scaling factor for decimals
  };
}
