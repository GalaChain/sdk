import { Exclude } from "class-transformer";
import { ArrayNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

import { ChainObject } from "./ChainObject";

export class DexFeeConfig extends ChainObject {
  @Exclude()
  public static INDEX_KEY = "GCDPFC"; // GalaChain Dex Protocol Fee Configuration

  @ArrayNotEmpty()
  @IsString({ each: true })
  authorities: string[];

  @IsNumber()
  @Min(0)
  @Max(1)
  public protocolFee: number;

  constructor(authorities: string[], protocolFee = 0) {
    super();
    this.authorities = authorities;
    this.protocolFee = protocolFee;
  }

  public addOrUpdateAuthorities(newAuthorities: string[]) {
    this.authorities = newAuthorities;
  }

  public setProtocolFees(fee: number) {
    this.protocolFee = fee;
  }
}
