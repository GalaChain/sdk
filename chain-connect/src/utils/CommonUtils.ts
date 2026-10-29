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
import { getAddress } from "ethers";

/**
 * Type definition for EIP-712 type structures.
 */
type EIP712Field = { name: string; type: string };
type EIP712Types = Record<string, Array<EIP712Field>>;

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function numericEip712Type(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error(`Unsupported type, number, value: ${value}`);
  }
  if (Number.isSafeInteger(value) && value >= 0) {
    return "uint256";
  }
  if (Number.isSafeInteger(value)) {
    return "int256";
  }
  return "string";
}

function scalarEip712Type(value: unknown): string {
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return numericEip712Type(value);
    case "boolean":
      return "bool";
    default:
      throw new Error(`Unsupported type, ${typeof value}, value: ${value}`);
  }
}

function numericArrayType(values: unknown[]): string {
  let type = "uint256";
  for (const value of values) {
    const valueType = numericEip712Type(value as number);
    if (valueType === "string") {
      return "string";
    }
    if (valueType === "int256") {
      type = "int256";
    }
  }
  return type;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameFields(a: EIP712Field[], b: EIP712Field[]): boolean {
  return a.length === b.length && a.every((field, i) => field.name === b[i].name && field.type === b[i].type);
}

/**
 * Generates EIP-712 type definitions from a given object structure.
 * Empty arrays stay encodable without reading a missing element. Whole numbers
 * that fit in uint256 or int256 use those types; other numbers are strings.
 * Elements of an object array share one struct type with the fields of all
 * elements. A nested name may repeat when its fields are the same.
 * @template T - The type of the object to generate types for
 * @param typeName - The name of the primary type
 * @param params - The object to analyze for type generation
 * @returns EIP-712 compatible type definitions
 */
export function generateEIP712Types<T>(typeName: string, params: T): EIP712Types {
  const types: EIP712Types = Object.create(null);

  function registerStruct(name: string, fields: EIP712Field[]): string {
    if (hasOwn(types, name)) {
      if (!sameFields(types[name], fields)) {
        throw new Error(`Name collisions not yet supported: ${name} has different fields`);
      }
      return name;
    }
    types[name] = fields;
    return name;
  }

  // One struct type for a list of objects: fields of all of them, in first-seen order.
  function structType(name: string, objects: Record<string, unknown>[]): string {
    const names: string[] = [];
    for (const object of objects) {
      for (const key of Object.keys(object)) {
        if (!names.includes(key)) {
          names.push(key);
        }
      }
    }
    const fields = names.map((key) => {
      const values = objects.filter((object) => hasOwn(object, key)).map((object) => object[key]);
      return { name: key, type: valuesType(key, values) };
    });
    return registerStruct(name, fields);
  }

  // A single type that encodes every value given for the same field.
  function valuesType(name: string, values: unknown[]): string {
    if (values.every(isPlainObject)) {
      return structType(name, values);
    }
    if (values.every(Array.isArray)) {
      return `${arrayElementType(name, values.flat())}[]`;
    }
    if (values.every((value) => typeof value === "number")) {
      return numericArrayType(values);
    }
    const fieldTypes = new Set(values.map(scalarEip712Type));
    if (fieldTypes.size === 1) {
      return [...fieldTypes][0];
    }
    // Numbers declared as strings are signed as strings.
    if (values.every((value) => typeof value === "string" || typeof value === "number")) {
      return "string";
    }
    throw new Error(`Field ${name} has values of different types`);
  }

  function arrayElementType(name: string, values: unknown[]): string {
    if (values.length === 0) {
      return "string";
    }
    return valuesType(name, values);
  }

  const excludedFromSchema = new Set(["signature", "multisig", "trace", "prefix"]);
  const message = Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(([key]) => !excludedFromSchema.has(key))
  );
  structType(typeName, [message]);

  // Keep the primary type first, as before.
  const ordered: EIP712Types = Object.create(null);
  ordered[typeName] = types[typeName];
  for (const name of Object.keys(types)) {
    ordered[name] = types[name];
  }
  return ordered;
}

function coerceTypedValue(types: EIP712Types, type: string, value: unknown): unknown {
  if (type.endsWith("[]")) {
    if (!Array.isArray(value)) {
      return value;
    }
    const elementType = type.slice(0, -2);
    return value.map((item) => coerceTypedValue(types, elementType, item));
  }

  if (hasOwn(types, type) && value !== null && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const copy: Record<string, unknown> = { ...record };
    for (const field of types[type]) {
      if (hasOwn(record, field.name)) {
        copy[field.name] = coerceTypedValue(types, field.type, record[field.name]);
      }
    }
    return copy;
  }

  if (type === "string" && typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return value;
}

/**
 * Copies a typed-data value so fractional numbers declared as strings are strings.
 * Integer fields keep their numeric values.
 */
export function valueForTypedDataSigning<T>(types: EIP712Types, primaryType: string, value: T): T {
  return coerceTypedValue(types, primaryType, value) as T;
}

/**
 * Converts a GalaChain address to an Ethereum address format.
 * @param galaAddress - The GalaChain address to convert
 * @returns The equivalent Ethereum address
 */
export function galaChainToEthereumAddress(galaAddress: string) {
  if (!galaAddress) {
    return "";
  }
  const body = galaAddress.startsWith("eth|")
    ? galaAddress.slice(4)
    : galaAddress.startsWith("0x")
      ? galaAddress.slice(2)
      : galaAddress;
  return getAddress(`0x${body}`);
}

/**
 * Converts an Ethereum address to a GalaChain address format.
 * @param ethereumAddress - The Ethereum address to convert
 * @returns The equivalent GalaChain address
 */
export function ethereumToGalaChainAddress(ethereumAddress: string) {
  if (!ethereumAddress) {
    return "";
  }
  return ethereumAddress.startsWith("0x") ? `eth|${ethereumAddress.slice(2)}` : ethereumAddress;
}
