import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from "class-validator";

import { ChainKey } from "../utils";
import { IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { UserAlias } from "./UserAlias";

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
