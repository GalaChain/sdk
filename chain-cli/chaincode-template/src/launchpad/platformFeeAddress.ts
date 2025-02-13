import { ChainKey, ChainObject } from "@gala-chain/api";
import { Exclude } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class PlatformFeeAddress extends ChainObject {
  @Exclude()
  static INDEX_KEY = "PLATFORM_FEE_ADDRESS";

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
