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
  BatchFillTokenSwapDto,
  BatchMintTokenDto,
  BurnTokensDto,
  ChainCallDTO,
  ChainError,
  ChainObject,
  ChainsWithBridgeFeeSupport,
  CreateNftCollectionDto,
  ErrorCode,
  FeeAccelerationRateType,
  FeeCodeDefinition,
  FeeGateCodes,
  FillTokenSwapDto,
  FulfillMintAllowanceDto,
  FulfillMintDto,
  GrantNftCollectionAuthorizationDto,
  HighThroughputGrantAllowanceDto,
  HighThroughputMintTokenDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  OracleBridgeFeeAssertion,
  OracleBridgeFeeAssertionDto,
  OracleDefinition,
  OraclePriceAssertion,
  OraclePriceCrossRateAssertion,
  PaymentRequiredError,
  RequestTokenBridgeOutDto,
  TerminateTokenSwapDto,
  TokenClassKey,
  TokenInstanceKey,
  TokenMintConfiguration,
  TransferTokenDto,
  UnauthorizedError,
  UserAlias,
  ValidationFailedError,
  createValidChainObject
} from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { authenticate } from "../contracts";
import { fetchTokenMintConfiguration } from "../mint";
import { KnownOracles } from "../oracle";
import { resolveUserAlias } from "../services/resolveUserAlias";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";
import { burnToMintProcessing } from "./extendedFeeGateProcessing";
import { galaFeeGate, writeUsageAndCalculateFeeAmount } from "./galaFeeGate";
import { payFeeFromCrossChannelAuthorization } from "./payFeeFromCrossChannelAuthorization";
import { payFeeImmediatelyFromBalance } from "./payFeeImmediatelyFromBalance";

export interface IRequestOwner {
  owner?: string | undefined;
}

const assertionExpirationLimit: number = process?.env?.ORACLE_ASSERTION_EXPIRATION
  ? isFinite(parseInt(process?.env?.ORACLE_ASSERTION_EXPIRATION, 10))
    ? parseInt(process?.env?.ORACLE_ASSERTION_EXPIRATION)
    : 15 * 60 * 1000
  : 15 * 60 * 1000;

export function extractUniqueOwnersFromRequests(ctx: GalaChainContext, requests: IRequestOwner[]) {
  const owners = requests.map((r) => r.owner ?? ctx.callingUser);

  return Array.from(new Set(owners));
}

export interface IRequestUser {
  user?: string | undefined;
}

export function extractUniqueUsersFromRequests(ctx: GalaChainContext, requests: IRequestUser[]) {
  const users: string[] = requests.map((r) => r.user ?? ctx.callingUser);

  return Array.from(new Set(users));
}

export async function batchFillTokenSwapFeeGate(ctx: GalaChainContext, dto: BatchFillTokenSwapDto) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.BatchFillTokenSwap });
}

export async function batchMintTokenFeeGate(ctx: GalaChainContext, dto: BatchMintTokenDto) {
  const feeCode = FeeGateCodes.BatchMintToken;
  const owners: string[] = extractUniqueOwnersFromRequests(ctx, dto.mintDtos);

  for (const owner of owners) {
    await galaFeeGate(ctx, {
      feeCode
      // v1 fees requires only callingUser identities pay fees
      // uncomment below to require benefiting / initiating user to pay,
      // regardless of who executes the method
      // activeUser: owner
    });
  }

  const batchPayments: PaymentRequiredError[] = [];

  for (const mintDto of dto.mintDtos) {
    const owner = mintDto.owner ? await resolveUserAlias(ctx, mintDto.owner) : ctx.callingUser;
    const tokenClass = mintDto.tokenClass;
    const quantity = mintDto.quantity;

    await combinedMintFees(ctx, { feeCode, tokenClass, owner, quantity }).catch((e) => {
      if (e instanceof ChainError && e.code === ErrorCode.PAYMENT_REQUIRED) {
        batchPayments.push(e);
      } else {
        throw e;
      }
    });
  }

  if (batchPayments.length > 0) {
    throw new PaymentRequiredError(
      `batchMintToken failed with ${batchPayments.length} payment required errors`,
      { payments: batchPayments }
    );
  }

  return Promise.resolve();
}

export async function burnTokensFeeGate(ctx: GalaChainContext, dto: BurnTokensDto) {
  return galaFeeGate(ctx, {
    feeCode: FeeGateCodes.BurnTokens
    // v1 fees requires only callingUser identities pay fees
    // activeUser: dto.owner ?? ctx.callingUser
  });
}

export async function terminateTokenSwapFeeGate(ctx: GalaChainContext, dto: TerminateTokenSwapDto) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.TerminateTokenSwap });
}

export async function highThroughputMintRequestFeeGate(
  ctx: GalaChainContext,
  dto: HighThroughputMintTokenDto
) {
  const owner = dto.owner ? await resolveUserAlias(ctx, dto.owner) : ctx.callingUser;
  const feeCode = FeeGateCodes.HighThroughputMintRequest;

  await combinedMintFees(ctx, { feeCode, tokenClass: dto.tokenClass, owner, quantity: dto.quantity });
}

export async function highThroughputMintFulfillFeeGate(ctx: GalaChainContext, dto: FulfillMintDto) {
  const owners: string[] = extractUniqueOwnersFromRequests(ctx, dto.requests);

  for (const owner of owners) {
    await galaFeeGate(ctx, {
      feeCode: FeeGateCodes.HighThroughputMintFulfill,
      activeUser: owner
    });
  }

  return Promise.resolve();
}

export async function highThroughputMintAllowanceRequestFeeGate(
  ctx: GalaChainContext,
  dto: HighThroughputGrantAllowanceDto
) {
  const users: string[] = extractUniqueUsersFromRequests(ctx, dto.quantities);

  for (const user of users) {
    await galaFeeGate(ctx, {
      feeCode: FeeGateCodes.HighThroughputMintAllowanceRequest,
      activeUser: user
    });
  }

  return Promise.resolve();
}

export async function highThroughputMintAllowanceFulfillFeeGate(
  ctx: GalaChainContext,
  dto: FulfillMintAllowanceDto
) {
  const owners: string[] = extractUniqueOwnersFromRequests(ctx, dto.requests);

  for (const owner of owners) {
    await galaFeeGate(ctx, {
      feeCode: FeeGateCodes.HighThroughputMintAllowanceFulfill,
      activeUser: owner
    });
  }

  return Promise.resolve();
}

export async function mintTokenFeeGate(ctx: GalaChainContext, dto: MintTokenDto) {
  const feeCode = FeeGateCodes.MintToken;
  const owner = dto.owner ? await resolveUserAlias(ctx, dto.owner) : ctx.callingUser;

  await combinedMintFees(ctx, { feeCode, tokenClass: dto.tokenClass, owner, quantity: dto.quantity });
}

export async function mintTokenWithAllowanceFeeGate(
  ctx: GalaChainContext,
  params: MintTokenWithAllowanceDto
) {
  const owner = params.owner ? await resolveUserAlias(ctx, params.owner) : ctx.callingUser;
  const feeCode = FeeGateCodes.MintTokenWithAllowance;

  await combinedMintFees(ctx, {
    feeCode,
    tokenClass: params.tokenClass,
    owner,
    quantity: params.quantity
  });
}

export interface RequestTokenBridgeOutFeeGateParams {
  destinationChainId: number;
  tokenInstance: TokenInstanceKey;
  quantity: BigNumber;
  destinationChainTxFee?: OracleBridgeFeeAssertionDto;
}

export async function requestTokenBridgeOutFeeGate(
  ctx: GalaChainContext,
  dto: RequestTokenBridgeOutFeeGateParams
) {
  const { destinationChainId } = dto;

  // Dynamic, gas based fees are intended for bridging outside of GalaChain
  // Different external chain may have differing methods of calculating transaction fees
  // Supported chains are currently defined in @gala-chain/api
  if (!ChainsWithBridgeFeeSupport.includes(destinationChainId)) {
    return;
  }

  const oracleKey = ChainObject.getCompositeKeyFromParts(OracleDefinition.INDEX_KEY, [KnownOracles.Bridge]);

  const oracleDefinitionLookup: OracleDefinition | ChainError = await getObjectByKey(
    ctx,
    OracleDefinition,
    oracleKey
  ).catch((e) => e);

  if (oracleDefinitionLookup instanceof ChainError && oracleDefinitionLookup.code === ErrorCode.NOT_FOUND) {
    // if the oracle is not defined, we don't charge a dynamic, gas based fee
    return galaFeeGate(ctx, { feeCode: FeeGateCodes.BridgeTokenOut });
  }

  const oracleDefinition: OracleDefinition = oracleDefinitionLookup as OracleDefinition;

  const oracleAssertion: OracleBridgeFeeAssertionDto | undefined = dto.destinationChainTxFee;

  if (oracleAssertion === undefined) {
    throw new ValidationFailedError(
      `Bridge Token Out Fee Gate requires a valid Oracle Assertion providing the ` +
        `estimated transaction fee for the destination chain. Provide a signed ` +
        `OracleBridgeFeeAssertionDto in the destinationChainTxFee property. `
    );
  }

  await oracleAssertion.validateOrReject().catch((e) => {
    throw new ValidationFailedError(
      `Bridge Token Out Fee Gate requires a valid Oracle Assertion providing the ` +
        `estimated transaction fee for the destination chain. Provided ` +
        `oracleAssertion DTO validation failed: ${e.message}`
    );
  });

  const assertionTimestamp: number = oracleAssertion.timestamp;

  const assertionExpirationTime: number = new Date(
    new Date(ctx.txUnixTime).getTime() - assertionExpirationLimit
  ).getTime();

  if (assertionTimestamp <= assertionExpirationTime) {
    throw new ValidationFailedError(
      `BridgeTokenOut to destination chain ${destinationChainId} requires ` +
        `an Oracle to calculate an appropriate transaction fee. ` +
        `Received expired assertion with timestamp: ${assertionTimestamp}. ` +
        `Conifigured ORACLE_ASSERTION_EXPIRATION: ${assertionExpirationLimit}, ` +
        `Calculated expiration time: ${assertionExpirationTime}. `
    );
  }

  const identity = await authenticate(ctx, oracleAssertion, undefined);

  if (
    !oracleDefinition.authorities.includes(identity.alias) &&
    !oracleDefinition.authorities.includes(identity.ethAddress ?? "") &&
    !oracleDefinition.authorities.includes(oracleAssertion.signingIdentity)
  ) {
    throw new UnauthorizedError(
      `BridgeTokenOut to destination chain ${destinationChainId} requires ` +
        `an Oracle to calculate an appropriate transaction fee. ` +
        `Received an assertion dto  with alias: ${identity.alias}, ` +
        `ethAddress?: ${identity.ethAddress}, and ` +
        `assertion signingIdentity: ${oracleAssertion.signingIdentity}. ` +
        `None of which are listed in the authorities definition: ` +
        `${oracleDefinition.authorities.join(", ")}`
    );
  }

  const gasFeeQuantity: BigNumber = oracleAssertion.estimatedTotalTxFeeInGala;

  // standard GalaChain usage based fees optionally defined with FeeCodeDefinition(s)
  const { feeAmount, feeCodeDefinitions, cumulativeUses } = await writeUsageAndCalculateFeeAmount(ctx, {
    feeCode: FeeGateCodes.BridgeTokenOut
  });

  const individualUsageFee = feeAmount;

  const bridgeSpecificFeeDefinitions: FeeCodeDefinition[] = feeCodeDefinitions.filter((d) => {
    return (
      d.feeAccelerationRateType === FeeAccelerationRateType.Custom &&
      cumulativeUses.isGreaterThanOrEqualTo(d.feeThresholdUses)
    );
  });

  const txFeeAccelerationDefinition = bridgeSpecificFeeDefinitions.pop();

  const destinationChainTxFeeMultiplier: BigNumber =
    txFeeAccelerationDefinition !== undefined
      ? txFeeAccelerationDefinition.feeAccelerationRate
      : new BigNumber("1");

  const paddedGasFeeQuantity = gasFeeQuantity
    .times(destinationChainTxFeeMultiplier)
    .decimalPlaces(FeeCodeDefinition.DECIMAL_PRECISION);

  const combinedFeeTotal = paddedGasFeeQuantity.plus(individualUsageFee);

  if (combinedFeeTotal.isGreaterThan(0)) {
    const isCrossChannelFee = feeCodeDefinitions[0]?.isCrossChannel ?? false;

    if (isCrossChannelFee) {
      await payFeeFromCrossChannelAuthorization(ctx, {
        quantity: combinedFeeTotal,
        feeCode: FeeGateCodes.BridgeTokenOut
      });
    } else {
      await payFeeImmediatelyFromBalance(ctx, {
        quantity: combinedFeeTotal,
        feeCode: FeeGateCodes.BridgeTokenOut
      });
    }
  }

  const {
    galaExchangeRate,
    galaExchangeCrossRate,
    galaDecimals,
    bridgeToken,
    bridgeTokenIsNonFungible,
    estimatedTxFeeUnitsTotal,
    estimatedPricePerTxFeeUnit,
    estimatedTotalTxFeeInExternalToken,
    estimatedTotalTxFeeInGala,
    timestamp,
    signingIdentity
  } = oracleAssertion;

  const txid = ctx.stub.getTxID();

  const bridgeFeeAssertionRecord = plainToInstance(OracleBridgeFeeAssertion, {
    oracle: KnownOracles.Bridge,
    signingIdentity,
    txid,
    galaDecimals,
    bridgeToken,
    bridgeTokenIsNonFungible,
    estimatedTxFeeUnitsTotal,
    estimatedPricePerTxFeeUnit,
    estimatedTotalTxFeeInExternalToken,
    estimatedTotalTxFeeInGala,
    timestamp
  });

  if (galaExchangeRate !== undefined) {
    bridgeFeeAssertionRecord.galaExchangeRate = await createValidChainObject(OraclePriceAssertion, {
      ...galaExchangeRate,
      txid
    });
  } else if (galaExchangeCrossRate !== undefined) {
    const baseTokenCrossRate: OraclePriceAssertion = await createValidChainObject(OraclePriceAssertion, {
      ...galaExchangeCrossRate.baseTokenCrossRate,
      txid
    });

    const quoteTokenCrossRate: OraclePriceAssertion = await createValidChainObject(OraclePriceAssertion, {
      ...galaExchangeCrossRate.quoteTokenCrossRate,
      txid
    });

    bridgeFeeAssertionRecord.galaExchangeCrossRate = await createValidChainObject(
      OraclePriceCrossRateAssertion,
      {
        ...galaExchangeCrossRate,
        baseTokenCrossRate,
        quoteTokenCrossRate,
        txid
      }
    );
  }

  await putChainObject(ctx, bridgeFeeAssertionRecord);
}

export async function transferTokenFeeGate(ctx: GalaChainContext, dto: TransferTokenDto) {
  return galaFeeGate(ctx, {
    feeCode: FeeGateCodes.TransferToken
    // v1 fees requires only callingUser identities pay fees
    // uncomment below to require benefiting / initiating user to pay,
    // regardless of who executes the method
    // activeUser: dto.from ?? ctx.callingUser
  });
}

export async function galaSwapRequestFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.SwapTokenRequest });
}

export async function galaSwapFillFeeGate(ctx: GalaChainContext, dto: FillTokenSwapDto) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.SwapTokenFill });
}

export async function galaSwapBatchFillFeeGate(ctx: GalaChainContext, dto: BatchFillTokenSwapDto) {
  for (let i = 0; i < dto.swapDtos.length; i++) {
    await galaFeeGate(ctx, { feeCode: FeeGateCodes.SwapTokenFill });
  }
}

export async function nftCollectionAuthorizationFeeGate(
  ctx: GalaChainContext,
  dto: GrantNftCollectionAuthorizationDto
) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.NftCollectionAuthorization });
}

export async function createNftCollectionFeeGate(ctx: GalaChainContext, dto: CreateNftCollectionDto) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.CreateNftCollection });
}

export async function simpleFeeGate(ctx: GalaChainContext, dto: ChainCallDTO) {
  // example quick implementation fee gate
  // no need to write FeeCodeDefinitions or lookup FeeCodeDefinition objects to calc amount
  // tradeoff is its not flexible to update or modify, and won't record usage
  const hardcodedPromotionalFee = new BigNumber("1");

  await payFeeImmediatelyFromBalance(ctx, {
    feeCode: FeeGateCodes.SimpleFee,
    quantity: hardcodedPromotionalFee
  });
}

export interface IMintPreProcessing {
  tokenClass: TokenClassKey;
  owner: UserAlias;
  quantity: BigNumber;
  feeCode?: FeeGateCodes | undefined;
}

export async function mintPreProcessing(ctx: GalaChainContext, data: IMintPreProcessing) {
  const { tokenClass } = data;
  const { collection, category, type, additionalKey } = tokenClass;

  const mintConfiguration: TokenMintConfiguration | undefined = await fetchTokenMintConfiguration(ctx, {
    collection,
    category,
    type,
    additionalKey
  });

  if (!mintConfiguration) {
    return;
  }

  if (mintConfiguration.preMintBurn !== undefined) {
    await burnToMintProcessing(ctx, {
      ...data,
      burnConfiguration: mintConfiguration.preMintBurn,
      tokens: []
    });
  }
}

export interface ICombinedMintFees {
  feeCode: FeeGateCodes;
  tokenClass: TokenClassKey;
  quantity: BigNumber;
  owner: UserAlias;
}

export async function combinedMintFees(ctx: GalaChainContext, data: ICombinedMintFees): Promise<void> {
  const paymentErrors: PaymentRequiredError[] = [];

  await mintPreProcessing(ctx, data).catch((e) => {
    if (e instanceof ChainError && e.code === ErrorCode.PAYMENT_REQUIRED) {
      paymentErrors.push(e);
    } else {
      throw e;
    }
  });

  const { collection, category, type, additionalKey } = data.tokenClass;
  const mintConfiguration: TokenMintConfiguration | undefined = await fetchTokenMintConfiguration(ctx, {
    collection,
    category,
    type,
    additionalKey
  });

  const additionalFeeInGala: BigNumber | undefined = mintConfiguration?.additionalFee?.flatFee;

  await galaFeeGate(ctx, {
    feeCode: data.feeCode,
    // v1 fees requires only callingUser identities pay fees
    // uncomment below to require benefiting / initiating user to pay,
    // regardless of who executes the method
    // activeUser: dto.owner ?? ctx.callingUser,
    additionalFee: additionalFeeInGala
  }).catch((e) => {
    if (e instanceof ChainError && e.code === ErrorCode.PAYMENT_REQUIRED) {
      paymentErrors.push(e);
    } else {
      throw e;
    }
  });

  if (paymentErrors.length > 0) {
    throw new PaymentRequiredError(`Payment required: ${paymentErrors.length} fee payments to resolve`, {
      payments: paymentErrors
    });
  }
}
