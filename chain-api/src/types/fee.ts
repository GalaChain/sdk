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
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import {
  BigNumberIsInteger,
  BigNumberIsNotNegative,
  BigNumberProperty,
  EnumProperty,
  IsUserAlias,
  IsUserRef
} from "../validators";
import { ChainObject } from "./ChainObject";
import { FeeAuthorization } from "./FeeAuthorization";
import { FeeBalanceCreditReceipt } from "./FeeBalanceCreditReceipt";
import { FeeChannelPaymentReceipt } from "./FeeChannelPaymentReceipt";
import { FeeAccelerationRateType, FeeCodeDefinition } from "./FeeCodeDefinition";
import { FeeCodeTransferPercentage } from "./FeeCodeSplitFormula";
import { FeePendingBalance } from "./FeePendingBalance";
import { FeeThresholdUses } from "./FeeThresholdUses";
import { ChainCallDTO, SubmitCallDTO } from "./dtos";

@JSONSchema({
  description: "Configure GALA token properties on chain for use with supporting chaincalls."
})
export class FeePropertiesDto extends ChainCallDTO {
  @IsNotEmpty()
  public collection: string;

  @IsNotEmpty()
  public category: string;

  @IsNotEmpty()
  public type: string;

  @IsDefined()
  public additionalKey: string;

  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @JSONSchema({
    description:
      "Unique key of the DTO. It is used to prevent double execution of the same transaction on chain. " +
      "The key is saved on chain and checked before execution. " +
      "If a DTO with already saved key is used in transaction, the transaction will fail with " +
      "UniqueTransactionConflict error, which is mapped to HTTP 409 Conflict error. " +
      "In case of the error, no changes are saved to chain state.\n" +
      "The key is generated by the caller and should be unique for each DTO. " +
      "You can use `nanoid` library, UUID scheme, or any tool to generate unique string keys."
  })
  @IsNotEmpty()
  @IsOptional()
  public uniqueKey?: string;
}

@JSONSchema({
  description: "Empty DTO object for Read-only chaincode execution."
})
export class FetchFeePropertiesDto extends ChainCallDTO {}

@JSONSchema({
  description:
    "Fee Authorization DTO. End users can authorize a Burn of $GALA to credit their " +
    "fee balance on another channel."
})
export class FeeAuthorizationDto extends SubmitCallDTO {
  @JSONSchema({
    description: "A user authorizing a GalaChainFee payment."
  })
  @IsUserRef()
  authority: string;

  @JSONSchema({
    description: "Token Quantity authorized with this fee."
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;
}

@JSONSchema({
  description:
    "Fee Authorization Response DTO. Data transfer object representing a successful " +
    "transaction response to a FeeAuthorization."
})
export class FeeAuthorizationResDto extends ChainCallDTO {
  @JSONSchema({
    description: "A serialized FeeAuthorizationDto signed by the authorizing / spending user."
  })
  authorization: string;

  @JSONSchema({
    description: "The user that authorized the GalaChainFee payment."
  })
  @IsUserAlias()
  authority: string;

  @JSONSchema({
    description: "Unix Timestamp of fee authorization chain object creation."
  })
  @IsNotEmpty()
  public created: number;

  @JSONSchema({
    description: "Transaction ID where authorization was granted for fee spend."
  })
  @IsNotEmpty()
  public txId: string;

  @JSONSchema({
    description: "Token Quantity authorized with this fee."
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;

  @JSONSchema({
    description: "Chain Key of the Fee Authorization Chain Object newly saved in World State."
  })
  @IsString()
  @IsNotEmpty()
  feeAuthorizationKey: string;
}

@JSONSchema({
  description:
    "Fetch Fee Authorizations previously written to chain. " +
    "Optional properties can be added to narrow the search result set."
})
export class FetchFeeAuthorizationsDto extends ChainCallDTO {
  @JSONSchema({
    description: "Owner of the token burned to authorize a fee balance credit on another channel."
  })
  @IsOptional()
  @IsUserRef()
  authority?: string;

  @JSONSchema({
    description:
      "Year from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in YYYY format."
  })
  @IsOptional()
  @IsNotEmpty()
  year?: string;

  @JSONSchema({
    description:
      "Month from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in MM format."
  })
  @IsOptional()
  @IsNotEmpty()
  month?: string;

  @JSONSchema({
    description:
      "Day from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in DD format."
  })
  @IsOptional()
  @IsNotEmpty()
  day?: string;

  @JSONSchema({
    description:
      "Hour from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in HH format."
  })
  @IsOptional()
  @IsNotEmpty()
  hours?: string;

  @JSONSchema({
    description:
      "Minutes from timestamp of authorizaiton. Chain Key used for partial querying. " +
      "String in mm format."
  })
  @IsOptional()
  @IsNotEmpty()
  minutes?: string;

  @JSONSchema({
    description: "feeCode identifier for which this fee was authorized. Chain key used for specific querying."
  })
  @IsOptional()
  @IsNotEmpty()
  feeCode?: string;

  @JSONSchema({
    description: "Transaction ID where authorization was written. Chain key used for specific querying."
  })
  @IsOptional()
  @IsNotEmpty()
  txId?: string;

  @JSONSchema({
    description:
      "Bookmark for pagination queries of large result sets. Used to mark place for subsequent pages of results."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description: "Limit number of results. Useful for pagination queries."
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

@JSONSchema({
  description: "Response DTO from a successful FetchFeeAuthorizations query."
})
export class FetchFeeAuthorizationsResDto extends ChainCallDTO {
  @JSONSchema({ description: "List of fee authorizations." })
  @ValidateNested({ each: true })
  @Type(() => FeeAuthorization)
  results: FeeAuthorization[];

  @JSONSchema({ description: "Next page bookmark for large result sets." })
  @IsOptional()
  @IsNotEmpty()
  nextPageBookmark?: string;
}

@JSONSchema({
  description: "Fetch fee receipts."
})
export class FetchFeeChannelPaymentsDto extends ChainCallDTO {
  @JSONSchema({
    description:
      "Year from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in YYYY format."
  })
  @IsOptional()
  @IsNotEmpty()
  year?: string;

  @JSONSchema({
    description:
      "Month from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in MM format."
  })
  @IsOptional()
  @IsNotEmpty()
  month?: string;

  @JSONSchema({
    description:
      "Day from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in DD format."
  })
  @IsOptional()
  @IsNotEmpty()
  day?: string;

  @JSONSchema({
    description:
      "Hour from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in HH format."
  })
  @IsOptional()
  @IsNotEmpty()
  hours?: string;

  @JSONSchema({
    description:
      "Minutes from timestamp of authorizaiton. Chain Key used for partial querying. " +
      "String in mm format."
  })
  @IsOptional()
  @IsNotEmpty()
  minutes?: string;

  @JSONSchema({
    description: "feeCode identifier for which this fee was paid. Chain key used for specific querying."
  })
  @IsOptional()
  @IsNotEmpty()
  feeCode?: string;

  @JSONSchema({
    description: "Owner of the token burned to authorize a fee balance credit on another channel."
  })
  @IsOptional()
  @IsUserRef()
  paidByUser?: string;

  @JSONSchema({
    description: "Transaction ID where authorization was written. Chain key used for specific querying."
  })
  @IsOptional()
  @IsNotEmpty()
  txId?: string;

  @JSONSchema({
    description:
      "Bookmark for pagination queries of large result sets. Used to mark place for subsequent pages of results."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description: "Limit number of results. Useful for pagination queries."
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

@JSONSchema({
  description: "FeeChannelPayment Object Value with Chain Key."
})
export class FeeChannelPaymentKeyValueResult extends ChainCallDTO {
  @JSONSchema({ description: "Chain key identifying object on chain." })
  key: string;

  @JSONSchema({ description: "Chain key identifying object on chain." })
  @ValidateNested()
  @Type(() => FeeChannelPaymentReceipt)
  value: FeeChannelPaymentReceipt;
}

@JSONSchema({
  description: "Response DTO from a successful FetchFeeChannelPayments request."
})
export class FetchFeeChannelPaymentsResDto extends ChainCallDTO {
  @JSONSchema({ description: "List of fee payment receipts." })
  @ValidateNested({ each: true })
  @Type(() => FeeChannelPaymentKeyValueResult)
  results: FeeChannelPaymentKeyValueResult[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsNotEmpty()
  nextPageBookmark?: string;
}

@JSONSchema({
  description: "Fetch fee receipts."
})
export class FetchFeeCreditReceiptsDto extends ChainCallDTO {
  @JSONSchema({
    description:
      "Year from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in YYYY format."
  })
  @IsOptional()
  @IsNotEmpty()
  year?: string;

  @JSONSchema({
    description:
      "Month from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in MM format."
  })
  @IsOptional()
  @IsNotEmpty()
  month?: string;

  @JSONSchema({
    description:
      "Day from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in DD format."
  })
  @IsOptional()
  @IsNotEmpty()
  day?: string;

  @JSONSchema({
    description:
      "Hour from timestamp of authorizaiton. Chain Key used for partial querying. " + "String in HH format."
  })
  @IsOptional()
  @IsNotEmpty()
  hours?: string;

  @JSONSchema({
    description:
      "Minutes from timestamp of receipt creation. Chain Key used for partial querying. " +
      "String in mm format."
  })
  @IsOptional()
  @IsNotEmpty()
  minutes?: string;

  @JSONSchema({
    description: "feeCode identifier for which this receipt. Chain key used for specific querying."
  })
  @IsOptional()
  @IsNotEmpty()
  feeCode?: string;

  @JSONSchema({
    description: "Receipt issued to user."
  })
  @IsOptional()
  @IsUserRef()
  creditToUser?: string;

  @JSONSchema({
    description: "Transaction ID where receipt was written. Chain key used for specific querying."
  })
  @IsOptional()
  @IsNotEmpty()
  txId?: string;

  @JSONSchema({
    description:
      "Bookmark for pagination queries of large result sets. Used to mark place for subsequent pages of results."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description: "Limit number of results. Useful for pagination queries."
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

@JSONSchema({
  description: "FeeBalanceCreditReceipt Object Value with Chain Key."
})
export class FeeCreditReceiptKeyValueResult extends ChainCallDTO {
  @JSONSchema({ description: "Chain key identifying object on chain." })
  key: string;

  @JSONSchema({ description: "Chain key identifying object on chain." })
  @ValidateNested()
  @Type(() => FeeChannelPaymentReceipt)
  value: FeeBalanceCreditReceipt;
}

@JSONSchema({
  description: "Response DTO from a successful FetchFeeCreditReceipts request."
})
export class FetchFeeCreditReceiptsResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of fee payment receipts." })
  @ValidateNested({ each: true })
  @Type(() => FeeCreditReceiptKeyValueResult)
  results: FeeCreditReceiptKeyValueResult[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsNotEmpty()
  nextPageBookmark?: string;
}

@JSONSchema({
  description: "Query channel for Transaction FeeSchedule, comprised of currently-defined FeeCodes."
})
export class FetchFeeScheduleDto extends ChainCallDTO {
  @JSONSchema({ description: "Limit query to a specific fee code." })
  @IsOptional()
  @IsNotEmpty()
  feeCode?: string;
}

@JSONSchema({
  description: "Response DTO from a successful FetchFeeSchedule request."
})
export class FetchFeeScheduleResDto extends ChainCallDTO {
  @JSONSchema({ description: "List of fee code definitions." })
  @ValidateNested({ each: true })
  @Type(() => FeeCodeDefinition)
  results: FeeCodeDefinition[];

  @JSONSchema({ description: "Next page bookmark" })
  @IsOptional()
  @IsNotEmpty()
  nextPageBookmark?: string;
}

@JSONSchema({
  description: "Fetch Pending Fee Balances. Optionally limit query to a single user. "
})
export class FetchFeePendingBalancesDto extends ChainCallDTO {
  @JSONSchema({ description: "(optional) Limit results to a single owner." })
  @IsOptional()
  @IsUserRef()
  owner?: string;

  @JSONSchema({
    description:
      "Bookmark for pagination queries of large result sets. Used to mark place for subsequent pages of results."
  })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description: "Limit number of results. Useful for pagination queries."
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

@JSONSchema({
  description: "FeeChannelPayment Object Value with Chain Key."
})
export class FeePendingBalanceKeyValueResult extends ChainCallDTO {
  @JSONSchema({ description: "Chain key identifying object on chain." })
  key: string;

  @JSONSchema({ description: "Chain key identifying object on chain." })
  @ValidateNested()
  @Type(() => FeePendingBalance)
  value: FeePendingBalance;
}

@JSONSchema({
  description: "Response DTO from a successful FetchFeePendingBalances request."
})
export class FetchFeePendingBalancesResDto extends ChainCallDTO {
  @JSONSchema({ description: "List of fee pending balances." })
  @ValidateNested({ each: true })
  @Type(() => FeePendingBalanceKeyValueResult)
  results: FeePendingBalanceKeyValueResult[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsNotEmpty()
  nextPageBookmark?: string;
}

@JSONSchema({
  description:
    "Settle pending fee balances. Zero out balances and convert any " +
    "pending amount to a claim/credit for $GALA."
})
export class FeeBalanceSettlementDto extends ChainCallDTO {
  @JSONSchema({
    description: "Limit query/action time range. Start date as a unix timestamp. (optional)"
  })
  @IsOptional()
  @IsNotEmpty()
  public startDate?: number;

  @JSONSchema({
    description: "Limit query/action time range. End date as a unix timestamp. (optional)"
  })
  @IsOptional()
  @IsNotEmpty()
  public endDate?: number;

  @JSONSchema({
    description: "Limit query/action to a single user. (optional)"
  })
  @IsOptional()
  @IsUserRef()
  owner?: string;
}

@JSONSchema({
  description: "Define a Fee Rate Schedule for a Fee Code."
})
export class FeeCodeDefinitionDto extends SubmitCallDTO {
  @IsString()
  @IsNotEmpty()
  public feeCode: string;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public feeThresholdUses: BigNumber;

  @IsNumber()
  public feeThresholdTimePeriod: number;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public baseQuantity: BigNumber;

  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public maxQuantity: BigNumber;

  @JSONSchema({
    description: "Type of FeeAccelerationRate."
  })
  @EnumProperty(FeeAccelerationRateType)
  public feeAccelerationRateType: FeeAccelerationRateType;

  @IsNotEmpty()
  @BigNumberProperty()
  public feeAccelerationRate: BigNumber;

  @JSONSchema({
    description:
      "(Optional) Set to 'true' to debit fees from cross-channel pending balances. " +
      "Set 'true' if $GALA is not defined on this channel. Set to 'false' or leave undefined " +
      "for fees assessed on the assets channel where users maintain their $GALA balances."
  })
  @IsOptional()
  @IsBoolean()
  public isCrossChannel?: boolean;
}

@JSONSchema({
  description:
    "Define a Formula for a Fee Code that splits the Fee between a burn percentage " +
    "and one or more transfer addresses/identities, e.g. locked pools used for rewards or redemption"
})
export class FeeCodeSplitFormulaDto extends SubmitCallDTO {
  @JSONSchema({
    description:
      "feeCode which this split formula should apply to. If the FeeCodeDefinition object does not " +
      "exist on chain yet, the chaincode will throw an error. Be sure to define a FeeCodeDefinition " +
      "before attempting to define a split formula."
  })
  @IsString()
  @IsNotEmpty()
  public feeCode: string;

  @JSONSchema({
    description:
      "A number between 0 and 1 that represents the percentage / proportion " +
      "of the total fee which should be burned. e.g 0.9 for '90%'. "
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  public burnPercentage: number;

  @JSONSchema({
    description:
      "FeeCodeTransferPercentage objects represent the identity or identities to which " +
      "a percentage (or percentages) of the paid fee should be transferred to instead of being burned."
  })
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => FeeCodeTransferPercentage)
  public transferPercentages: FeeCodeTransferPercentage[];
}

@JSONSchema({
  description:
    "Fee Verification DTO. With a valid signature from an Authoritative User, " +
    "used to verify that a Fee was paid across channels. " +
    "Typically, this will be a type of multi-signature DTO or a double signed DTO. " +
    "That is, the `authorization` property contains the original authorization DTO signed by " +
    "the End User. And the overall FeeVerificationDto will be signed by an Authoritative/Administrative " +
    "user (i.e. a CuratorUser). The Chaincode can then verify definitively that both a) the end user did " +
    "authorize a spend, and b) the Authoritative/Administrative user confirms that this authorization was " +
    "successfully approved/written/burned on the assets channel."
})
export class FeeVerificationDto extends SubmitCallDTO {
  @JSONSchema({
    description: "A serialized FeeAuthorizationDto signed by the authorizing / spending user."
  })
  authorization: string;

  @JSONSchema({
    description:
      "The user authorizing a GalaChainFee payment. Expected to be the same user " +
      "which signed the DTO provided in the `authorization` property."
  })
  @IsUserRef()
  authority: string;

  @JSONSchema({
    description: "Unix Timestamp of fee authorization chain object creation."
  })
  @IsNotEmpty()
  public created: number;

  @JSONSchema({
    description: "Transaction ID where authorization was granted for fee spend."
  })
  @IsNotEmpty()
  public txId: string;

  @JSONSchema({
    description: "Token Quantity authorized with this fee."
  })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  quantity: BigNumber;

  @JSONSchema({
    description: "Chain Key referencing Fee Authorization Chain Object saved in World State."
  })
  @IsString()
  @IsNotEmpty()
  feeAuthorizationKey: string;
}

@JSONSchema({
  description: "Fetch Fee Threshold Uses for a Fee Code and User."
})
export class FetchFeeThresholdUsesDto extends ChainCallDTO {
  @JSONSchema({
    description: "feeCode identifier for which this fee was paid."
  })
  @IsString()
  @IsNotEmpty()
  public feeCode: string;

  @JSONSchema({ description: "user who paid this fee." })
  @IsString()
  @IsUserRef()
  public user: string;
}

@JSONSchema({
  description: "Response DTO from a successful FetchFeeThresholdUses request."
})
export class FetchFeeThresholdUsesResDto extends ChainCallDTO {
  @JSONSchema({
    description: "feeCode identifier for which this fee was paid."
  })
  @IsString()
  @IsNotEmpty()
  public feeCode: string;

  @JSONSchema({ description: "user who paid this fee." })
  @IsString()
  @IsUserRef()
  public user: string;

  @JSONSchema({ description: "total cumulative uses of this fee." })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public cumulativeUses: BigNumber;

  @JSONSchema({ description: "total cumulative quantity of this fee." })
  @IsNotEmpty()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public cumulativeFeeQuantity: BigNumber;
}

@JSONSchema({
  description: "Fetch Fee Threshold Uses with pagination. Optionally limit by feeCode."
})
export class FetchFeeThresholdUsesWithPaginationDto extends ChainCallDTO {
  @JSONSchema({
    description: "feeCode identifier to limit search results."
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  public feeCode?: string;

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsNotEmpty()
  bookmark?: string;

  @JSONSchema({
    description: "Limit number of results. Useful for pagination queries."
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

@JSONSchema({
  description: "Chain Object Value with Chain Key."
})
export class FeeThresholdUsesKeyValueResult extends ChainCallDTO {
  @JSONSchema({ description: "Chain key identifying object on chain." })
  key: string;

  @JSONSchema({ description: "Chain key identifying object on chain." })
  @ValidateNested()
  @Type(() => ChainObject)
  value: FeeThresholdUses;
}

@JSONSchema({
  description: "Response DTO from a Fetch Fee Threshold Uses with pagination request."
})
export class FetchFeeThresholdUsesWithPaginationResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of FeeThresholdUses." })
  @ValidateNested({ each: true })
  @Type(() => FeeThresholdUsesKeyValueResult)
  results: FeeThresholdUsesKeyValueResult[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsNotEmpty()
  nextPageBookmark?: string;
}

@JSONSchema({
  description:
    "Take an action on a set of provided chain keys, acquired from a fetch response. " +
    "E.g. ResetFeeThresholds, SettleFeePaymentReceipts, etc."
})
export class ChainKeysDto extends ChainCallDTO {
  @JSONSchema({
    description: "A list of composite keys to pass to getObjectsByKeys method."
  })
  @ArrayNotEmpty()
  @ArrayMaxSize(100000)
  @ArrayUnique()
  chainKeys: string[];
}

@JSONSchema({
  description: "Chain Object Value with Chain Key."
})
export class ChainKeyValueResult extends ChainCallDTO {
  @JSONSchema({ description: "Chain key identifying object on chain." })
  key: string;

  @JSONSchema({ description: "Chain key identifying object on chain." })
  @ValidateNested()
  @Type(() => ChainObject)
  value: ChainObject;
}

@JSONSchema({
  description: "Response DTO from a Fetch Fee* Pagination request."
})
export class FetchChainKeyValueObjectsWithPaginationResponse extends ChainCallDTO {
  @JSONSchema({ description: "List of FeeThresholdUses." })
  @ValidateNested({ each: true })
  @Type(() => ChainKeyValueResult)
  results: ChainKeyValueResult[];

  @JSONSchema({ description: "Next page bookmark." })
  @IsOptional()
  @IsNotEmpty()
  nextPageBookmark?: string;
}

@JSONSchema({
  description: "FeeBalanceSettlement"
})
export class FeeBalanceSettlement extends ChainCallDTO {
  @JSONSchema({
    description: "The FeePendingBalance which was settled."
  })
  @ValidateNested()
  @Type(() => FeePendingBalance)
  balance: FeePendingBalance;

  @JSONSchema({
    description: "If the value was greater than 0, the credit receipt issued."
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FeeBalanceCreditReceipt)
  receipt?: FeeBalanceCreditReceipt | undefined;
}

@JSONSchema({
  description: "Response DTO from a SettleFeeBalances request."
})
export class SettleFeeBalancesResponse extends ChainCallDTO {
  @JSONSchema({
    description: "Results set"
  })
  @ValidateNested({ each: true })
  @Type(() => FeeBalanceSettlement)
  results: FeeBalanceSettlement[];
}

@JSONSchema({
  description: "Response DTO from a SettleFeeCreditReceipts request."
})
export class SettleFeeCreditReceiptsResponse extends ChainCallDTO {
  @JSONSchema({
    description: "Results set"
  })
  @ValidateNested({ each: true })
  @Type(() => FeeBalanceCreditReceipt)
  results: FeeBalanceCreditReceipt[];
}

@JSONSchema({
  description: "Response DTO from a SettleFeePaymentReceipts request."
})
export class SettleFeePaymentReceiptsResponse extends ChainCallDTO {
  @JSONSchema({
    description: "Results set"
  })
  @ValidateNested({ each: true })
  @Type(() => FeeChannelPaymentReceipt)
  results: FeeChannelPaymentReceipt[];
}

@JSONSchema({
  description: "Define a FeeExemption for a specific user."
})
export class FeeExemptionDto extends ChainCallDTO {
  @JSONSchema({
    description: "The user / identity that should be exempt from fees."
  })
  @IsString()
  @IsUserRef()
  user: string;

  @JSONSchema({
    description: "(Optional). If provided, the user's exemption will be limited to the provided fee codes."
  })
  @IsOptional()
  @ArrayUnique()
  limitTo?: string[];
}
