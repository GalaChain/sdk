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
import { IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ConstructorArgs } from "../utils";
import { IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

export enum UserRole {
  CURATOR = "CURATOR",
  SUBMIT = "SUBMIT",
  EVALUATE = "EVALUATE"
}

// TODO make it as tagged string for better type safety guarantees
//  see: https://medium.com/@ethanresnick/advanced-typescript-tagged-types-improved-with-type-level-metadata-5072fc125fcf
export interface HasUserAlias {
  alias: string;
}

export type UserProfileBody = ConstructorArgs<UserProfile>;

export class UserProfile extends ChainObject implements HasUserAlias {
  static ADMIN_ROLES = [UserRole.CURATOR, UserRole.EVALUATE, UserRole.SUBMIT] as const;
  static DEFAULT_ROLES = [UserRole.EVALUATE, UserRole.SUBMIT] as const;

  @JSONSchema({
    description:
      "A unique identifier of the user. " +
      "It may have the following format: client|<id>, eth|<checksumed-eth-addr>, or ton|<ton-bounceable-addr>."
  })
  @IsUserAlias()
  alias: string;

  @JSONSchema({
    description: `Eth address of the user.`
  })
  @IsNotEmpty()
  @ValidateIf((o) => !o.tonAddress)
  ethAddress?: string;

  @JSONSchema({
    description: `TON address of the user.`
  })
  @IsNotEmpty()
  @ValidateIf((o) => !o.ethAddress)
  tonAddress?: string;

  @JSONSchema({
    description: `Roles assigned to the user. Predefined roles are: ${Object.values(UserRole)
      .sort()
      .join(", ")}, but you can use arbitrary strings to define your own roles.`
  })
  @IsString({ each: true })
  roles: string[];
}

export const UP_INDEX_KEY = "GCUP";
