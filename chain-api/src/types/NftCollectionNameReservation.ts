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
import { IsNotEmpty, IsString } from "class-validator";

import { ChainKey } from "../utils";
import { ChainObject } from "./ChainObject";

/**
 * Claims a collection name across all letter cases. Keyed by the normalized (lower-cased)
 * name, so "Mirandus", "mirandus" and "MIRANDUS" all resolve to a single reservation, while
 * `collection` preserves the exact casing the name was first claimed with.
 */
export class NftCollectionNameReservation extends ChainObject {
  public static INDEX_KEY = "GCNFTR";

  @ChainKey({ position: 0 })
  @IsString()
  @IsNotEmpty()
  public normalizedName: string;

  @IsString()
  @IsNotEmpty()
  public collection: string;

  public static normalize(collection: string): string {
    return collection.toLowerCase();
  }
}
