import BigNumber from "bignumber.js";
import { Exclude } from "class-transformer";
import { IsNotEmpty } from "class-validator";

import { ChainKey } from "../utils";
import { BigNumberIsInteger, BigNumberIsNotNegative, BigNumberProperty } from "../validators";
import { ChainObject } from "./ChainObject";

// index class added in long after initial implementation to faciliate targeted query of TokenSwapRequests
// query by TokenClass / TokenInstance keys, get swapRequestId properties for FillTokenSwap calls
// As a user, I want to see all offers for TokenClass foo, so that I can buy one
export class TokenSwapRequestInstanceOffered extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTSRIO";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public collection: string;

  @ChainKey({ position: 1 })
  public category: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public type: string;

  @ChainKey({ position: 3 })
  @IsNotEmpty()
  public additionalKey: string;

  @ChainKey({ position: 4 })
  @IsNotEmpty()
  @BigNumberIsInteger()
  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public instance: BigNumber;

  @ChainKey({ position: 5 })
  @IsNotEmpty()
  public swapRequestId: string;
}
