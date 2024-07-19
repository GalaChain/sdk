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

import {
  ChainKeyMetadata,
  ValidationFailedError,
  deserialize,
  getValidationErrorMessages,
  serialize
} from "../utils";
import { ClassConstructor, Inferred } from "./dtos";

export class ObjectValidationFailedError extends ValidationFailedError {
  constructor(errors: ValidationError[]) {
    const messages = getValidationErrorMessages(errors);
    const messagesString = messages.map((s, i) => `(${i + 1}) ${s}`).join(", ");
    super(`Object validation failed: ${messagesString}`, messages);
  }
}

export class InvalidCompositeKeyError extends ValidationFailedError {
  constructor(message: string) {
    super(message);
  }
}

export abstract class ChainObject {
  public static MIN_UNICODE_RUNE_VALUE = "\u0000";

  public static COMPOSITEKEY_NS = "\x00";

  // Example Composite is Org$User|TokenKey1$TokenKey2$TokenKey3|SomeOtherKey
  public static ID_SPLIT_CHAR = "$";

  public static ID_SUB_SPLIT_CHAR = "|";

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
    constructor: ClassConstructor<Inferred<T, ChainObject>>,
    object: string | Record<string, unknown> | Record<string, unknown>[]
  ): T {
    return deserialize<T, ChainObject>(constructor, object);
  }

  public getCompositeKey(): string {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore this is a way to access static property of current class
    const classIndexKey = this.__proto__.constructor.INDEX_KEY;

    if (classIndexKey === undefined) {
      throw new InvalidCompositeKeyError(
        `getCompositeKey failed because of no INDEX_KEY on ${serialize(this)}`
      );
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

    return ChainObject.getCompositeKeyFromParts(classIndexKey, keyParts);
  }

  public static getCompositeKeyFromParts(indexKey: string, parts: unknown[]): string {
    let compositeKey = ChainObject.COMPOSITEKEY_NS + indexKey + ChainObject.MIN_UNICODE_RUNE_VALUE;

    for (const part of parts) {
      if (
        part === null ||
        part === undefined ||
        typeof part === "object" ||
        !(typeof part["toString"] === "function")
      ) {
        throw new InvalidCompositeKeyError(
          `Invalid part ${part} passed to getCompositeKeyFromParts: ${parts.join(", ")}`
        );
      }
      compositeKey = compositeKey + part + ChainObject.MIN_UNICODE_RUNE_VALUE;
    }

    return compositeKey;
  }

  public static getStringKeyFromParts(parts: string[]): string {
    return `${parts.join(ChainObject.ID_SPLIT_CHAR)}`;
  }
}
