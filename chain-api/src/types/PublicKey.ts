/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ArrayMinSize, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";

import { SigningScheme, signatures } from "../utils";
import { IsUserAlias, SerializeIf, StringEnumProperty } from "../validators";
import { ChainObject } from "./ChainObject";
import { UserAlias } from "./UserAlias";
import { UserRef, asValidUserRef } from "./UserRef";

export class PublicKey extends ChainObject {
  @ValidateIf((o) => !o.signers)
  @IsString()
  @IsNotEmpty()
  public publicKey?: string;

  @IsOptional()
  @StringEnumProperty(SigningScheme)
  public signing?: SigningScheme;

  @ValidateIf((o) => !o.publicKey)
  @SerializeIf((o) => !o.publicKey)
  @IsUserAlias({ each: true })
  @ArrayMinSize(2)
  public signers?: UserAlias[];

  public getAllSigners(): UserRef[] {
    if (this.publicKey) {
      if (this.signing === SigningScheme.TON) {
        const addr = signatures.ton.getTonAddress(Buffer.from(this.publicKey, "base64"));
        return [asValidUserRef(addr)];
      }

      const pkHex = signatures.getNonCompactHexPublicKey(this.publicKey);
      return [asValidUserRef(signatures.getEthAddress(pkHex))];
    }

    return this.signers ?? [];
  }
}

export const PK_INDEX_KEY = "GCPK";

export function normalizePublicKey(input: string): string {
  return signatures.normalizePublicKey(input).toString("base64");
}
