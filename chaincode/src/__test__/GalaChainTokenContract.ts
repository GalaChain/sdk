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
  AllowanceType,
  BatchMintTokenDto,
  BurnTokensDto,
  CreateTokenClassDto,
  CreateTokenSaleDto,
  DeleteAllowancesDto,
  FeeAuthorizationResDto,
  FeeCodeDefinition,
  FeeCodeDefinitionDto,
  FeeCodeSplitFormula,
  FeeCodeSplitFormulaDto,
  FeeThresholdUses,
  FeeVerificationDto,
  FetchAllowancesDto,
  FetchAllowancesResponse,
  FetchBalancesDto,
  FetchBalancesWithTokenMetadataResponse,
  FetchBurnsDto,
  FetchFeeScheduleDto,
  FetchFeeScheduleResDto,
  FetchFeeThresholdUsesDto,
  FetchFeeThresholdUsesResDto,
  FetchFeeThresholdUsesWithPaginationDto,
  FetchFeeThresholdUsesWithPaginationResponse,
  FetchMintRequestsDto,
  FetchTokenClassesDto,
  FetchTokenClassesResponse,
  FetchTokenClassesWithPaginationDto,
  FetchTokenSaleByIdDto,
  FetchTokenSalesWithPaginationDto,
  FetchTokenSalesWithPaginationResponse,
  FulfillMintDto,
  FulfillTokenSaleDto,
  FullAllowanceCheckDto,
  FullAllowanceCheckResDto,
  GalaChainResponse,
  GrantAllowanceDto,
  HighThroughputMintTokenDto,
  LockTokenDto,
  LockTokensDto,
  MintRequestDto,
  MintTokenDto,
  MintTokenWithAllowanceDto,
  RefreshAllowancesDto,
  ReleaseTokenDto,
  RemoveTokenSaleDto,
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  TokenSale,
  TokenSaleFulfillment,
  TransferTokenDto,
  UnlockTokenDto,
  UnlockTokensDto,
  UpdateTokenClassDto,
  UseTokenDto,
  generateResponseSchema,
  generateSchema
} from "@gala-chain/api";
import { plainToClass } from "class-transformer";
import { Info } from "fabric-contract-api";

import {
  GalaChainContext,
  GalaContract,
  GalaTransaction,
  Submit,
  batchMintToken,
  burnTokens,
  createTokenClass,
  createTokenSale,
  creditFeeBalance,
  defineFeeSchedule,
  defineFeeSplitFormula,
  deleteAllowances,
  fetchAllowancesWithPagination,
  fetchBalances,
  fetchBalancesWithTokenMetadata,
  fetchBurns,
  fetchFeeSchedule,
  fetchFeeThresholdUses,
  fetchFeeThresholdUsesWithPagination,
  fetchTokenClasses,
  fetchTokenClassesWithPagination,
  fetchTokenSaleById,
  fetchTokenSalesWithPagination,
  fulfillMintRequest,
  fulfillTokenSale,
  fullAllowanceCheck,
  grantAllowance,
  lockToken,
  lockTokens,
  mintRequestsByTimeRange,
  mintToken,
  mintTokenWithAllowance,
  refreshAllowances,
  releaseToken,
  removeTokenSale,
  requestMint,
  resolveUserAlias,
  transferToken,
  unlockToken,
  unlockTokens,
  updateTokenClass,
  useToken
} from "../";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { version } from "../../package.json";
import { EVALUATE, SUBMIT } from "../contracts";

@Info({ title: "GalaChainToken", description: "Contract for managing GalaChain tokens" })
export default class GalaChainTokenContract extends GalaContract {
  constructor() {
    super("GalaChainToken", version);
  }

  @Submit({
    in: CreateTokenClassDto,
    out: TokenClassKey,
    allowedOrgs: ["CuratorOrg"]
  })
  public async CreateTokenClass(ctx: GalaChainContext, dto: CreateTokenClassDto): Promise<TokenClassKey> {
    return createTokenClass(ctx, {
      network: dto.network ?? CreateTokenClassDto.DEFAULT_NETWORK,
      tokenClass: dto.tokenClass,
      isNonFungible: !!dto.isNonFungible,
      decimals: dto.decimals ?? CreateTokenClassDto.DEFAULT_DECIMALS,
      name: dto.name,
      symbol: dto.symbol,
      description: dto.description,
      rarity: dto.rarity,
      image: dto.image,
      metadataAddress: dto.metadataAddress,
      contractAddress: dto.contractAddress,
      maxSupply: dto.maxSupply ?? CreateTokenClassDto.DEFAULT_MAX_SUPPLY,
      maxCapacity: dto.maxCapacity ?? CreateTokenClassDto.DEFAULT_MAX_CAPACITY,
      totalMintAllowance: dto.totalMintAllowance ?? CreateTokenClassDto.INITIAL_MINT_ALLOWANCE,
      totalSupply: dto.totalSupply ?? CreateTokenClassDto.INITIAL_TOTAL_SUPPLY,
      totalBurned: dto.totalBurned ?? CreateTokenClassDto.INITIAL_TOTAL_BURNED,
      authorities: await Promise.all(
        (dto.authorities ?? [ctx.callingUser]).map((a) => resolveUserAlias(ctx, a))
      )
    });
  }

  @Submit({
    in: UpdateTokenClassDto,
    out: TokenClassKey,
    allowedOrgs: ["CuratorOrg"]
  })
  public async UpdateTokenClass(ctx: GalaChainContext, dto: UpdateTokenClassDto): Promise<TokenClassKey> {
    const authorities = dto.authorities
      ? await Promise.all(dto.authorities.map((a) => resolveUserAlias(ctx, a)))
      : undefined;
    return updateTokenClass(ctx, { ...dto, authorities });
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchTokenClassesDto,
    out: { arrayOf: TokenClass }
  })
  public FetchTokenClasses(ctx: GalaChainContext, dto: FetchTokenClassesDto): Promise<TokenClass[]> {
    return fetchTokenClasses(ctx, dto.tokenClasses);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchTokenClassesWithPaginationDto,
    out: FetchTokenClassesResponse
  })
  public FetchTokenClassesWithPagination(
    ctx: GalaChainContext,
    dto: FetchTokenClassesWithPaginationDto
  ): Promise<FetchTokenClassesResponse> {
    return fetchTokenClassesWithPagination(ctx, dto);
  }

  @Submit({
    in: GrantAllowanceDto,
    out: { arrayOf: TokenAllowance }
  })
  public GrantAllowance(ctx: GalaChainContext, dto: GrantAllowanceDto): Promise<TokenAllowance[]> {
    return grantAllowance(ctx, {
      tokenInstance: dto.tokenInstance,
      allowanceType: dto.allowanceType,
      quantities: dto.quantities,
      uses: dto.uses,
      expires: dto.expires ?? GrantAllowanceDto.DEFAULT_EXPIRES
    });
  }

  @Submit({
    in: RefreshAllowancesDto,
    out: { arrayOf: TokenAllowance }
  })
  public RefreshAllowances(ctx: GalaChainContext, dto: RefreshAllowancesDto): Promise<TokenAllowance[]> {
    return refreshAllowances(ctx, dto.allowances);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FullAllowanceCheckDto,
    out: FullAllowanceCheckResDto
  })
  public FullAllowanceCheck(
    ctx: GalaChainContext,
    dto: FullAllowanceCheckDto
  ): Promise<FullAllowanceCheckResDto> {
    return fullAllowanceCheck(ctx, {
      owner: dto.owner ?? ctx.callingUser,
      grantedTo: dto.grantedTo ?? ctx.callingUser,
      allowanceType: dto.allowanceType ?? AllowanceType.Use,
      collection: dto.collection,
      category: dto.category,
      type: dto.type,
      additionalKey: dto.additionalKey
    });
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchAllowancesDto,
    out: FetchAllowancesResponse
  })
  public FetchAllowances(ctx: GalaChainContext, dto: FetchAllowancesDto): Promise<FetchAllowancesResponse> {
    return fetchAllowancesWithPagination(ctx, {
      ...dto,
      limit: dto.limit ?? FetchAllowancesDto.DEFAULT_LIMIT
    });
  }

  @Submit({
    in: DeleteAllowancesDto,
    out: "number"
  })
  public DeleteAllowances(ctx: GalaChainContext, dto: DeleteAllowancesDto): Promise<number> {
    return deleteAllowances(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchBalancesDto,
    out: { arrayOf: TokenBalance }
  })
  public async FetchBalances(ctx: GalaChainContext, dto: FetchBalancesDto): Promise<TokenBalance[]> {
    return fetchBalances(ctx, { ...dto, owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser) });
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchBalancesDto,
    out: { arrayOf: TokenBalance }
  })
  public async FetchBalancesWithTokenMetadata(
    ctx: GalaChainContext,
    dto: FetchBalancesDto
  ): Promise<FetchBalancesWithTokenMetadataResponse> {
    return fetchBalancesWithTokenMetadata(ctx, {
      ...dto,
      owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser)
    });
  }

  @Submit({
    in: HighThroughputMintTokenDto,
    out: FulfillMintDto
  })
  public async RequestMint(ctx: GalaChainContext, dto: HighThroughputMintTokenDto): Promise<FulfillMintDto> {
    return requestMint(ctx, {
      tokenClass: dto.tokenClass,
      owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser),
      quantity: dto.quantity,
      allowanceKey: dto.allowanceKey,
      authorizedOnBehalf: undefined
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: FulfillMintDto,
    out: { arrayOf: TokenInstanceKey },
    allowedOrgs: ["CuratorOrg"],
    enforceUniqueKey: true
    // no signature verification
  })
  public async FulfillMint(ctx: GalaChainContext, dto: FulfillMintDto): Promise<TokenInstanceKey[]> {
    return fulfillMintRequest(ctx, dto);
  }

  /**
   * Mint a new instance of an existing TokenClass. High-throughput implementation.
   *
   * @experimental 2023-03-23
   *
   * @decorator `@GalaTransaction(GalaTransactionOptions<HighThroughputMintTokenDto>)`
   */
  @Submit({
    in: HighThroughputMintTokenDto,
    out: { arrayOf: TokenInstanceKey },
    sequence: [
      {
        methodName: "RequestMint",
        isWrite: true,
        dtoSchema: generateSchema(HighThroughputMintTokenDto),
        responseSchema: generateResponseSchema(FulfillMintDto)
      },
      {
        methodName: "FulfillMint",
        isWrite: true,
        dtoSchema: generateSchema(FulfillMintDto),
        responseSchema: generateResponseSchema(TokenInstanceKey, "array")
      }
    ]
  })
  public async HighThroughputMint(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: GalaChainContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dto: HighThroughputMintTokenDto
  ): Promise<TokenInstanceKey[]> {
    return Promise.reject(
      new Error(`HighThroughputMint is a sequence call: Execute RequestMint and FulfillMint sequentially.`)
    );
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchMintRequestsDto,
    out: { arrayOf: MintRequestDto }
  })
  public async FetchMintRequests(
    ctx: GalaChainContext,
    dto: FetchMintRequestsDto
  ): Promise<MintRequestDto[]> {
    const mintRequestsClassKey = plainToClass(TokenClassKey, {
      collection: dto.collection,
      category: dto.category,
      type: dto.type,
      additionalKey: dto.additionalKey
    });

    return mintRequestsByTimeRange(ctx, mintRequestsClassKey, dto.startTimestamp, dto.endTimestamp);
  }

  /**
   * Mint a new instance of an existing TokenClass.
   *
   * @deprecated 2022-12-12, replaced with high-throughput implementation.
   */
  @Submit({
    in: MintTokenDto,
    out: { arrayOf: TokenInstanceKey }
  })
  public async MintToken(ctx: GalaChainContext, dto: MintTokenDto): Promise<TokenInstanceKey[]> {
    return mintToken(ctx, {
      tokenClassKey: dto.tokenClass,
      owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser),
      quantity: dto.quantity,
      authorizedOnBehalf: undefined,
      applicableAllowanceKey: dto.allowanceKey
    });
  }

  @Submit({
    in: MintTokenWithAllowanceDto,
    out: { arrayOf: TokenInstanceKey }
  })
  public async MintTokenWithAllowance(
    ctx: GalaChainContext,
    dto: MintTokenWithAllowanceDto
  ): Promise<TokenInstanceKey[]> {
    return mintTokenWithAllowance(ctx, {
      tokenClassKey: dto.tokenClass,
      tokenInstance: dto.tokenInstance,
      owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser),
      quantity: dto.quantity
    });
  }

  @Submit({
    in: BatchMintTokenDto,
    out: { arrayOf: TokenInstanceKey }
  })
  public async BatchMintToken(ctx: GalaChainContext, dto: BatchMintTokenDto): Promise<TokenInstanceKey[]> {
    const params = dto.mintDtos.map(async (d) => ({
      tokenClassKey: d.tokenClass,
      owner: await resolveUserAlias(ctx, d.owner ?? ctx.callingUser),
      quantity: d.quantity,
      authorizedOnBehalf: undefined
    }));
    return batchMintToken(ctx, await Promise.all(params));
  }

  @Submit({
    in: UseTokenDto,
    out: TokenBalance
  })
  public async UseToken(ctx: GalaChainContext, dto: UseTokenDto): Promise<TokenBalance> {
    return useToken(ctx, {
      owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser),
      inUseBy: await resolveUserAlias(ctx, dto.inUseBy),
      tokenInstanceKey: dto.tokenInstance,
      quantity: dto.quantity,
      allowancesToUse: dto.useAllowances ?? [],
      authorizedOnBehalf: undefined
    });
  }

  @Submit({
    in: ReleaseTokenDto,
    out: TokenBalance
  })
  public ReleaseToken(ctx: GalaChainContext, dto: ReleaseTokenDto): Promise<TokenBalance> {
    return releaseToken(ctx, {
      tokenInstanceKey: dto.tokenInstance
    });
  }

  @Submit({
    in: LockTokenDto,
    out: TokenBalance
  })
  public async LockToken(ctx: GalaChainContext, dto: LockTokenDto): Promise<TokenBalance> {
    return lockToken(ctx, {
      owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser),
      lockAuthority: dto.lockAuthority ? await resolveUserAlias(ctx, dto.lockAuthority) : undefined,
      tokenInstanceKey: dto.tokenInstance,
      quantity: dto.quantity,
      allowancesToUse: dto.useAllowances ?? [],
      name: undefined,
      expires: 0,
      verifyAuthorizedOnBehalf: async () => undefined
    });
  }

  @Submit({
    in: LockTokensDto,
    out: { arrayOf: TokenBalance }
  })
  public async LockTokens(ctx: GalaChainContext, dto: LockTokensDto): Promise<TokenBalance[]> {
    const lockAuthority = dto.lockAuthority ? await resolveUserAlias(ctx, dto.lockAuthority) : undefined;
    const tokenInstances = dto.tokenInstances.map(async (d) => ({
      tokenInstanceKey: d.tokenInstanceKey,
      quantity: d.quantity,
      owner: d.owner ? await resolveUserAlias(ctx, d.owner) : undefined
    }));
    return lockTokens(ctx, {
      lockAuthority,
      tokenInstances: await Promise.all(tokenInstances),
      allowancesToUse: dto.useAllowances ?? [],
      name: dto.name,
      expires: dto.expires ?? 0,
      verifyAuthorizedOnBehalf: async () => undefined
    });
  }

  @Submit({
    in: UnlockTokenDto,
    out: TokenBalance
  })
  public async UnlockToken(ctx: GalaChainContext, dto: UnlockTokenDto): Promise<TokenBalance> {
    return unlockToken(ctx, {
      tokenInstanceKey: dto.tokenInstance,
      name: dto.lockedHoldName ?? undefined,
      quantity: dto.quantity,
      owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser)
    });
  }

  @Submit({
    in: UnlockTokensDto,
    out: { arrayOf: TokenBalance }
  })
  public async UnlockTokens(ctx: GalaChainContext, dto: UnlockTokensDto): Promise<TokenBalance[]> {
    const params = dto.tokenInstances.map(async (d) => ({
      tokenInstanceKey: d.tokenInstanceKey,
      quantity: d.quantity,
      owner: d.owner ? await resolveUserAlias(ctx, d.owner) : ctx.callingUser,
      name: dto.name,
      forSwap: false
    }));
    return unlockTokens(ctx, await Promise.all(params));
  }

  @Submit({
    in: TransferTokenDto,
    out: { arrayOf: TokenBalance }
  })
  public async TransferToken(ctx: GalaChainContext, dto: TransferTokenDto): Promise<TokenBalance[]> {
    return transferToken(ctx, {
      from: await resolveUserAlias(ctx, dto.from ?? ctx.callingUser),
      to: await resolveUserAlias(ctx, dto.to),
      tokenInstanceKey: dto.tokenInstance,
      quantity: dto.quantity,
      allowancesToUse: dto.useAllowances ?? [],
      authorizedOnBehalf: undefined
    });
  }

  @Submit({
    in: BurnTokensDto,
    out: { arrayOf: TokenBurn }
  })
  public async BurnTokens(ctx: GalaChainContext, dto: BurnTokensDto): Promise<TokenBurn[]> {
    return burnTokens(ctx, {
      owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser),
      toBurn: dto.tokenInstances
    });
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchBurnsDto,
    out: { arrayOf: TokenBurn }
  })
  public FetchBurns(ctx: GalaChainContext, dto: FetchBurnsDto): Promise<TokenBurn[]> {
    return fetchBurns(ctx, dto);
  }

  @Submit({
    in: FeeCodeDefinitionDto,
    out: FeeCodeDefinition,
    allowedOrgs: ["CuratorOrg"]
  })
  public async DefineFeeSchedule(
    ctx: GalaChainContext,
    dto: FeeCodeDefinitionDto
  ): Promise<GalaChainResponse<FeeCodeDefinition>> {
    return GalaChainResponse.Wrap(defineFeeSchedule(ctx, dto));
  }

  @Submit({
    in: FeeCodeSplitFormulaDto,
    out: FeeCodeSplitFormula,
    allowedOrgs: ["CuratorOrg"]
  })
  public async DefineFeeSplitFormula(
    ctx: GalaChainContext,
    dto: FeeCodeSplitFormulaDto
  ): Promise<GalaChainResponse<FeeCodeSplitFormula>> {
    return GalaChainResponse.Wrap(defineFeeSplitFormula(ctx, dto));
  }

  @Submit({
    in: FeeVerificationDto,
    out: FeeAuthorizationResDto,
    allowedOrgs: ["CuratorOrg"]
  })
  public async CreditFeeBalance(
    ctx: GalaChainContext,
    dto: FeeVerificationDto
  ): Promise<GalaChainResponse<FeeAuthorizationResDto>> {
    return GalaChainResponse.Wrap(creditFeeBalance(ctx, dto));
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchFeeScheduleDto,
    out: FetchFeeScheduleResDto
  })
  public async FetchFeeSchedule(
    ctx: GalaChainContext,
    dto: FetchFeeScheduleDto
  ): Promise<GalaChainResponse<FetchFeeScheduleResDto>> {
    return GalaChainResponse.Wrap(fetchFeeSchedule(ctx, dto));
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchFeeThresholdUsesDto,
    out: FeeThresholdUses
  })
  public async FetchFeeThresholdUses(
    ctx: GalaChainContext,
    dto: FetchFeeThresholdUsesDto
  ): Promise<GalaChainResponse<FetchFeeThresholdUsesResDto>> {
    return GalaChainResponse.Wrap(
      fetchFeeThresholdUses(ctx, {
        feeCode: dto.feeCode,
        user: dto.user ?? ctx.callingUser
      })
    );
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchFeeThresholdUsesWithPaginationDto,
    out: FetchFeeThresholdUsesWithPaginationResponse
  })
  public async FetchFeeThresholdUsesWithPagination(
    ctx: GalaChainContext,
    dto: FetchFeeThresholdUsesWithPaginationDto
  ): Promise<GalaChainResponse<FetchFeeThresholdUsesWithPaginationResponse>> {
    return GalaChainResponse.Wrap(
      fetchFeeThresholdUsesWithPagination(ctx, {
        feeCode: dto.feeCode,
        bookmark: dto.bookmark,
        limit: dto.limit
      })
    );
  }

  @GalaTransaction({
    type: SUBMIT,
    in: CreateTokenSaleDto,
    out: TokenSale,
    verifySignature: true,
    enforceUniqueKey: true
  })
  public async CreateTokenSale(
    ctx: GalaChainContext,
    dto: CreateTokenSaleDto
  ): Promise<GalaChainResponse<TokenSale>> {
    return GalaChainResponse.Wrap(createTokenSale(ctx, dto));
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchTokenSaleByIdDto,
    out: TokenSale
  })
  public async FetchTokenSaleById(
    ctx: GalaChainContext,
    dto: FetchTokenSaleByIdDto
  ): Promise<GalaChainResponse<TokenSale>> {
    return GalaChainResponse.Wrap(fetchTokenSaleById(ctx, dto.tokenSaleId));
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchTokenClassesWithPaginationDto,
    out: FetchTokenSalesWithPaginationResponse
  })
  public async FetchTokenSalesWithPagination(
    ctx: GalaChainContext,
    dto: FetchTokenSalesWithPaginationDto
  ): Promise<GalaChainResponse<FetchTokenSalesWithPaginationResponse>> {
    return GalaChainResponse.Wrap(fetchTokenSalesWithPagination(ctx, dto));
  }

  @GalaTransaction({
    type: SUBMIT,
    in: FulfillTokenSaleDto,
    out: TokenSaleFulfillment,
    verifySignature: true,
    enforceUniqueKey: true
  })
  public async FulfillTokenSale(
    ctx: GalaChainContext,
    dto: FulfillTokenSaleDto
  ): Promise<GalaChainResponse<TokenSaleFulfillment>> {
    return GalaChainResponse.Wrap(fulfillTokenSale(ctx, dto));
  }

  @GalaTransaction({
    type: SUBMIT,
    in: RemoveTokenSaleDto,
    out: TokenSale,
    allowedOrgs: ["CuratorOrg"],
    verifySignature: true
  })
  public async RemoveTokenSale(
    ctx: GalaChainContext,
    dto: RemoveTokenSaleDto
  ): Promise<GalaChainResponse<TokenSale>> {
    return GalaChainResponse.Wrap(removeTokenSale(ctx, dto.tokenSaleId));
  }
}
