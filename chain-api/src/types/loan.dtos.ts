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
  ArrayUnique,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateNested
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import {
  BigNumberIsInteger,
  BigNumberIsPositive,
  BigNumberProperty,
  EnumProperty,
  IsDifferentValue,
  IsUserRef
} from "../validators";
import { Lender, LoanOffer, LoanStatus } from "./Loan";
import { TokenInstanceKey, TokenInstanceQuantity, TokenInstanceQueryKey } from "./TokenInstance";
import { ChainCallDTO, SubmitCallDTO } from "./dtos";

@JSONSchema({
  description:
    "Defines a loan offer. An owner of an NFT can loan their instance(s) " +
    "either directly to another user or via an intermediary (registrar). " +
    "Unlike TokenSwaps, a token Loan involves granting others the authority to Lock and Use an " +
    "NFT, but never transferToken ownership."
})
export class OfferLoanDto extends SubmitCallDTO {
  static DEFAULT_EXPIRES = 0;

  @JSONSchema({
    description:
      "Owner of the NFT offered up for loan. Optional field, by default set to chaincode calling user."
  })
  @IsOptional()
  @IsUserRef()
  public owner?: string;

  @JSONSchema({
    description:
      "Third party intermediary granted the authority to coordinate agreements between " +
      "owners and borrowers. If a registrar is not provided, then a borrower must be defined."
  })
  @IsDifferentValue("owner", { message: "registrar should be different than owner." })
  @IsOptional()
  @IsUserRef()
  public registrar?: string;

  @JSONSchema({
    description:
      "Borrower(s) that will be borrowing, using, or operating the loaned token. " +
      "A loan can be offered directly to specific borrowers to facilitate p2p loans."
  })
  // TODO: this decorator does not currently support comparing each value inside an array
  // @IsDifferentValue("owner", {
  //   message: "borrower(s) should be different than owner."
  // })
  @IsOptional()
  @ArrayUnique()
  @IsUserRef({ each: true })
  @ArrayMaxSize(12, { message: "p2p loan offers are currently limited to 12 per request." })
  public borrowers?: Array<string>;

  @JSONSchema({
    description:
      "The token instance(s) offered up for loan. Partial key queries " +
      "are supported and will grant separate loan offers for each NFT owned by " +
      "the issuer of the loan offer."
  })
  @ValidateNested()
  @Type(() => TokenInstanceQueryKey)
  @IsNotEmpty()
  public tokens: TokenInstanceQueryKey;

  @JSONSchema({
    description:
      "A reward expected by the owner upon completion of the loan term. " +
      "Optional. Some uses cases may dicate more specific terms or rewards, " +
      "and may instead define terms in another context/channel."
  })
  @ValidateNested({ each: true })
  @Type(() => TokenInstanceQuantity)
  @IsOptional()
  @ArrayUnique()
  public rewards?: Array<TokenInstanceQuantity>;

  @JSONSchema({
    description: "How many times the loan can filled."
  })
  @BigNumberIsPositive()
  @BigNumberIsInteger()
  @BigNumberProperty()
  public uses: BigNumber;

  @JSONSchema({
    description:
      "Unix timestamp of the date when the offer should expire. 0 means that it won't expire. " +
      `By default set to ${0}}.`
  })
  @IsOptional()
  @Min(0)
  @IsInt()
  public expires?: number;
}

@JSONSchema({
  description:
    "Response DTO for a successful loan offer (or multiple offers). This object encapsulates a LoanOffer object " +
    "written to chain and its corresponding Lender object written to chain. " +
    "Registrar-mediated loans offered openly will generally have a single offerlender pair. " +
    "p2p loans offered to 1 or more specific users will have multiple results. " +
    "Similarly, a LoanOffer submitted with a partial TokenQueryKey can create multiple offers " +
    "for all of the end user's NFT's that match the query. " +
    "The Lender.offer property contains the chain key for the LoanOffer, which can be used " +
    "to construct an AcceptLoanOfferDto at a later time."
})
export class LoanOfferResDto extends SubmitCallDTO {
  @JSONSchema({
    description: "A LoanOffer written to chain."
  })
  @ValidateNested()
  @Type(() => LoanOffer)
  offer: LoanOffer;

  @JSONSchema({
    description: "The Lender data written to chain, corresponding to the created LoanOffer."
  })
  @ValidateNested()
  @Type(() => Lender)
  lender: Lender;
}

export class AcceptLoanOfferDto extends SubmitCallDTO {
  @IsNotEmpty()
  offer: string;

  @IsUserRef()
  borrower: string;

  @ValidateNested()
  @Type(() => TokenInstanceKey)
  token: TokenInstanceKey;
}

export class FetchLoanOffersDto extends ChainCallDTO {
  @JSONSchema({
    description: "Partial or complete token instance query key to return offers for one or more NFTs."
  })
  @ValidateNested()
  @Type(() => TokenInstanceQueryKey)
  @IsOptional()
  tokenQuery?: TokenInstanceQueryKey;

  @IsOptional()
  @IsUserRef()
  owner?: string;

  @IsOptional()
  @IsNotEmpty()
  @EnumProperty(LoanStatus)
  status?: LoanStatus;
}

@JSONSchema({
  description:
    "Fetch Loans off chain, either by providing an owner key and/or a registrary identity key. " +
    "Optionally, filter by status. If neither owner nor registrary are provided, results set will be empty."
})
export class FetchLoansDto extends ChainCallDTO {
  @IsOptional()
  @IsUserRef()
  registrar?: string;

  @IsOptional()
  @IsUserRef()
  owner?: string;

  @IsOptional()
  @EnumProperty(LoanStatus)
  status?: LoanStatus;
}

export class CloseLoanDto extends SubmitCallDTO {
  @IsNotEmpty()
  loan: string;

  @IsNotEmpty()
  @EnumProperty(LoanStatus)
  status: LoanStatus;
}
