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
  AuthorizeBatchSubmitterDto,
  BatchDto,
  BatchSubmitAuthoritiesResDto,
  ChainCallDTO,
  ConfigureLaunchpadFeeAddressDto,
  CreateSaleResDto,
  CreateTokenSaleDTO,
  DeauthorizeBatchSubmitterDto,
  ExactTokenQuantityDto,
  FetchBatchSubmitAuthoritiesDto,
  FetchSaleDto,
  FinalizeTokenAllocationDto,
  GalaChainResponse,
  LaunchpadFeeConfig,
  LaunchpadFinalizeFeeAllocation,
  LaunchpadSale,
  NativeTokenQuantityDto,
  PreMintCalculationDto,
  TradeCalculationResDto,
  TradeResDto,
  UnauthorizedError
} from "@gala-chain/api";

import { version } from "../../package.json";
import {
  buyExactTokenFeeGate,
  buyWithNativeFeeGate,
  createSaleFeeGate,
  sellExactTokenFeeGate,
  sellWithNativeFeeGate
} from "../fees/dexLaunchpadFeeGate";
import {
  authorizeLaunchpadBatchSubmitter,
  buyExactToken,
  buyWithNative,
  calculatePreMintTokens,
  callMemeTokenIn,
  callMemeTokenOut,
  callNativeTokenIn,
  callNativeTokenOut,
  configureLaunchpadFeeAddress,
  createSale,
  deauthorizeLaunchpadBatchSubmitter,
  fetchLaunchpadBatchSubmitAuthorities,
  fetchLaunchpadFeeConfig,
  fetchSaleDetails,
  finalizeTokenAllocation,
  getLaunchpadBatchSubmitAuthorities,
  sellExactToken,
  sellWithNative
} from "../launchpad";
import { GalaChainContext } from "../types";
import { BatchWriteLimitExceededError, GalaContract } from "./GalaContract";
import { getApiMethod } from "./GalaContractApi";
import { EVALUATE, Evaluate, GalaTransaction, SUBMIT, Submit } from "./GalaTransaction";

export class LaunchpadContract extends GalaContract {
  constructor() {
    super("Launchpad", version);
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
    const batchAuthorities = await fetchLaunchpadBatchSubmitAuthorities(ctx);
    if (!batchAuthorities.isAuthorized(ctx.callingUser)) {
      throw new UnauthorizedError(
        `CallingUser ${ctx.callingUser} is not authorized to submit batches. ` +
          `Authorized users: ${batchAuthorities.getAuthorities().join(", ")}`
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
    in: CreateTokenSaleDTO,
    out: CreateSaleResDto,
    before: createSaleFeeGate
  })
  public async CreateSale(ctx: GalaChainContext, dto: CreateTokenSaleDTO): Promise<CreateSaleResDto> {
    return createSale(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchSaleDto,
    out: LaunchpadSale
  })
  public async FetchSaleDetails(ctx: GalaChainContext, dto: FetchSaleDto): Promise<LaunchpadSale> {
    return fetchSaleDetails(ctx, dto);
  }

  @Submit({
    in: ExactTokenQuantityDto,
    out: TradeResDto,
    before: buyExactTokenFeeGate
  })
  public async BuyExactToken(ctx: GalaChainContext, dto: ExactTokenQuantityDto): Promise<TradeResDto> {
    return buyExactToken(ctx, dto);
  }

  @Submit({
    in: ExactTokenQuantityDto,
    out: TradeResDto,
    before: sellExactTokenFeeGate
  })
  public async SellExactToken(ctx: GalaChainContext, dto: ExactTokenQuantityDto): Promise<TradeResDto> {
    return sellExactToken(ctx, dto);
  }

  @Submit({
    in: NativeTokenQuantityDto,
    out: TradeResDto,
    before: buyWithNativeFeeGate
  })
  public async BuyWithNative(ctx: GalaChainContext, dto: NativeTokenQuantityDto): Promise<TradeResDto> {
    return buyWithNative(ctx, dto);
  }

  @Submit({
    in: NativeTokenQuantityDto,
    out: TradeResDto,
    before: sellWithNativeFeeGate
  })
  public async SellWithNative(ctx: GalaChainContext, dto: NativeTokenQuantityDto): Promise<TradeResDto> {
    return sellWithNative(ctx, dto);
  }

  @Submit({
    in: ConfigureLaunchpadFeeAddressDto,
    out: LaunchpadFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async ConfigureLaunchpadFeeAddress(
    ctx: GalaChainContext,
    dto: ConfigureLaunchpadFeeAddressDto
  ): Promise<LaunchpadFeeConfig> {
    return configureLaunchpadFeeAddress(ctx, dto);
  }

  @Submit({
    in: FinalizeTokenAllocationDto,
    out: LaunchpadFinalizeFeeAllocation,
    allowedOrgs: ["CuratorOrg"]
  })
  public async FinalizeTokenAllocation(
    ctx: GalaChainContext,
    dto: FinalizeTokenAllocationDto
  ): Promise<LaunchpadFinalizeFeeAllocation> {
    return finalizeTokenAllocation(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExactTokenQuantityDto,
    out: TradeCalculationResDto
  })
  public async CallNativeTokenIn(
    ctx: GalaChainContext,
    dto: ExactTokenQuantityDto
  ): Promise<TradeCalculationResDto> {
    return callNativeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NativeTokenQuantityDto,
    out: TradeCalculationResDto
  })
  public async CallMemeTokenOut(
    ctx: GalaChainContext,
    dto: NativeTokenQuantityDto
  ): Promise<TradeCalculationResDto> {
    return callMemeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExactTokenQuantityDto,
    out: TradeCalculationResDto
  })
  public async CallNativeTokenOut(
    ctx: GalaChainContext,
    dto: ExactTokenQuantityDto
  ): Promise<TradeCalculationResDto> {
    return callNativeTokenOut(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NativeTokenQuantityDto,
    out: TradeCalculationResDto
  })
  public async CallMemeTokenIn(
    ctx: GalaChainContext,
    dto: NativeTokenQuantityDto
  ): Promise<TradeCalculationResDto> {
    return callMemeTokenIn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: PreMintCalculationDto,
    out: String
  })
  public async CalculatePreMintTokens(ctx: GalaChainContext, dto: PreMintCalculationDto): Promise<string> {
    return calculatePreMintTokens(dto);
  }

  @Evaluate({
    in: ChainCallDTO,
    out: LaunchpadFeeConfig,
    allowedOrgs: ["CuratorOrg"]
  })
  public async FetchLaunchpadFeeConfig(
    ctx: GalaChainContext,
    dto: ChainCallDTO
  ): Promise<LaunchpadFeeConfig> {
    return fetchLaunchpadFeeConfig(ctx);
  }

  @Submit({
    in: AuthorizeBatchSubmitterDto,
    out: BatchSubmitAuthoritiesResDto,
    allowedOrgs: [process.env.CURATOR_ORG_MSP ?? "CuratorOrg"]
  })
  public async AuthorizeBatchSubmitter(
    ctx: GalaChainContext,
    dto: AuthorizeBatchSubmitterDto
  ): Promise<BatchSubmitAuthoritiesResDto> {
    return await authorizeLaunchpadBatchSubmitter(ctx, dto);
  }

  @Submit({
    in: DeauthorizeBatchSubmitterDto,
    out: BatchSubmitAuthoritiesResDto,
    allowedOrgs: [process.env.CURATOR_ORG_MSP ?? "CuratorOrg"]
  })
  public async DeauthorizeBatchSubmitter(
    ctx: GalaChainContext,
    dto: DeauthorizeBatchSubmitterDto
  ): Promise<BatchSubmitAuthoritiesResDto> {
    return await deauthorizeLaunchpadBatchSubmitter(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: FetchBatchSubmitAuthoritiesDto,
    out: BatchSubmitAuthoritiesResDto
  })
  public async GetBatchSubmitAuthorities(
    ctx: GalaChainContext,
    dto: FetchBatchSubmitAuthoritiesDto
  ): Promise<BatchSubmitAuthoritiesResDto> {
    return await getLaunchpadBatchSubmitAuthorities(ctx, dto);
  }
}
