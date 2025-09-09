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
import { ArrayNotEmpty, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { SigningScheme, signatures } from "../utils";
import { StringEnumProperty } from "../validators";
import { ChainObject } from "./ChainObject";

export class PublicKey extends ChainObject {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public publicKey?: string;

  @IsString({ each: true })
  @ArrayNotEmpty()
  public publicKeys!: string[];

  @IsOptional()
  @StringEnumProperty(SigningScheme)
  public signing?: SigningScheme;

  public override serialize(): string {
    this.publicKey = this.publicKeys[0];
    return super.serialize();
  }

  public static from(
    object: string | Record<string, unknown> | Record<string, unknown>[]
  ): PublicKey {
    const pk = ChainObject.deserialize<PublicKey>(PublicKey, object);
    if (pk.publicKeys === undefined || pk.publicKeys.length === 0) {
      if (pk.publicKey !== undefined) {
        pk.publicKeys = [pk.publicKey];
      }
    }
    if (pk.publicKeys !== undefined && pk.publicKeys.length > 0) {
      [pk.publicKey] = pk.publicKeys;
    }
    return pk;
  }
}

export const PK_INDEX_KEY = "GCPK";

export function normalizePublicKey(input: string): string {
  return signatures.normalizePublicKey(input).toString("base64");
}
