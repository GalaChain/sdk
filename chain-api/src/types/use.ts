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
import { ArrayNotEmpty, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { BigNumberIsNotNegative, BigNumberProperty, IsUserAlias } from "../validators";
import { TokenInstance, TokenInstanceKey } from "./TokenInstance";
import { ChainCallDTO } from "./dtos";

@JSONSchema({
  description: "Describes an action to release a token that is in use."
})
export class ReleaseTokenDto extends ChainCallDTO {
  @JSONSchema({
    description: "Token instance of token to be released."
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;
}

@JSONSchema({
  description: "Describes an action to use a token."
})
export class UseTokenDto extends ChainCallDTO {
  @JSONSchema({
    description: "The current owner of tokens. If the value is missing, chaincode caller is used."
  })
  @IsOptional()
  @IsUserAlias()
  owner?: string;

  @JSONSchema({
    description: "The user who is going to use token."
  })
  @IsUserAlias()
  inUseBy: string;

  @JSONSchema({
    description:
      "Token instance of token to be used. In case of fungible tokens, tokenInstance.instance field " +
      `should be set to ${TokenInstance.FUNGIBLE_TOKEN_INSTANCE}.`
  })
  @ValidateNested()
  @Type(() => TokenInstanceKey)
  @IsNotEmpty()
  tokenInstance: TokenInstanceKey;

  @JSONSchema({
    description: "The quantity of token units to be used."
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;

  @JSONSchema({
    description: "Allowance ids to be used (optional)."
  })
  @IsString({ each: true })
  @IsOptional()
  @ArrayNotEmpty()
  useAllowances?: Array<string>;
}
