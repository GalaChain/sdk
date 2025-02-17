import {
  AddLiquidityDTO,
  BurnDto,
  CollectDTO,
  CreatePoolDto,
  ExpectedTokenDTO,
  GetPoolDto,
  GetPositionDto,
  GetUserPositionsDto,
  Pool,
  PositionDataDTO,
  QuoteExactAmountDto,
  Slot0Dto,
  SwapDto,
  UserBalanceResponseDto,
  UserPositionDTO
} from "@gala-chain/api";

import { version } from "../../package.json";
import {
  addLiquidity,
  burn,
  collect,
  createPool,
  getAddLiquidityEstimation,
  getPoolData,
  getRemoveLiquidityEstimation,
  getUserPositions,
  liquidity,
  positions,
  quoteExactAmount,
  slot0,
  swap
} from "../dex";
import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, GalaTransaction, Submit } from "./GalaTransaction";

export class DexV3Contract extends GalaContract {
  constructor() {
    super("DexV3Contract", version);
  }

  @Submit({
    in: CreatePoolDto
  })
  public async CreatePool(ctx: GalaChainContext, dto: CreatePoolDto) {
    await createPool(ctx, dto);
  }

  @Submit({
    in: AddLiquidityDTO,
    out: UserBalanceResponseDto
  })
  public async AddLiquidity(ctx: GalaChainContext, dto: AddLiquidityDTO) {
    return await addLiquidity(ctx, dto);
  }

  @Submit({
    in: SwapDto,
    out: UserBalanceResponseDto
  })
  public async Swap(ctx: GalaChainContext, dto: SwapDto) {
    return await swap(ctx, dto);
  }

  @Submit({
    in: BurnDto
  })
  public async RemoveLiquidity(ctx: GalaChainContext, dto: BurnDto) {
    return await burn(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: Slot0Dto
  })
  public async Slot0(ctx: GalaChainContext, dto: GetPoolDto) {
    return await slot0(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPoolDto,
    out: String
  })
  public async Liquidity(ctx: GalaChainContext, dto: GetPoolDto) {
    return await liquidity(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetPositionDto,
    out: PositionDataDTO
  })
  public async Positions(ctx: GalaChainContext, dto: GetPositionDto) {
    return await positions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetUserPositionsDto,
    out: UserPositionDTO
  })
  public async UserPositions(ctx: GalaChainContext, dto: GetUserPositionsDto) {
    return await getUserPositions(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: ExpectedTokenDTO,
    out: Array<String>
  })
  public async AddLiquidityEstimation(ctx: GalaChainContext, dto: ExpectedTokenDTO) {
    return await getAddLiquidityEstimation(ctx, dto);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: QuoteExactAmountDto,
    out: Array<String>
  })
  public async QuoteExactAmount(ctx: GalaChainContext, dto: QuoteExactAmountDto) {
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
        throw new Error("Pool data not found");
      })()
    );
  }

  @GalaTransaction({
    type: EVALUATE,
    in: BurnDto
  })
  public async RemoveLiquidityEstimation(ctx: GalaChainContext, dto: BurnDto) {
    return await getRemoveLiquidityEstimation(ctx, dto);
  }

  @Submit({
    in: CollectDTO
  })
  public async CollectFees(ctx: GalaChainContext, dto: CollectDTO) {
    return await collect(ctx, dto);
  }
}
