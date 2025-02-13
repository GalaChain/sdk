import { DefaultError } from "@gala-chain/api";
import { GalaChainContext, getObjectByKey, putChainObject } from "@gala-chain/chaincode";

import { INITIAL_PLATFORM_FEE_ADDRESS } from "./constants";
import { configurePlatformFeeAddressDto } from "./dtos";
import { PlatformFeeAddress } from "./platformFeeAddress";

export async function configurePlatformFeeAddress(
  ctx: GalaChainContext,
  dto: configurePlatformFeeAddressDto
): Promise<PlatformFeeAddress> {
  const key = ctx.stub.createCompositeKey(PlatformFeeAddress.INDEX_KEY, []);
  
  let platformFeeAddress = await getObjectByKey(ctx, PlatformFeeAddress, key).catch(() => undefined);

  const isAuthorized =
    (platformFeeAddress && ctx.callingUser === platformFeeAddress.platformFeeAddress) ||
    (!platformFeeAddress && ctx.callingUser === INITIAL_PLATFORM_FEE_ADDRESS);

  if (!isAuthorized) {
    throw new DefaultError("Only the current platform fee address can modify this setting.");
  }

  if (!platformFeeAddress) {
    platformFeeAddress = new PlatformFeeAddress(INITIAL_PLATFORM_FEE_ADDRESS);
  } else {
    platformFeeAddress.modifyPlatformFeeAddress(dto.newAddress);
  }

  await putChainObject(ctx, platformFeeAddress);
  return platformFeeAddress;
}

