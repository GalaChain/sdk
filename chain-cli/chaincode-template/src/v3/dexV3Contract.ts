import { EVALUATE, GalaChainContext, GalaContract, GalaTransaction, Submit } from "@gala-chain/chaincode";

import { version } from "../../package.json";
import { addLiquidity } from "./addLiquidity";
import { burn } from "./burn";
import { getRemoveLiquidityEstimation } from "./burnEstimate";
import { collect } from "./collect";
import { createPool } from "./createPool";
import {
  AddLiquidityDTO,
  BurnDto,
  CollectDTO,
  CreatePoolDto,
  ExpectedTokenDTO,
  GetPoolDto,
  GetPositionDto,
  GetUserPositionsDto,
  PositionDataDTO,
  QuoteExactAmountDto,
  Slot0Dto,
  SwapDto,
  UserBalanceResponseDto,
  UserPositionDTO
} from "./dtos";
import {
  getAddLiquidityEstimation,
  getPoolData,
  getUserPositions,
  liquidity,
  positions,
  slot0
} from "./getFunctions";
import "./helpers/initalize";
import { quoteExactAmount } from "./quoteFuncs";
import { swap } from "./swap";
import { Pool } from "./pool";

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
  public async GetPoolData(ctx: GalaChainContext, dto: GetPoolDto) {
    return await getPoolData(ctx, dto);
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
  public async Collect(ctx: GalaChainContext, dto: CollectDTO) {
    return await collect(ctx, dto);
  }
}
