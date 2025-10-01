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
import { SerializeIf, StringEnumProperty } from "../validators";
import { ChainObject } from "./ChainObject";

export class PublicKey extends ChainObject {
  @ValidateIf((o) => !o.publicKeys)
  @IsString()
  @IsNotEmpty()
  publicKey?: string;

  @ValidateIf((o) => !o.publicKey)
  @SerializeIf((o) => !o.publicKey)
  @IsString({ each: true })
  @ArrayMinSize(2)
  public publicKeys?: string[];

  @IsOptional()
  @StringEnumProperty(SigningScheme)
  public signing?: SigningScheme;

  public getAllPublicKeys(): string[] {
    return this.publicKeys ?? this.publicKey ? [this.publicKey as string] : [];
  }
}

export const PK_INDEX_KEY = "GCPK";

export function normalizePublicKey(input: string): string {
  return signatures.normalizePublicKey(input).toString("base64");
}
