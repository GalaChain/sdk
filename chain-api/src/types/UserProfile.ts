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
import { ArrayMinSize, IsNotEmpty, IsString } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainObject } from "./ChainObject";

export enum UserRole {
  CURATOR = "CURATOR",
  SUBMIT = "SUBMIT",
  EVALUATE = "EVALUATE"
}

export class UserProfile extends ChainObject {
  static ADMIN_ROLES = [UserRole.CURATOR, UserRole.EVALUATE, UserRole.SUBMIT] as const;
  static DEFAULT_ROLES = [UserRole.EVALUATE, UserRole.SUBMIT] as const;

  @JSONSchema({
    description: `Legacy caller id from user name or identifier derived from ethAddress for new users.`
  })
  @IsNotEmpty()
  alias: string;

  @JSONSchema({
    description: `Eth address of the user.`
  })
  @IsNotEmpty()
  ethAddress: string;

  @JSONSchema({
    description: `Roles assigned to the user. Predefined roles are: ${Object.values(UserRole)
      .sort()
      .join(", ")}, but you can use arbitrary string to define your own roles.`
  })
  @IsString({ each: true })
  @ArrayMinSize(1)
  roles: string[];
}

export const UP_INDEX_KEY = "GCUP";
