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
import BigNumber from "bignumber.js";
import { Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { BigNumberIsPositive, BigNumberProperty, EnumProperty } from "../validators";
import { ChainId } from "./ChainId";
import { TokenInstance, TokenInstanceKey } from "./TokenInstance";
import { ChainCallDTO } from "./dtos";
import { OracleBridgeFeeAssertionDto } from "./oracle";

@JSONSchema({
  description: "Contains properties of bridge request, i.e. a request to bridge token out from GalaChain."
})
export class RequestTokenBridgeOutDto extends ChainCallDTO {
  @JSONSchema({
    description: "The type of the bridge."
  })
  @EnumProperty(ChainId)
  @IsNotEmpty()
  destinationChainId: ChainId;

  @JSONSchema({
    description:
      "Token instance of token to be bridged out. In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE}.`
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;

  @JSONSchema({
    description: "The quantity of token units to be bridged out."
  })
  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberProperty()
  quantity: BigNumber;

  @JSONSchema({
    description: "Recipient address for destination chain"
  })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @JSONSchema({
    description:
      "(Experimetnal) Serialzed OracleBridgeFeeAssertionDto signed by a valid Oracle Authority. To cover the gas fee on the other side"
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OracleBridgeFeeAssertionDto)
  destinationChainTxFee?: OracleBridgeFeeAssertionDto;
}
