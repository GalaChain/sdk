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

function numericArrayType(values: number[]): string {
  let type = "uint256";
  for (const value of values) {
    const valueType = numericEip712Type(value);
    if (valueType === "string") {
      return "string";
    }
    if (valueType === "int256") {
      type = "int256";
    }
  }
  return type;
}

/**
 * Generates EIP-712 type definitions from a given object structure.
 * Empty arrays stay encodable without reading a missing element. Whole numbers
 * that fit in uint256 or int256 use those types; other numbers are strings.
 * @template T - The type of the object to generate types for
 * @param typeName - The name of the primary type
 * @param params - The object to analyze for type generation
 * @returns EIP-712 compatible type definitions
 */
export function generateEIP712Types<T>(typeName: string, params: T): EIP712Types {
  const types: EIP712Types = Object.create(null);
  types[typeName] = [];

  function addField(
    name: string,
    fieldValue: unknown,
    parentTypeName: string,
    onlyGetType = false
  ): string | undefined {
    if (Array.isArray(fieldValue)) {
      const elementType = arrayElementType(name, fieldValue, parentTypeName);
      const arrayType = `${elementType ?? name}[]`;
      if (!onlyGetType) {
        types[parentTypeName].push({ name, type: arrayType });
      }
      return arrayType;
    }

    if (typeof fieldValue === "object" && fieldValue !== null) {
      if (hasOwn(types, name)) {
        throw new Error("Name collisions not yet supported");
      }
      types[name] = [];
      Object.entries(fieldValue).forEach(([key, value]) => {
        addField(key, value, name);
      });
      if (!onlyGetType) {
        types[parentTypeName].push({ name, type: name });
      }
      return name;
    }

    const eipType = scalarEip712Type(fieldValue);
    if (!onlyGetType) {
      types[parentTypeName].push({ name, type: eipType });
    }
    return eipType;
  }

  function arrayElementType(name: string, values: unknown[], parentTypeName: string): string | undefined {
    if (values.length === 0) {
      return "string";
    }
    if (values.every((value) => typeof value === "number")) {
      return numericArrayType(values as number[]);
    }
    return addField(name, values[0], parentTypeName, true);
  }

  const excludedFromSchema = new Set(["signature", "multisig", "trace", "prefix"]);
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (excludedFromSchema.has(key)) {
      return;
    }
    addField(key, value, typeName);
  });

  return types;
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
  return galaAddress ? getAddress(`0x${galaAddress.replace(/0x|eth\|/, "")}`) : "";
}

/**
 * Converts an Ethereum address to a GalaChain address format.
 * @param ethereumAddress - The Ethereum address to convert
 * @returns The equivalent GalaChain address
 */
export function ethereumToGalaChainAddress(ethereumAddress: string) {
  return ethereumAddress?.replace("0x", "eth|") ?? "";
}
