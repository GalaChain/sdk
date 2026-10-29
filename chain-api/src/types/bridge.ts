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
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateBy,
  ValidateNested,
  ValidationOptions,
  buildMessage
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import {
  BigNumberIsPositive,
  BigNumberProperty,
  ChainAddressValidationResult,
  EnumProperty,
  IsValidChainAddress,
  validateChainAddress
} from "../validators";
import { ChainId } from "./ChainId";
import { TokenInstance, TokenInstanceKey } from "./TokenInstance";
import { SubmitCallDTO } from "./dtos";
import { OracleBridgeFeeAssertionDto } from "./oracle";

function recipientMatchesDestination(recipient: string, chainId: ChainId): boolean {
  const result = validateChainAddress(recipient);
  if (chainId === ChainId.Ethereum) {
    return result === ChainAddressValidationResult.VALID_ETHEREUM;
  }
  if (chainId === ChainId.Solana) {
    return result === ChainAddressValidationResult.VALID_SOLANA;
  }
  if (chainId === ChainId.TON) {
    return result === ChainAddressValidationResult.VALID_TON;
  }
  return false;
}

function RecipientMatchesDestinationChain(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: "recipientMatchesDestinationChain",
      validator: {
        validate(recipient: unknown, args) {
          const chainId = (args?.object as { destinationChainId?: ChainId } | undefined)?.destinationChainId;
          return (
            typeof recipient === "string" &&
            chainId !== undefined &&
            recipientMatchesDestination(recipient, chainId)
          );
        },
        defaultMessage: buildMessage(
          () => "recipient must be a valid address for destinationChainId",
          validationOptions
        )
      }
    },
    validationOptions
  );
}

@JSONSchema({
  description: "Contains properties of bridge request, i.e. a request to bridge token out from GalaChain."
})
export class RequestTokenBridgeOutDto extends SubmitCallDTO {
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
  @IsValidChainAddress()
  @RecipientMatchesDestinationChain()
  @IsNotEmpty()
  recipient: string;

  @JSONSchema({
    description:
      "(Experimental) Serialized OracleBridgeFeeAssertionDto signed by a valid Bridge Oracle Authority, " +
      "to cover the gas fee on the destination chain. Its signingIdentity must equal the alias or " +
      "eth address of the key that signed the assertion."
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OracleBridgeFeeAssertionDto)
  destinationChainTxFee?: OracleBridgeFeeAssertionDto;

  @JSONSchema({
    description: "Optional flag some callers include with a bridge-out request. Ignored."
  })
  @IsOptional()
  @IsBoolean()
  wrap?: boolean;
}
