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
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";
import { UserAlias } from "./UserAlias";

export enum UserRole {
  CURATOR = "CURATOR",
  REGISTRAR = "REGISTRAR",
  SUBMIT = "SUBMIT",
  EVALUATE = "EVALUATE"
}

export class UserProfile extends ChainObject {
  static ADMIN_ROLES = [UserRole.CURATOR, UserRole.REGISTRAR] as const;
  static DEFAULT_ROLES = [UserRole.EVALUATE, UserRole.SUBMIT] as const;

  @JSONSchema({
    description:
      "A unique identifier of the user. " +
      "It may have the following format: client|<id> or eth|<checksumed-eth-addr>."
  })
  @IsUserAlias()
  alias: UserAlias;

  @JSONSchema({
    description: `Eth address of the user.`
  })
  @IsNotEmpty()
  ethAddress?: string;

  @JSONSchema({
    description: "Signers of the virtual multisig profile."
  })
  @IsOptional()
  @IsUserAlias({ each: true })
  signers?: UserAlias[];

  @JSONSchema({
    description: `Roles assigned to the user. Predefined roles are: ${Object.values(UserRole)
      .sort()
      .join(", ")}, but you can use arbitrary strings to define your own roles.`
  })
  @IsOptional()
  @IsString({ each: true })
  roles?: string[];

  @JSONSchema({
    description: `Minimum number of signatures required for authorization.`
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  signatureQuorum?: number;
}

export const UP_INDEX_KEY = "GCUP";

export type UserProfileStrict = UserProfile & {
  roles: string[];
  signatureQuorum: number;
};
