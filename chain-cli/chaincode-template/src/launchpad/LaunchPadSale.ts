import { BigNumberProperty, DefaultError, TokenInstanceKey } from "@gala-chain/api";
import { ChainKey, ChainObject } from "@gala-chain/api";
import { StringEnumProperty } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { Exclude } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

import { BASE_PRICE, saleStatus } from "./constants";

export class LaunchPadSale extends ChainObject {
  @Exclude()
  static INDEX_KEY = "LAUNCHPAD";

  @ChainKey({ position: 0 })
  @IsString()
  @IsNotEmpty()
  public vaultAddress: string;

  @StringEnumProperty(saleStatus)
  public saleStatus: saleStatus;

  public sellingToken: TokenInstanceKey;
  public nativeToken: TokenInstanceKey;
  public sellingTokenQuantity: string;
  public nativeTokenQuantity: string;

  public saleOwner: string;

  @BigNumberProperty()
  public basePrice: BigNumber;

  @BigNumberProperty()
  public exponentFactor: BigNumber;

  @BigNumberProperty()
  public maxSupply: BigNumber;

  @BigNumberProperty()
  public euler: BigNumber;
  //UNISWAP

  constructor(vaultAddress: string, sellingToken: TokenInstanceKey, saleOwner: string) {
    super();

    this.vaultAddress = vaultAddress;
    this.saleOwner = saleOwner;

    this.sellingToken = sellingToken;
    this.sellingTokenQuantity = "1e+7";

    this.basePrice = new BigNumber(BASE_PRICE);
    this.exponentFactor = new BigNumber("1166069000000");
    this.maxSupply = new BigNumber("1e+7");
    this.euler = new BigNumber("2.7182818284590452353602874713527");
    this.saleStatus = saleStatus.ONGOING;

    const nativeTokenInstance = new TokenInstanceKey();
    nativeTokenInstance.collection = "GALA";
    nativeTokenInstance.category = "Unit";
    nativeTokenInstance.type = "none";
    nativeTokenInstance.additionalKey = "none";
    nativeTokenInstance.instance = new BigNumber(0);

    this.nativeToken = nativeTokenInstance;
    this.nativeTokenQuantity = "0";
  }

  public buyToken(sellingTokenAmount: BigNumber, nativeTokenAmount: BigNumber) {
    const tokenLeftInVault = new BigNumber(this.sellingTokenQuantity);
    const nativeTokensLeftInVault = new BigNumber(this.nativeTokenQuantity);
    this.sellingTokenQuantity = tokenLeftInVault.minus(sellingTokenAmount).toString();
    this.nativeTokenQuantity = nativeTokensLeftInVault.plus(nativeTokenAmount).toString();
  }

  public sellToken(sellingTokenAmount: BigNumber, nativeTokenAmount: BigNumber) {
    const tokenLeftInVault = new BigNumber(this.sellingTokenQuantity);
    const nativeTokensLeftInVault = new BigNumber(this.nativeTokenQuantity);
    this.sellingTokenQuantity = tokenLeftInVault.plus(sellingTokenAmount).toString();
    this.nativeTokenQuantity = nativeTokensLeftInVault.minus(nativeTokenAmount).toString();
  }

  public fetchTokensSold() {
    const tokenLeftInVault = new BigNumber(this.sellingTokenQuantity);
    const tokensSold = new BigNumber(this.maxSupply).minus(tokenLeftInVault);
    return tokensSold.toString();
  }

  public fetchNativeTokensInVault() {
    const nativeTokenInVault = new BigNumber(this.nativeTokenQuantity);
    return nativeTokenInVault.toString();
  }

  public fetchBasePrice() {
    const basePriceBigNumber = new BigNumber(this.basePrice);
    return basePriceBigNumber.toString();
  }

  public finalizeSale() {
    this.saleStatus = saleStatus.END;
    this.nativeTokenQuantity = "0";
    this.sellingTokenQuantity = "0";
  }

  public fetchSellingTokenInstanceKey() {
    const tokenInstanceKey = new TokenInstanceKey();
    tokenInstanceKey.collection = this.sellingToken.collection;
    tokenInstanceKey.category = this.sellingToken.category;
    tokenInstanceKey.type = this.sellingToken.type;
    tokenInstanceKey.additionalKey = this.sellingToken.additionalKey;
    tokenInstanceKey.instance = this.sellingToken.instance;

    return tokenInstanceKey;
  }

  public fetchNativeTokenInstanceKey() {
    const tokenInstanceKey = new TokenInstanceKey();
    tokenInstanceKey.collection = this.nativeToken.collection;
    tokenInstanceKey.category = this.nativeToken.category;
    tokenInstanceKey.type = this.nativeToken.type;
    tokenInstanceKey.additionalKey = this.nativeToken.additionalKey;
    tokenInstanceKey.instance = this.nativeToken.instance;

    return tokenInstanceKey;
  }
}
