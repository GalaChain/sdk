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
import {
  ArrayNotEmpty,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { TokenInstance, TokenInstanceKey } from "../types/TokenInstance";
import { ChainCallDTO } from "../types/dtos";
import { BigNumberProperty } from "../utils";
import { BigNumberIsNotNegative, BigNumberIsPositive } from "../validators";
import { LockTokenQuantity } from "./LockTokenQuantity";

@JSONSchema({
  description: "Describes an action to lock a token."
})
export class LockTokenDto extends ChainCallDTO {
  @JSONSchema({
    description: "The current owner of tokens. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsNotEmpty()
  owner?: string;

  @JSONSchema({
    description:
      "User who will be able to unlock token. " +
      "If the value is missing, then token owner and lock creator can unlock " +
      "in all cases token authority can unlock token."
  })
  @IsNotEmpty()
  @IsOptional()
  lockAuthority?: string;

  @JSONSchema({
    description:
      "Token instance of token to be locked. In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE}.`
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;

  @JSONSchema({
    description: "The quantity of token units to be locked."
  })
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;

  @JSONSchema({
    description: "Allowance ids to be used on lock (optional)."
  })
  @IsString({ each: true })
  @IsOptional()
  @ArrayNotEmpty()
  useAllowances?: Array<string>;
}

@JSONSchema({
  description: "Describes an action to lock multiple tokens."
})
export class LockTokensDto extends ChainCallDTO {
  @JSONSchema({
    description:
      "User who will be able to unlock token. " +
      "If the value is missing, then token owner and lock creator can unlock " +
      "in all cases token authority can unlock token."
  })
  @IsNotEmpty()
  @IsOptional()
  lockAuthority?: string;

  @JSONSchema({
    description:
      "Array of token instances of token to be locked. In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE}.`
  })
  @ArrayNotEmpty()
  @Type(() => LockTokenQuantity)
  @ValidateNested({ each: true })
  tokenInstances: Array<LockTokenQuantity>;

  @JSONSchema({
    description: "Allowance ids to be used on lock (optional)."
  })
  @IsString({ each: true })
  @IsOptional()
  @ArrayNotEmpty()
  useAllowances?: Array<string>;

  @JSONSchema({
    description:
      "Name for the token holds (optional). This name will be applied to all token holds created by this Lock."
  })
  @IsString()
  @IsOptional()
  name?: string;

  @JSONSchema({
    description:
      "Expiration timestamp. The TokenHold will expire at this time. This name will be applied to all token holds created by this Lock."
  })
  @Min(0)
  @IsInt()
  @IsOptional()
  public expires?: number;
}

@JSONSchema({
  description: "Describes an action to unlock a token."
})
export class UnlockTokenDto extends ChainCallDTO {
  @JSONSchema({
    description: "Token instance of token to be unlocked."
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;

  @JSONSchema({
    description: "Optional quantity for unlocking fungible tokens. Not for use with NFT token instances."
  })
  @IsOptional()
  @ValidateIf((o) => o.tokenInstance.instance === TokenInstance.FUNGIBLE_TOKEN_INSTANCE)
  @BigNumberIsPositive()
  @BigNumberProperty()
  quantity?: BigNumber;
}

@JSONSchema({
  description: "Describes an action to unlock multiple tokens."
})
export class UnlockTokensDto extends ChainCallDTO {
  @JSONSchema({
    description:
      "Array of token instances of token to be locked. In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE}.`
  })
  @ArrayNotEmpty()
  @Type(() => LockTokenQuantity)
  @ValidateNested({ each: true })
  tokenInstances: Array<LockTokenQuantity>;

  @JSONSchema({
    description:
      "Name for the token holds (optional). Only token holds with this name will be Unlocked if provided."
  })
  @IsString()
  @IsOptional()
  name?: string;
}
