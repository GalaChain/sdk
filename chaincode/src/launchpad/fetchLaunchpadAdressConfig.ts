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
import { LaunchpadFeeConfig, NotFoundError, UnauthorizedError } from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { fetchLaunchpadFeeAddress } from "../utils";

export async function fetchLaunchpadFeeConfig(ctx: GalaChainContext): Promise<LaunchpadFeeConfig> {
  const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

  const platformFeeAddress = await fetchLaunchpadFeeAddress(ctx);

  if (ctx.clientIdentity.getMSPID() !== curatorOrgMsp) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }

  if (!platformFeeAddress) {
    throw new NotFoundError(
      "Platform fee configuration has yet to be defined. Platform fee configuration is not defined."
    );
  } else if (!platformFeeAddress.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }
  return platformFeeAddress;
}
