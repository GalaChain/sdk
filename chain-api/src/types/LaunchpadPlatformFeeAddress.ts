import { Exclude } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { ChainObject } from "./ChainObject";

export class PlatformFeeAddress extends ChainObject {
  @Exclude()
  static INDEX_KEY = "LAUNCHPAD_FEE_ADDRESS";

  @IsString()
  @IsNotEmpty()
  public platformFeeAddress: string;

  constructor(platformFeeAddress: string) {
    super();
    this.platformFeeAddress = platformFeeAddress;
  }

  public modifyPlatformFeeAddress(newAddress: string) {
    this.platformFeeAddress = newAddress;
  }
}