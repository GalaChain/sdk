import { Exclude } from "class-transformer";
import { IsNotEmpty } from "class-validator";

import { ChainKey } from "../utils";
import { IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

// index class added in long after initial implementation to faciliate targeted query of TokenSwapRequests
// query by owner keys, get swapRequestId properties for FillTokenSwap calls
// As a user, I want to see a list of all my offers, so I can optionally close/cancel/terminate one or more
export class TokenSwapRequestOfferedBy extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTSROB";

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public offeredBy: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public swapRequestId: string;
}
