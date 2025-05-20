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
  ConfigureDexFeeAddressDto,
  DexFeeConfig,
  NotFoundError,
  SetProtocolFeeDto,
  SetProtocolFeeResDto,
  UnauthorizedError,
  ValidationFailedError
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";
import { fetchDexProtocolFeeConfig } from "./dexUtils";

/**
 * @dev The setProtocolFee function updates the protocol fee percentage for a Decentralized exchange pool within the GalaChain ecosystem.
 * @param ctx GalaChainContext – The execution context providing access to the GalaChain environment.
 * @param dto SetProtocolFeeDto – A data transfer object containing:
  - Pool identifier – The specific pool where the protocol fee is being updated.
- fee value – The new protocol fee percentage, ranging from 0 to 1 (0% to 100%).
 * @returns New fee for the pool
 */
export async function setProtocolFee(
  ctx: GalaChainContext,
  dto: SetProtocolFeeDto
): Promise<SetProtocolFeeResDto> {
  const protocolFeeConfig = await fetchDexProtocolFeeConfig(ctx);
  if (!protocolFeeConfig) {
    throw new NotFoundError(
      "Protocol fee configuration has yet to be defined. Dex fee configuration is not defined."
    );
  } else if (!protocolFeeConfig.authorities.includes(ctx.callingUser)) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }
  //If pool does not exist
  protocolFeeConfig.protocolFee = dto.protocolFee;
  await putChainObject(ctx, protocolFeeConfig);
  return new SetProtocolFeeResDto(dto.protocolFee);
}

/**
 * Configures or updates the authorities for the DEX fee address configuration.
 *
 * @param ctx - GalaChain execution context containing identity and ledger access.
 * @param dto - Data transfer object containing the new authorities.
 * @returns The updated or newly created DexFeeConfig.
 *
 * @throws ValidationFailedError - If no authorities are provided.
 * @throws UnauthorizedError - If the calling user is not from the CuratorOrg MSP
 *                             or is not an authorized authority.
 */
export async function configureDexFeeAddress(ctx: GalaChainContext, dto: ConfigureDexFeeAddressDto) {
  if (!dto.newAuthorities?.length) {
    throw new ValidationFailedError("At least one user should be defined to provide access");
  }

  const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

  if (ctx.clientIdentity.getMSPID() !== curatorOrgMsp) {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }
  let protocolFeeConfig = await fetchDexProtocolFeeConfig(ctx);

  if (!protocolFeeConfig) {
    protocolFeeConfig = new DexFeeConfig(dto.newAuthorities ?? [ctx.callingUser]);
  } else if (protocolFeeConfig && protocolFeeConfig.authorities.includes(ctx.callingUser)) {
    protocolFeeConfig.addOrUpdateAuthorities(dto.newAuthorities ?? protocolFeeConfig.authorities);
  } else {
    throw new UnauthorizedError(`CallingUser ${ctx.callingUser} is not authorized to create or update`);
  }

  await putChainObject(ctx, protocolFeeConfig);
  return protocolFeeConfig;
}
