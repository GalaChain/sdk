import { ChainError, ErrorCode, FeeExemption, FeeGateCodes } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey } from "../utils";

export interface IExemptionForUser {
  user: string;
  feeCode: FeeGateCodes;
}

/**
 * @description
 *
 * Returns true if a given user is exempt from the given fee code.
 *
 * @param ctx
 * @param data
 * @returns Promise<boolean>
 */
export async function userExemptFromFees(ctx: GalaChainContext, data: IExemptionForUser): Promise<boolean> {
  const { user, feeCode } = data;

  const exemption: FeeExemption | ChainError = await getObjectByKey(
    ctx,
    FeeExemption,
    FeeExemption.getCompositeKeyFromParts(FeeExemption.INDEX_KEY, [user])
  ).catch((e) => ChainError.from(e));

  if (exemption instanceof ChainError && exemption.code !== ErrorCode.NOT_FOUND) {
    throw exemption;
  }

  if (exemption instanceof FeeExemption) {
    if (exemption.limitedTo === undefined || exemption.limitedTo?.includes(feeCode)) {
      // user is exempt from this fee, end any further fee gate processing
      return true;
    }
  }

  return false;
}