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
import { ChainKey, ChainObject } from "@gala-chain/api";
import { Exclude } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

export class UniqueTransaction extends ChainObject {
  @Exclude()
  static INDEX_KEY = "UNTX";

  @ChainKey({ position: 0 })
  @JSONSchema({
    description:
      "Unique key to prevent a transaction from being submitted multiple times. " +
      "A transaction will be rejected if the unique key already exists on chain."
  })
  @IsString()
  @IsNotEmpty()
  uniqueKey: string;

  @IsNotEmpty()
  created: number;

  @IsString()
  @IsNotEmpty()
  transactionId: string;
}
