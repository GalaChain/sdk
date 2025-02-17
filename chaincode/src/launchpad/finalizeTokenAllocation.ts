import {
  DefaultError,
  INITIAL_LAUNCHPAD_FEE_ADDRESS,
  LaunchPadFinalizeAllocation,
  PlatformFeeAddress,
  FinalizeTokenAllocationDto
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

export async function finalizeTokenAllocation(
  ctx: GalaChainContext,
  dto: FinalizeTokenAllocationDto
): Promise<LaunchPadFinalizeAllocation> {
  const key = ctx.stub.createCompositeKey(LaunchPadFinalizeAllocation.INDEX_KEY, []);
  let feeAllocation = await getObjectByKey(ctx, LaunchPadFinalizeAllocation, key).catch(() => undefined);

  const key_PlatformAddress = ctx.stub.createCompositeKey(PlatformFeeAddress.INDEX_KEY, []);
  let platformFeeAddress = await getObjectByKey(ctx, PlatformFeeAddress, key_PlatformAddress).catch(
    () => undefined
  );

  const isAuthorized =
    (feeAllocation && ctx.callingUser === platformFeeAddress?.platformFeeAddress) ||
    (!feeAllocation && ctx.callingUser === INITIAL_LAUNCHPAD_FEE_ADDRESS);

  if (!isAuthorized) {
    throw new DefaultError("Only the current platform fee address can modify this allocation");
  }

  if (!feeAllocation) {
    feeAllocation = new LaunchPadFinalizeAllocation(dto.platformFeePercentage, dto.ownerFeePercentage);
  } else {
    feeAllocation.setAllocation(dto.platformFeePercentage, dto.ownerFeePercentage);
  }

  await putChainObject(ctx, feeAllocation);
  return feeAllocation;
}
