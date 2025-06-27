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
  AddLiquidityDTO,
  AuthorizeBatchSubmitterDto,
  BatchDto,
  BatchSubmitAuthorizations,
  BatchSubmitAuthorizationsResDto,
  BurnDto,
  BurnEstimateDto,
  ChainCallDTO,
  CollectDto,
  CollectProtocolFeesDto,
  CollectProtocolFeesResDto,
  ConfigureDexFeeAddressDto,
  CreatePoolDto,
  CreatePoolResDto,
  DeauthorizeBatchSubmitterDto,
  DexFeeConfig,
  DexOperationResDto,
  DexPositionData,
  DexPositionOwner,
  FetchBatchSubmitAuthorizationsDto,
  GalaChainResponse,
  GetAddLiquidityEstimationDto,
  GetAddLiquidityEstimationResDto,
  GetLiquidityResDto,
  GetPoolDto,
  GetPositionByIdDto,
  GetPositionDto,
  GetRemoveLiqEstimationResDto,
  GetTickDataDto,
  GetUserPositionsDto,
  GetUserPositionsResDto,
  NotFoundError,
  Pool,
  QuoteExactAmountDto,
  QuoteExactAmountResDto,
  SetProtocolFeeDto,
  SetProtocolFeeResDto,
  Slot0ResDto,
  SwapDto,
  SwapResDto,
  TickData,
  TransferDexPositionDto,
  UnauthorizedError,
  ValidationFailedError
} from "@gala-chain/api";

import { version } from "../../package.json";
import {
  addLiquidity,
  burn,
  collect,
  collectProtocolFees,
  configureDexFeeAddress,
  createPool,
  getAddLiquidityEstimation,
  getDexFeesConfigration,
  getLiquidity,
  getPoolData,
  getPosition,
  getPositionById,
  getRemoveLiquidityEstimation,
  getSlot0,
  getUserPositions,
  quoteExactAmount,
  setProtocolFee,
  swap,
  transferDexPosition
} from "../dex";
import { getTickData } from "../dex/tickData.helper";
import {
  addLiquidityFeeGate,
  collectPositionFeesFeeGate,
  createPoolFeeGate,
  removeLiquidityFeeGate,
  swapFeeGate
} from "../fees/dexLaunchpadFeeGate";
import { GalaChainContext } from "../types";
import { GalaContract, BatchWriteLimitExceededError } from "./GalaContract";
import { getApiMethod } from "./GalaContractApi";
import { EVALUATE, SUBMIT, Evaluate, GalaTransaction, Submit } from "./GalaTransaction";
import { 
  fetchBatchSubmitAuthorizations,
  authorizeBatchSubmitter,
  deauthorizeBatchSubmitter,
  getBatchSubmitAuthorizations
} from "../dex/batchSubmitAuthorizations";

export class DexV3Contract extends GalaContract {
  constructor() {
    super("DexV3Contract", version);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: BatchDto,
    out: "object",
    description: "Submit a batch of transactions",
    allowedOrgs: [process.env.CURATOR_ORG_MSP ?? "CuratorOrg"],
    verifySignature: true
  })
  public async BatchSubmit(ctx: GalaChainContext, batchDto: BatchDto): Promise<GalaChainResponse<unknown>[]> {
    // Check if the calling user is authorized to submit batches
    const batchAuthorizations = await fetchBatchSubmitAuthorizations(ctx);
    if (!batchAuthorizations.isAuthorized(ctx.callingUser)) {
      throw new UnauthorizedError(
        `CallingUser ${ctx.callingUser} is not authorized to submit batches. ` +
        `Authorized users: ${batchAuthorizations.getAuthorizedAuthorities().join(", ")}`
      );
    }

    const responses: GalaChainResponse<unknown>[] = [];

    const softWritesLimit = batchDto.writesLimit ?? BatchDto.WRITES_DEFAULT_LIMIT;
    const writesLimit = Math.min(softWritesLimit, BatchDto.WRITES_HARD_LIMIT);
    let writesCount = ctx.stub.getWritesCount();

    for (const [index, op] of batchDto.operations.entries()) {
      // Use sandboxed context to avoid flushes of writes and deletes, and populate
      // the stub with current writes and deletes.
      const sandboxCtx = ctx.createReadOnlyContext(index);
      sandboxCtx.stub.setWrites(ctx.stub.getWrites());
      sandboxCtx.stub.setDeletes(ctx.stub.getDeletes());

      // Execute the operation. Collect both successful and failed responses.
      let response: GalaChainResponse<unknown>;
      try {
        if (writesCount >= writesLimit) {
          throw new BatchWriteLimitExceededError(writesLimit);
        }

        const method = getApiMethod(this, op.method, (m) => m.isWrite && m.methodName !== "BatchSubmit");
        response = await this[method.methodName](sandboxCtx, op.dto);
      } catch (error) {
        response = GalaChainResponse.Error(error);
      }
      responses.push(response);

      // Update the current context with the writes and deletes if the operation
      // is successful.
      if (GalaChainResponse.isSuccess(response)) {
        ctx.stub.setWrites(sandboxCtx.stub.getWrites());
        ctx.stub.setDeletes(sandboxCtx.stub.getDeletes());
        writesCount = ctx.stub.getWritesCount();
      }
    }
    return responses;
  }

  @Submit({
    in: CreatePoolDto,
    out: CreatePoolResDto,
    before: createPoolFeeGate
  })
  public async CreatePool(ctx: GalaChainContext, dto: CreatePoolDto): Promise<CreatePoolResDto> {
    return await createPool(ctx, dto);
  }

  @Submit({
    in: AddLiquidityDTO,
    out: DexOperationResDto,
    before: addLiquidityFeeGate
  })
  public async AddLiquidity(ctx: GalaChainContext, dto: AddLiquidityDTO): Promise<DexOperationResDto> {
    return await addLiquidity(ctx, dto);
  }

  @Submit({
    in: SwapDto,
    out: SwapResDto,
    before: swapFeeGate
  })
  public async Swap(ctx: GalaChainContext, dto: SwapDto): Promise<SwapResDto> {
    return await swap(ctx, dto);
  }

  @Submit({
    in: BurnDto,
    out: DexOperationResDto,
    before: removeLiquidityFeeGate
  })
  public async RemoveLiquidity(ctx: GalaChainContext, dto: BurnDto): Promise<DexOperationResDto> {
    return await burn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: Slot0ResDto
  })
  public async GetSlot0(ctx: GalaChainContext, dto: GetPoolDto): Promise<Slot0ResDto> {
    return await getSlot0(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: GetLiquidityResDto
  })
  public async GetLiquidity(ctx: GalaChainContext, dto: GetPoolDto): Promise<GetLiquidityResDto> {
    return await getLiquidity(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetUserPositionsDto,
    out: GetUserPositionsResDto
  })
  public async GetUserPositions(
    ctx: GalaChainContext,
    dto: GetUserPositionsDto
  ): Promise<GetUserPositionsResDto> {
    return await getUserPositions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetAddLiquidityEstimationDto,
    out: GetAddLiquidityEstimationResDto
  })
  public async GetAddLiquidityEstimation(
    ctx: GalaChainContext,
    dto: GetAddLiquidityEstimationDto
  ): Promise<GetAddLiquidityEstimationResDto> {
    return await getAddLiquidityEstimation(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: QuoteExactAmountDto,
    out: QuoteExactAmountResDto
  })
  public async QuoteExactAmount(
    ctx: GalaChainContext,
    dto: QuoteExactAmountDto
  ): Promise<QuoteExactAmountResDto> {
    return await quoteExactAmount(ctx, dto);
  }
  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: Pool
  })
  public async GetPoolData(ctx: GalaChainContext, dto: GetPoolDto): Promise<Pool> {
    return (
      (await getPoolData(ctx, dto)) ??
      (() => {
        throw new NotFoundError("Pool data not found");
      })()
    );
  }

  @GalaTransaction({
    type: EVALUATE,
    in: BurnEstimateDto,
    out: GetRemoveLiqEstimationResDto
  })
  public async GetRemoveLiquidityEstimation(
    ctx: GalaChainContext,
    dto: BurnEstimateDto
  ): Promise<GetRemoveLiqEstimationResDto> {
    return await getRemoveLiquidityEstimation(ctx, dto);
  }

  @Submit({
    in: CollectDto,
    out: DexOperationResDto,
    before: collectPositionFeesFeeGate
  })
  public async CollectPositionFees(ctx: GalaChainContext, dto: CollectDto): Promise<DexOperationResDto> {
    return await collect(ctx, dto);
  }

  @Submit({
    in: CollectProtocolFeesDto,
    out: CollectProtocolFeesResDto,
    allowedOrgs: ["CuratorOrg"]
  })
  public async CollectProtocolFees(
    ctx: GalaChainContext,
    dto: CollectProtocolFeesDto
  ): Promise<CollectProtocolFeesResDto> {
    return await collectProtocolFees(ctx, dto);
  }

  @Submit({
    in: SetProtocolFeeDto,
    out: SetProtocolFeeResDto,
    allowedOrgs: ["CuratorOrg"]
  })
  public async SetProtocolFee(ctx: GalaChainContext, dto: SetProtocolFeeDto): Promise<SetProtocolFeeResDto> {
    return await setProtocolFee(ctx, dto);
  }

  @Evaluate({
    in: ChainCallDTO,
    out: DexFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async GetDexFeeConfigration(ctx: GalaChainContext, dto: ChainCallDTO): Promise<DexFeeConfig> {
    return getDexFeesConfigration(ctx, dto);
  }

  @Submit({
    in: ConfigureDexFeeAddressDto,
    out: DexFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async ConfigureDexFeeAddress(
    ctx: GalaChainContext,
    dto: ConfigureDexFeeAddressDto
  ): Promise<DexFeeConfig> {
    return configureDexFeeAddress(ctx, dto);
  }

  @Submit({
    in: TransferDexPositionDto,
    out: DexPositionOwner
  })
  public async TransferDexPosition(
    ctx: GalaChainContext,
    dto: TransferDexPositionDto
  ): Promise<DexPositionOwner> {
    return transferDexPosition(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPositionDto,
    out: DexPositionData
  })
  public async GetPositions(ctx: GalaChainContext, dto: GetPositionDto): Promise<DexPositionData> {
    return await getPosition(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPositionByIdDto,
    out: DexPositionData
  })
  public async GetPositionByID(ctx: GalaChainContext, dto: GetPositionByIdDto): Promise<DexPositionData> {
    return getPositionById(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetTickDataDto,
    out: TickData
  })
  public async GetTickData(ctx: GalaChainContext, dto: GetTickDataDto): Promise<TickData> {
    return getTickData(ctx, dto);
  }

  @Submit({
    in: AuthorizeBatchSubmitterDto,
    out: BatchSubmitAuthorizationsResDto,
    allowedOrgs: [process.env.CURATOR_ORG_MSP ?? "CuratorOrg"]
  })
  public async AuthorizeBatchSubmitter(
    ctx: GalaChainContext,
    dto: AuthorizeBatchSubmitterDto
  ): Promise<BatchSubmitAuthorizationsResDto> {
    return await authorizeBatchSubmitter(ctx, dto);
  }

  @Submit({
    in: DeauthorizeBatchSubmitterDto,
    out: BatchSubmitAuthorizationsResDto,
    allowedOrgs: [process.env.CURATOR_ORG_MSP ?? "CuratorOrg"]
  })
  public async DeauthorizeBatchSubmitter(
    ctx: GalaChainContext,
    dto: DeauthorizeBatchSubmitterDto
  ): Promise<BatchSubmitAuthorizationsResDto> {
    return await deauthorizeBatchSubmitter(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchBatchSubmitAuthorizationsDto,
    out: BatchSubmitAuthorizationsResDto
  })
  public async GetBatchSubmitAuthorizations(
    ctx: GalaChainContext,
    dto: FetchBatchSubmitAuthorizationsDto
  ): Promise<BatchSubmitAuthorizationsResDto> {
    return await getBatchSubmitAuthorizations(ctx, dto);
  }
}
