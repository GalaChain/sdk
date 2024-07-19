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
import { instanceToPlain } from "class-transformer";
import { ValidationError, validate } from "class-validator";
import "reflect-metadata";

import { ChainKeyMetadata, ValidationFailedError, deserialize, serialize } from "../utils";
import { ChainObject, ObjectValidationFailedError } from "./ChainObject";
import { ClassConstructor, Inferred } from "./dtos";

export class InvalidRangedKeyError extends ValidationFailedError {
  constructor(message: string) {
    super(message);
  }
}

export abstract class RangedChainObject {
  public serialize(): string {
    return serialize(this);
  }

  public validate(): Promise<ValidationError[]> {
    return validate(this);
  }

  async validateOrReject(): Promise<void> {
    const validationErrors = await this.validate();

    if (validationErrors.length) {
      throw new ObjectValidationFailedError(validationErrors);
    }
  }

  public toPlainObject(): Record<string, unknown> {
    return instanceToPlain(this);
  }

  public static deserialize<T>(
    constructor: ClassConstructor<Inferred<T, RangedChainObject>>,
    object: string | Record<string, unknown> | Record<string, unknown>[]
  ): T {
    return deserialize<T, RangedChainObject>(constructor, object);
  }

  public getRangedKey(): string {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore this is a way to access static property of current class
    const classIndexKey = this.__proto__.constructor.INDEX_KEY;

    if (classIndexKey === undefined) {
      throw new InvalidRangedKeyError(`getCompositeKey failed because of no INDEX_KEY on ${serialize(this)}`);
    }

    const target = Object.getPrototypeOf(this);
    const fields: ChainKeyMetadata[] = Reflect.getOwnMetadata("galachain:chainkey", target) || [];

    const plain = instanceToPlain(this);
    const keyParts = fields
      .sort((a, b) => a.position - b.position)
      .map((field) => {
        const key = field.key.toString();
        return typeof this[key]?.toStringKey === "function" ? this[key]?.toStringKey() : plain[key];
      });

    return RangedChainObject.getRangedKeyFromParts(classIndexKey, keyParts);
  }

  public static getRangedKeyFromParts(indexKey: string, parts: unknown[]): string {
    for (const part of parts) {
      if (
        part === null ||
        part === undefined ||
        typeof part === "object" ||
        !(typeof part["toString"] === "function")
      ) {
        throw new InvalidRangedKeyError(
          `Invalid part ${part} passed to getRangedKeyFromParts: ${parts.join(", ")}`
        );
      }
    }

    return indexKey + ChainObject.MIN_UNICODE_RUNE_VALUE + parts.join(ChainObject.MIN_UNICODE_RUNE_VALUE);
  }

  public static getStringKeyFromParts(parts: string[]): string {
    return `${parts.join(ChainObject.ID_SPLIT_CHAR)}`;
  }
}
