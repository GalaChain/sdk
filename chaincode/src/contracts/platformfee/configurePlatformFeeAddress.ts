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
import {
  ChainError,
  ConfigurePlatformFeeAddressDto,
  ErrorCode,
  PlatformFeeConfig,
  UnauthorizedError
} from "@gala-chain/api";

import { GalaChainContext } from "../../types";
import { getObjectByKey, putChainObject } from "../../utils";

export async function configurePlatformFeeAddress(
  ctx: GalaChainContext,
  dto: ConfigurePlatformFeeAddressDto
): Promise<PlatformFeeConfig> {
  if (!dto.newPlatformFeeAddress && !dto.newAuthorities?.length) {
    throw new Error("None of the input fields are present.");
  }

  const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

  const key = ctx.stub.createCompositeKey(PlatformFeeConfig.INDEX_KEY, []);
  let platformFeeAddress = await getObjectByKey(ctx, PlatformFeeConfig, key).catch((e) => {
    const chainError = ChainError.from(e);
    if (chainError.matches(ErrorCode.NOT_FOUND)) {
      return undefined;
    } else {
      throw chainError;
    }
  });

  if (ctx.clientIdentity.getMSPID() !== curatorOrgMsp) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }

  if (!platformFeeAddress) {
    if (!dto.newPlatformFeeAddress) {
      throw new Error("Must provide a platform fee address in the initial setup of the configuration.");
    }
    platformFeeAddress = new PlatformFeeConfig(
      dto.newPlatformFeeAddress,
      dto.newAuthorities ?? [ctx.callingUser]
    );
  } else if (platformFeeAddress && platformFeeAddress.authorities.includes(ctx.callingUser)) {
    platformFeeAddress.setNewFeeAddress(
      dto.newPlatformFeeAddress ?? platformFeeAddress.feeAddress,
      dto.newAuthorities ?? platformFeeAddress.authorities
    );
  } else {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }

  await putChainObject(ctx, platformFeeAddress);

  return platformFeeAddress;
}
