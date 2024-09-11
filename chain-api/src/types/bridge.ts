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
  ArrayMaxSize,
  ArrayNotEmpty,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { BigNumberIsPositive, BigNumberProperty, EnumProperty, IsUserAlias } from "../validators";
import { ChainId } from "./ChainId";
import { TokenClassKey } from "./TokenClass";
import { TokenInstance, TokenInstanceKey, TokenInstanceQuantity } from "./TokenInstance";
import { ChainCallDTO } from "./dtos";
import { OracleBridgeFeeAssertionDto } from "./oracle";

@JSONSchema({
  description: "Criteria for fetching a single bridge."
})
export class FetchTokenBridgeDto extends ChainCallDTO {
  @JSONSchema({
    description: "Unique id corresponding to specific chain"
  })
  @EnumProperty(ChainId)
  @IsNotEmpty()
  public otherChainId: ChainId;

  @JSONSchema({
    description: "Token class related with this bridge."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClass: TokenClassKey;
}

@JSONSchema({
  description: "Contains properties of bridge to be created."
})
export class CreateTokenBridgeDto extends ChainCallDTO {
  @JSONSchema({
    description: "The type of the bridge."
  })
  @EnumProperty(ChainId)
  @IsNotEmpty()
  public otherChainId: ChainId;

  @JSONSchema({
    description: "Token class related with this bridge."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClass: TokenClassKey;

  @JSONSchema({
    description:
      "List of chain user identifiers who should become bridge authorities. " +
      "Only bridge authorities can make operations on behalf of the bridge. " +
      "By default the calling user becomes a single bridge authority. "
  })
  @IsUserAlias({ each: true })
  @IsOptional()
  authorities?: Array<string>;

  @JSONSchema({
    description:
      "Indicates whether the bridge will be burning or locking tokens. " +
      "By default the bridge is locking tokens."
  })
  @IsOptional()
  @IsBoolean()
  burning?: boolean;

  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsOptional()
  externalTokenClassKey?: TokenClassKey;
}

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

@JSONSchema({
  description:
    "Contains properties of bridge request for multiple tokens, i.e. a request to bridge tokens out from GalaChain."
})
export class BatchRequestTokenBridgeOutDto extends ChainCallDTO {
  @JSONSchema({
    description: "The type of the bridge."
  })
  @EnumProperty(ChainId)
  @IsNotEmpty()
  destinationChainId: ChainId;

  @JSONSchema({
    description: "The quantity of token units to be bridged out."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @IsNotEmpty()
  tokenInstanceQuantity: Array<TokenInstanceQuantity>;

  @JSONSchema({
    description: "Recipient address for destination chain"
  })
  @IsString()
  @IsNotEmpty()
  recipient: string;
}

@JSONSchema({
  description: "Describes bridge out operation to be performed."
})
export class BridgeTokenOutDto extends ChainCallDTO {
  @JSONSchema({
    description: "Bridge request ID to be fulfilled."
  })
  @IsNotEmpty()
  bridgeRequestId: string;
}

export class BridgeTokensDto extends ChainCallDTO {
  @JSONSchema({
    description:
      "Emitter of the message. Must be a 32-byte long hex string. Typically calculated as keccak256 hash of the channel name."
  })
  @IsNotEmpty()
  emitter: string;

  @JSONSchema({
    description: "Chain where the token is being bridged from."
  })
  @EnumProperty(ChainId)
  @IsNotEmpty()
  chainId: ChainId;

  @JSONSchema({
    description: "Sequential number corresponding to how many bridge transactions have been made."
  })
  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberProperty()
  sequence: string;

  @JSONSchema({
    description: "String value of the nonce bytes32 value output from solidity keccak256 function."
  })
  @IsNotEmpty()
  nonce: string;

  @JSONSchema({
    description: "Hex-encoded payload which is in specific format."
  })
  @IsNotEmpty()
  payload: string;
}

export interface Signature {
  r: string;
  s: string;
  v: number;
  index: number;
}

@JSONSchema({
  description: "Contains properties of bridge in operation from other blockchain to Gala Chain."
})
export class BridgeTokenInDto extends ChainCallDTO {
  @JSONSchema({
    description: "Sender address from emitter chain."
  })
  @IsString()
  @IsNotEmpty()
  public emitter: string;

  @JSONSchema({
    description: "Chain where the token is being bridged from."
  })
  @EnumProperty(ChainId)
  @IsNotEmpty()
  public chainId: ChainId;

  @JSONSchema({
    description: "Sequential number corresponding to how many bridge transactions have been made."
  })
  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberProperty()
  public sequence: BigNumber;

  @JSONSchema({
    description: "String value of the nonce bytes32 value output from solidity keccak256 function."
  })
  @IsNotEmpty()
  public nonce: string;

  @JSONSchema({
    description: "Array of signature objects."
  })
  @ArrayNotEmpty()
  public signatures: Array<Signature>;

  @JSONSchema({
    description: ""
  })
  @IsNotEmpty()
  public payload: string;
}

@JSONSchema({
  description: "Describes an action to bridge token up in batches."
})
export class BatchBridgeTokenInDto extends ChainCallDTO {
  static MAX_ARR_SIZE = 1000;

  @JSONSchema({
    description: "Bridge token in DTOs."
  })
  @ValidateNested({ each: true })
  @Type(() => BridgeTokenInDto)
  @ArrayNotEmpty()
  @ArrayMaxSize(BatchBridgeTokenInDto.MAX_ARR_SIZE)
  bridgeInDtos: Array<BridgeTokenInDto>;
}

@JSONSchema({
  description: "Updates mutable bridge configuration options"
})
export class UpdateTokenBridgeDto extends ChainCallDTO {
  @JSONSchema({
    description: "Destination chain ID"
  })
  @EnumProperty(ChainId)
  @IsNotEmpty()
  public otherChainId: ChainId;

  @JSONSchema({
    description: "Token class related with this bridge."
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  tokenClass: TokenClassKey;

  @JSONSchema({
    description:
      "List of chain user identifiers who should become bridge authorities. " +
      "Only bridge authorities can make operations on behalf of the bridge. " +
      "By default the calling user becomes a single bridge authority. "
  })
  @IsUserAlias({ each: true })
  @IsOptional()
  authorities?: Array<string>;

  @JSONSchema({
    description: "Bridge mode flag: true for burning, false for locking"
  })
  @IsOptional()
  @IsBoolean()
  burning?: boolean;
}

@JSONSchema({
  description: "Modifiers the verifiers' set for the whole bridge network."
})
export class ChangeVerifiersDto extends ChainCallDTO {
  @JSONSchema({
    description: "List of updated verifiers for bridge transactions."
  })
  @IsString({ each: true })
  @ArrayNotEmpty()
  verifiers: Array<string>;
}

@JSONSchema({
  description: "Re-encodes the bridge message with a new destination chain id"
})
export class RerouteBridgeTokenInMessageDto extends ChainCallDTO {
  @JSONSchema({
    description: "Failed bridge in message"
  })
  @ValidateNested()
  @Type(() => BridgeTokenInDto)
  @IsNotEmpty()
  failedBridgeMessage: BridgeTokenInDto;

  @JSONSchema({
    description: "New destination chainId to route the message to"
  })
  @EnumProperty(ChainId)
  @IsNotEmpty()
  newDestinationChainId: ChainId;
}

export class RerouteBridgeTokensOutDto extends ChainCallDTO {
  @JSONSchema({
    description: ""
  })
  @ValidateNested()
  @Type(() => BridgeTokenInDto)
  @IsNotEmpty()
  originalBridgeMessage: BridgeTokenInDto;

  @JSONSchema({
    description: ""
  })
  @ValidateNested()
  @Type(() => BridgeTokensDto)
  @IsNotEmpty()
  reroutedBridgeMessage: BridgeTokensDto;
}

export class FixMisconfiguredBridgesDto extends ChainCallDTO {
  @JSONSchema({
    description: "$MUSIC[GC] token class key"
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  musicGCTokenClassKey: TokenClassKey;

  @JSONSchema({
    description: "$GMUSIC token class key"
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  gmusicTokenClassKey: TokenClassKey;

  @JSONSchema({
    description: "$MUSIC token class key"
  })
  @ValidateNested()
  @Type(() => TokenClassKey)
  @IsNotEmpty()
  musicTokenClassKey: TokenClassKey;
}
