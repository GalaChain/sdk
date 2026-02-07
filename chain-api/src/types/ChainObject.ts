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
import bs58 from "bs58";
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

  public serializeChainState(): [string, Buffer] {
    const classIndexKey = this.getClassIndexKey();
    const keyFields = ChainObject.getOrderedKeyFields(this);
    const keyValues = ChainObject.getOrderedKeyValues(this, keyFields);
    const compositeKey = ChainObject.getCompositeKeyFromParts(classIndexKey, keyValues);

    const keyFieldsSet = new Set(keyFields);
    const plain = this.toPlainObject();
    const valueObj = Object.fromEntries(Object.entries(plain).filter(([k]) => !keyFieldsSet.has(k)));
    const buffer = Buffer.from(JSON.stringify(valueObj));

    return [compositeKey, buffer];
  }

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

  public copy(): this {
    // @ts-expect-error type conversion
    return ChainObject.deserialize<typeof this>(this.constructor, this.toPlainObject());
  }

  public static deserialize<T>(
    constructor: ClassConstructor<Inferred<T, ChainObject>>,
    object: string | Record<string, unknown> | Record<string, unknown>[]
  ): T {
    return deserialize<T, ChainObject>(constructor, object);
  }

  public static deserializeChainState<T extends ChainObject>(
    constructor: ClassConstructor<Inferred<T, ChainObject>>,
    key: string,
    value: Buffer
  ): T {
    const [indexKey, keyParts] = ChainObject.extractKeyPartsFromCompositeKey(key);
    const keyFields = ChainObject.getOrderedKeyFields(constructor.prototype);

    if (keyParts.length !== keyFields.length) {
      throw new InvalidCompositeKeyError(
        `Key parts length ${keyParts.length} does not match key fields length ${keyFields.length}. Key: ${key}`
      );
    }

    const plainObject = JSON.parse(value.toString());

    keyFields.forEach((field, index) => {
      plainObject[field] = keyParts[index];
    });

    const object = deserialize<T, ChainObject>(constructor, plainObject);

    if (object.getClassIndexKey() !== indexKey) {
      throw new InvalidCompositeKeyError(
        `Index key ${object.getClassIndexKey()} does not match expected index key ${indexKey}. Key: ${key}`
      );
    }

    return object;
  }

  private static extractKeyPartsFromCompositeKey(key: string): [string, string[]] {
    // Remove namespace and index key
    const parts = key.substring(1).split(this.MIN_UNICODE_RUNE_VALUE);

    // First part is the index key, rest are the actual key parts
    return [parts[0], parts.slice(1, -1)]; // Remove index key and trailing empty part
  }

  public getCompositeKey(): string {
    const classIndexKey = this.getClassIndexKey();
    console.log("classIndexKey", classIndexKey);
    const proto = Object.getPrototypeOf(this);
    const keyFields = ChainObject.getOrderedKeyFields(proto);
    console.log("keyFields", keyFields);
    const keyParts = ChainObject.getOrderedKeyValues(this, keyFields);
    console.log("keyParts", keyParts);
    return ChainObject.getCompositeKeyFromParts(classIndexKey, keyParts);
  }

  private getClassIndexKey(): string {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore this is a way to access static property of current class
    const classIndexKey = this.__proto__.constructor.INDEX_KEY;

    if (classIndexKey === undefined) {
      throw new InvalidCompositeKeyError(
        `getCompositeKey failed because of no INDEX_KEY on ${serialize(this)}`
      );
    }

    return classIndexKey;
  }

  private static getOrderedKeyFields(target: object): string[] {
    const fields: ChainKeyMetadata[] = Reflect.getOwnMetadata("galachain:chainkey", target) || [];
    fields.sort((a, b) => a.position - b.position);
    return fields.map((f) => f.key.toString());
  }

  private static getOrderedKeyValues(target: object, fields: string[]): unknown[] {
    return fields.map((k) =>
      typeof target[k]?.toStringKey === "function" ? target[k]?.toStringKey() : target[k]
    );
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

  public static getEncodableStringKeyFromParts(parts: string[]): string {
    parts.forEach((part, index) => {
      if (part.includes(ChainObject.MIN_UNICODE_RUNE_VALUE)) {
        const msg = `Invalid part with UTF-0 at index ${index} passed to getEncodableStringKeyFromParts}`;
        throw new InvalidCompositeKeyError(msg);
      }
    });
    return parts.join(ChainObject.MIN_UNICODE_RUNE_VALUE);
  }

  public static getPartsFromEncodableStringKey(stringKey: string, expectedParts: number): string[] {
    const parts = stringKey.split(ChainObject.MIN_UNICODE_RUNE_VALUE);
    if (parts.length !== expectedParts) {
      const msg = `Expected ${expectedParts} parts, got ${parts.length} parts in getPartsFromEncodableStringKey`;
      throw new InvalidCompositeKeyError(msg);
    }
    return parts;
  }

  public static encodeToBase58(stringKey: string): string {
    const buffer = Buffer.from(stringKey);
    return bs58.encode(buffer);
  }

  public static decodeFromBase58(base58String: string): string {
    const decoded = bs58.decode(base58String);
    return Buffer.from(decoded).toString("utf8");
  }
}
