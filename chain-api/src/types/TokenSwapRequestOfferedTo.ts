import { Exclude } from "class-transformer";
import { IsNotEmpty } from "class-validator";

import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";

// index class added in long after initial implementation to faciliate targeted query of TokenSwapRequests
// query by offeredTo keys, get swapRequestId properties for FillTokenSwap calls
// As a user, I want to see a list anything offered to me, so I can optionally accept/fill the token swap
export class TokenSwapRequestOfferedTo extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCTSROT";

  @ChainKey({ position: 0 })
  @IsNotEmpty()
  public offeredTo: string;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public swapRequestId: string;
}
