import {
  ConfigurePlatformFeeAddressDto,
  INITIAL_LAUNCHPAD_FEE_ADDRESS,
  PlatformFeeAddress
} from "@gala-chain/api";
import { GalaChainContext, getObjectByKey, putChainObject } from "@gala-chain/chaincode";

export async function configurePlatformFeeAddress(
  ctx: GalaChainContext,
  dto: ConfigurePlatformFeeAddressDto
): Promise<PlatformFeeAddress> {
  const key = ctx.stub.createCompositeKey(PlatformFeeAddress.INDEX_KEY, []);
  let platformFeeAddress = await getObjectByKey(ctx, PlatformFeeAddress, key).catch(() => undefined);

  if (!platformFeeAddress) {
    platformFeeAddress = new PlatformFeeAddress(INITIAL_LAUNCHPAD_FEE_ADDRESS);
  } else {
    platformFeeAddress.modifyPlatformFeeAddress(dto.newAddress);
  }

  await putChainObject(ctx, platformFeeAddress);
  return platformFeeAddress;
}
