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
  FulfillMintDto,
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
  TokenAllowance,
  TokenBalance,
  TokenBurn,
  TokenClass,
  TokenClassKey,
  TokenInstanceKey,
  TransferTokenDto,
  UnlockTokenDto,
  UnlockTokensDto,
  UpdateTokenClassDto,
  UseTokenDto,
  generateResponseSchema,
  generateSchema
} from "@gala-chain/api";
import {
  EVALUATE,
  GalaChainContext,
  GalaContract,
  GalaTransaction,
  SUBMIT,
  batchMintToken,
  burnTokens,
  createTokenClass,
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
  fulfillMintRequest,
  fullAllowanceCheck,
  grantAllowance,
  lockToken,
  lockTokens,
  mintRequestsByTimeRange,
  mintToken,
  mintTokenWithAllowance,
  refreshAllowances,
  releaseToken,
  requestMint,
  transferToken,
  unlockToken,
  unlockTokens,
  updateTokenClass,
  useToken
} from "@gala-chain/chaincode";
import { plainToClass } from "class-transformer";
import { Info } from "fabric-contract-api";

import { version } from "../../package.json";

const curatorOrgMsp = process.env.CURATOR_ORG_MSP ?? "CuratorOrg";

@Info({ title: "GalaChainToken", description: "Contract for managing GalaChain tokens" })
export default class GalaChainTokenContract extends GalaContract {
  constructor() {
    super("GalaChainToken", version);
  }
  @GalaTransaction({
    type: SUBMIT,
    in: CreateTokenClassDto,
    out: TokenClassKey,
    allowedOrgs: [curatorOrgMsp],
    verifySignature: true
  })
  public CreateTokenClass(ctx: GalaChainContext, dto: CreateTokenClassDto): Promise<TokenClassKey> {
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
      authorities: dto.authorities ?? [ctx.callingUser]
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: UpdateTokenClassDto,
    out: TokenClassKey,
    allowedOrgs: [curatorOrgMsp],
    verifySignature: true
  })
  public UpdateTokenClass(ctx: GalaChainContext, dto: UpdateTokenClassDto): Promise<TokenClassKey> {
    return updateTokenClass(ctx, dto);
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

  @GalaTransaction({
    type: SUBMIT,
    in: GrantAllowanceDto,
    out: { arrayOf: TokenAllowance },
    verifySignature: true
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

  @GalaTransaction({
    type: SUBMIT,
    in: RefreshAllowancesDto,
    out: { arrayOf: TokenAllowance },
    verifySignature: true
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

  @GalaTransaction({
    type: SUBMIT,
    in: DeleteAllowancesDto,
    out: "number",
    verifySignature: true
  })
  public DeleteAllowances(ctx: GalaChainContext, dto: DeleteAllowancesDto): Promise<number> {
    return deleteAllowances(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchBalancesDto,
    out: { arrayOf: TokenBalance }
  })
  public FetchBalances(ctx: GalaChainContext, dto: FetchBalancesDto): Promise<TokenBalance[]> {
    return fetchBalances(ctx, { ...dto, owner: dto.owner ?? ctx.callingUser });
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchBalancesDto,
    out: { arrayOf: TokenBalance }
  })
  public FetchBalancesWithTokenMetadata(
    ctx: GalaChainContext,
    dto: FetchBalancesDto
  ): Promise<FetchBalancesWithTokenMetadataResponse> {
    return fetchBalancesWithTokenMetadata(ctx, { ...dto, owner: dto.owner ?? ctx.callingUser });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: HighThroughputMintTokenDto,
    out: FulfillMintDto,
    verifySignature: true
  })
  public async RequestMint(ctx: GalaChainContext, dto: HighThroughputMintTokenDto): Promise<FulfillMintDto> {
    return requestMint(ctx, dto, undefined);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: FulfillMintDto,
    out: { arrayOf: TokenInstanceKey },
    allowedOrgs: [curatorOrgMsp]
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
  @GalaTransaction({
    type: SUBMIT,
    in: HighThroughputMintTokenDto,
    out: { arrayOf: TokenInstanceKey },
    verifySignature: true,
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
   *
   * @decorator `@GalaTransaction(GalaTransactionOptions<MintTokenDto>)`
   */
  @GalaTransaction({
    type: SUBMIT,
    in: MintTokenDto,
    out: { arrayOf: TokenInstanceKey },
    verifySignature: true
  })
  public async MintToken(ctx: GalaChainContext, dto: MintTokenDto): Promise<TokenInstanceKey[]> {
    return mintToken(ctx, {
      tokenClassKey: dto.tokenClass,
      owner: dto.owner ?? ctx.callingUser,
      quantity: dto.quantity,
      authorizedOnBehalf: undefined,
      applicableAllowanceKey: dto.allowanceKey
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: MintTokenWithAllowanceDto,
    out: { arrayOf: TokenInstanceKey },
    verifySignature: true
  })
  public async MintTokenWithAllowance(
    ctx: GalaChainContext,
    dto: MintTokenWithAllowanceDto
  ): Promise<TokenInstanceKey[]> {
    return mintTokenWithAllowance(ctx, {
      tokenClassKey: dto.tokenClass,
      tokenInstance: dto.tokenInstance,
      owner: dto.owner ?? ctx.callingUser,
      quantity: dto.quantity
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: BatchMintTokenDto,
    out: { arrayOf: TokenInstanceKey },
    verifySignature: true
  })
  public async BatchMintToken(ctx: GalaChainContext, dto: BatchMintTokenDto): Promise<TokenInstanceKey[]> {
    const params = dto.mintDtos.map(async (d) => ({
      tokenClassKey: d.tokenClass,
      owner: d.owner ?? ctx.callingUser,
      quantity: d.quantity,
      authorizedOnBehalf: undefined
    }));
    return batchMintToken(ctx, await Promise.all(params));
  }

  @GalaTransaction({
    type: SUBMIT,
    in: UseTokenDto,
    out: TokenBalance,
    verifySignature: true
  })
  public async UseToken(ctx: GalaChainContext, dto: UseTokenDto): Promise<TokenBalance> {
    return useToken(ctx, {
      owner: dto.owner ?? ctx.callingUser,
      inUseBy: dto.inUseBy,
      tokenInstanceKey: dto.tokenInstance,
      quantity: dto.quantity,
      allowancesToUse: dto.useAllowances ?? [],
      authorizedOnBehalf: undefined
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: ReleaseTokenDto,
    out: TokenBalance,
    verifySignature: true
  })
  public ReleaseToken(ctx: GalaChainContext, dto: ReleaseTokenDto): Promise<TokenBalance> {
    return releaseToken(ctx, {
      tokenInstanceKey: dto.tokenInstance
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: LockTokenDto,
    out: TokenBalance,
    verifySignature: true
  })
  public LockToken(ctx: GalaChainContext, dto: LockTokenDto): Promise<TokenBalance> {
    return lockToken(ctx, {
      owner: dto.owner ?? ctx.callingUser,
      lockAuthority: dto.lockAuthority,
      tokenInstanceKey: dto.tokenInstance,
      quantity: dto.quantity,
      allowancesToUse: dto.useAllowances ?? [],
      name: undefined,
      expires: 0,
      verifyAuthorizedOnBehalf: async () => undefined
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: LockTokensDto,
    out: { arrayOf: TokenBalance },
    verifySignature: true
  })
  public LockTokens(ctx: GalaChainContext, dto: LockTokensDto): Promise<TokenBalance[]> {
    // const verifyAuthorizedOnBehalf = (c: TokenClassKey) => bridgeTypeUser(ctx, dto.lockAuthority, c);
    return lockTokens(ctx, {
      lockAuthority: dto.lockAuthority,
      tokenInstances: dto.tokenInstances,
      allowancesToUse: dto.useAllowances ?? [],
      name: dto.name,
      expires: dto.expires ?? 0,
      verifyAuthorizedOnBehalf: async () => undefined
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: UnlockTokenDto,
    out: TokenBalance,
    verifySignature: true
  })
  public async UnlockToken(ctx: GalaChainContext, dto: UnlockTokenDto): Promise<TokenBalance> {
    return unlockToken(ctx, {
      tokenInstanceKey: dto.tokenInstance,
      name: dto.lockedHoldName ?? undefined,
      quantity: dto.quantity
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: UnlockTokensDto,
    out: { arrayOf: TokenBalance },
    verifySignature: true
  })
  public async UnlockTokens(ctx: GalaChainContext, dto: UnlockTokensDto): Promise<TokenBalance[]> {
    const params = dto.tokenInstances.map(async (d) => ({
      tokenInstanceKey: d.tokenInstanceKey,
      quantity: d.quantity,
      owner: d.owner ?? ctx.callingUser,
      name: dto.name,
      forSwap: false
    }));
    return unlockTokens(ctx, await Promise.all(params));
  }

  @GalaTransaction({
    type: SUBMIT,
    in: TransferTokenDto,
    out: { arrayOf: TokenBalance },
    verifySignature: true
  })
  public async TransferToken(ctx: GalaChainContext, dto: TransferTokenDto): Promise<TokenBalance[]> {
    return transferToken(ctx, {
      from: dto.from ?? ctx.callingUser,
      to: dto.to,
      tokenInstanceKey: dto.tokenInstance,
      quantity: dto.quantity,
      allowancesToUse: dto.useAllowances ?? [],
      authorizedOnBehalf: undefined
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: BurnTokensDto,
    out: { arrayOf: TokenBurn },
    verifySignature: true
  })
  public BurnTokens(ctx: GalaChainContext, dto: BurnTokensDto): Promise<TokenBurn[]> {
    return burnTokens(ctx, {
      owner: dto.owner ?? ctx.callingUser,
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

  @GalaTransaction({
    type: SUBMIT,
    in: FeeCodeDefinitionDto,
    out: FeeCodeDefinition,
    verifySignature: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async DefineFeeSchedule(
    ctx: GalaChainContext,
    dto: FeeCodeDefinitionDto
  ): Promise<GalaChainResponse<FeeCodeDefinition>> {
    return GalaChainResponse.Wrap(defineFeeSchedule(ctx, dto));
  }

  @GalaTransaction({
    type: SUBMIT,
    in: FeeCodeSplitFormulaDto,
    out: FeeCodeSplitFormula,
    verifySignature: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async DefineFeeSplitFormula(
    ctx: GalaChainContext,
    dto: FeeCodeSplitFormulaDto
  ): Promise<GalaChainResponse<FeeCodeSplitFormula>> {
    return GalaChainResponse.Wrap(defineFeeSplitFormula(ctx, dto));
  }

  @GalaTransaction({
    type: SUBMIT,
    in: FeeVerificationDto,
    out: FeeAuthorizationResDto,
    verifySignature: true,
    allowedOrgs: ["CuratorOrg"],
    enforceUniqueKey: true
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
}
