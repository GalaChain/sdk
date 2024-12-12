import BigNumber from "bignumber.js";
import { Exclude } from "class-transformer";
import { IsNotEmpty, IsPositive } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsPositive, BigNumberProperty, IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

export class TokenSwapFill extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTSF";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public swapRequestId: string;

  @ChainKey({ position: 1 })
  @IsUserAlias()
  public filledBy: string;

  @ChainKey({ position: 2 })
  @IsPositive()
  public created: number;

  @BigNumberIsPositive()
  @BigNumberProperty()
  public uses: BigNumber;
}
