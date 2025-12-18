import { ChainKey, ChainObject, IsUserAlias, UserAlias } from "@gala-chain/api";
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from "class-validator";

export class NftCollectionAuthorization extends ChainObject {
  public static INDEX_KEY = "GCNFTC";

  @ChainKey({ position: 0 })
  @IsString()
  @IsNotEmpty()
  public collection: string;

  @IsUserAlias({ each: true })
  @IsArray()
  @ArrayMinSize(0)
  public authorizedUsers: UserAlias[];
}
