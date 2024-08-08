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
import { IsNotEmpty } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ConstructorArgs } from "../utils";
import { IsUserAlias } from "../validators";
import { ChainObject } from "./ChainObject";

export type UserProfileBody = ConstructorArgs<UserProfile>;

export class UserProfile extends ChainObject {
  @JSONSchema({
    description: `Legacy caller id from user name or identifier derived from ethAddress for new users.`
  })
  @IsUserAlias()
  alias: string;

  @JSONSchema({
    description: `Eth address of the user.`
  })
  @IsNotEmpty()
  ethAddress: string;
}

export const UP_INDEX_KEY = "GCUP";
