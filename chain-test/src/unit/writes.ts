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
import { ChainObject, RangedChainObject } from "@gala-chain/api";

export type WriteRecord =
  | ChainObject
  | RangedChainObject
  | { key: string; isDelete: true }
  | { key: string; value: string };

function isRangedChainObject(record: WriteRecord): record is RangedChainObject {
  return typeof record["getRangedKey"] === "function";
}

function isDelete(record: WriteRecord): record is { key: string; isDelete: true } {
  return typeof record["key"] === "string" && record["isDelete"] === true;
}

function isKV(record: WriteRecord): record is { key: string; value: string } {
  return typeof record["key"] === "string" && typeof record["value"] === "string";
}

export function writesMap(...records: WriteRecord[]): Record<string, string> {
  return records.reduce(
    (acc, record) => {
      if (isDelete(record)) {
        acc[record.key] = "";
      } else if (isKV(record)) {
        acc[record.key] = record.value;
      } else if (isRangedChainObject(record)) {
        acc[record.getRangedKey()] = record.serialize();
      } else {
        acc[record.getCompositeKey()] = record.serialize();
      }
      return acc;
    },
    {} as Record<string, string>
  );
}
