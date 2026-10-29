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
  GrantNftCollectionAuthorizationDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  OracleBridgeFeeAssertion,
  OracleBridgeFeeAssertionDto,
  OracleDefinition,
  OraclePriceAssertion,
  OraclePriceCrossRateAssertion,
  PaymentRequiredError,
  RequestTokenBridgeOutDto,
  SetTokenInstanceMetadataDto,
  TerminateTokenSwapDto,
  TokenClassKey,
  TokenInstance,
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
import { getObjectByKey, getObjectsByPartialCompositeKey, putChainObject } from "../utils";
import { burnToMintProcessing } from "./extendedFeeGateProcessing";
import { galaFeeGate, writeUsageAndCalculateFeeAmount } from "./galaFeeGate";
import { payFeeFromCrossChannelAuthorization } from "./payFeeFromCrossChannelAuthorization";
import { payFeeImmediatelyFromBalance } from "./payFeeImmediatelyFromBalance";

const assertionExpirationLimit: number = process?.env?.ORACLE_ASSERTION_EXPIRATION
  ? isFinite(parseInt(process?.env?.ORACLE_ASSERTION_EXPIRATION, 10))
    ? parseInt(process?.env?.ORACLE_ASSERTION_EXPIRATION)
    : 15 * 60 * 1000
  : 15 * 60 * 1000;

export async function batchFillTokenSwapFeeGate(ctx: GalaChainContext, dto: BatchFillTokenSwapDto) {
  return galaFeeGate(ctx, { feeCode: FeeGateCodes.BatchFillTokenSwap });
}

export async function batchMintTokenFeeGate(ctx: GalaChainContext, dto: BatchMintTokenDto) {
  const feeCode = FeeGateCodes.BatchMintToken;
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

export function assertOracleQuoteMatchesTransfer(
  quote: OracleBridgeFeeAssertionDto,
  transfer: { destinationChainId: number; tokenInstance: TokenInstanceKey }
): void {
  const quoted = quote.bridgeToken;
  const requested = transfer.tokenInstance;
  const sameClass =
    quoted.collection === requested.collection &&
    quoted.category === requested.category &&
    quoted.type === requested.type &&
    quoted.additionalKey === requested.additionalKey;

  if (!sameClass) {
    throw new ValidationFailedError("Oracle quote is for a different token");
  }

  const requestedIsNonFungible = !TokenInstance.isFungible(requested.instance);
  if (quote.bridgeTokenIsNonFungible !== requestedIsNonFungible) {
    throw new ValidationFailedError("Oracle quote does not match whether the token is non-fungible");
  }

  if (quote.destinationChainId !== transfer.destinationChainId) {
    throw new ValidationFailedError("Oracle quote is for a different destination chain");
  }
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
  } else if (oracleDefinitionLookup instanceof Error) {
    throw oracleDefinitionLookup;
  }

  const oracleDefinition: OracleDefinition = oracleDefinitionLookup;

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

  // The recovered signer must be a listed authority, and signingIdentity must be that signer's alias or eth address.
  const claimedIdentity = oracleAssertion.signingIdentity;
  const signerIds = [identity.alias, identity.ethAddress].filter((id): id is string => !!id);
  const signerIsAuthority = signerIds.some((id) => oracleDefinition.authorities.includes(id));
  const claimMatchesSigner = signerIds.includes(claimedIdentity);

  if (!signerIsAuthority || !claimMatchesSigner) {
    throw new UnauthorizedError(
      `BridgeTokenOut to destination chain ${destinationChainId} requires an assertion signed ` +
        `by a Bridge oracle authority, with signingIdentity matching the signer. ` +
        `Signer alias: ${identity.alias}, ethAddress: ${identity.ethAddress}, ` +
        `claimed signingIdentity: ${claimedIdentity}. ` +
        `Authorities: ${oracleDefinition.authorities.join(", ")}`
    );
  }

  assertOracleQuoteMatchesTransfer(oracleAssertion, dto);

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
    timestamp
  } = oracleAssertion;

  const txid = ctx.stub.getTxID();

  const bridgeFeeAssertionRecord = plainToInstance(OracleBridgeFeeAssertion, {
    oracle: KnownOracles.Bridge,
    signingIdentity: identity.alias,
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

export async function setTokenInstanceMetadataFeeGate(
  ctx: GalaChainContext,
  dto: SetTokenInstanceMetadataDto
) {
  const feeCode = FeeGateCodes.SetTokenInstanceMetadata;
  const entryCount = (dto.attributes?.length ?? 0) + (dto.customFields?.length ?? 0);

  // the fee scales with document size: each attribute and custom field adds one base fee
  // unit on top of the standard per-use charge, so total = tierFee + baseQuantity * entryCount.
  // The base unit is the lowest-threshold FeeCodeDefinition's baseQuantity, leaving
  // threshold-based acceleration to apply to the per-use portion only.
  let additionalFee: BigNumber | undefined;

  if (entryCount > 0) {
    const feeCodeDefinitions = await getObjectsByPartialCompositeKey(
      ctx,
      FeeCodeDefinition.INDEX_KEY,
      [feeCode],
      FeeCodeDefinition
    );

    feeCodeDefinitions.sort((a: FeeCodeDefinition, b: FeeCodeDefinition) => {
      return a.feeThresholdUses.minus(b.feeThresholdUses).toNumber();
    });

    const baseQuantity: BigNumber | undefined = feeCodeDefinitions[0]?.baseQuantity;

    if (baseQuantity !== undefined) {
      additionalFee = baseQuantity.multipliedBy(entryCount);
    }
  }

  return galaFeeGate(ctx, { feeCode, additionalFee });
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
