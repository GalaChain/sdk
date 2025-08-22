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
type EIP712Types = Record<string, Array<{ name: string; type: string }>>;

/**
 * Type definition for EIP-712 value structures.
 */
type EIP712Value = Record<string, unknown>;

/**
 * Generates EIP-712 type definitions from a given object structure.
 * @template T - The type of the object to generate types for
 * @param typeName - The name of the primary type
 * @param params - The object to analyze for type generation
 * @returns EIP-712 compatible type definitions
 */
export function generateEIP712Types<T>(typeName: string, params: T): EIP712Types {
  const types: EIP712Types = {};
  types[typeName] = [];

  function addField(name: string, fieldValue: unknown, parentTypeName: string, onlyGetType = false) {
    if (Array.isArray(fieldValue)) {
      //Take the type of the first element
      const type = addField(name, fieldValue[0], parentTypeName, true);
      if (!onlyGetType) types[parentTypeName].push({ name, type: (type ?? name) + "[]" });
    } else if (typeof fieldValue === "object" && fieldValue !== null) {
      if (types[name]) {
        throw new Error("Name collisions not yet supported");
      }
      types[name] = [];
      Object.entries(fieldValue).forEach(([key, value]) => {
        addField(key, value, name);
      });
      if (!onlyGetType) types[parentTypeName].push({ name, type: name });
    } else {
      let eipType: string;
      switch (typeof fieldValue) {
        case "string":
          eipType = "string";
          break;
        case "number":
          eipType = "uint256";
          break;
        case "boolean":
          eipType = "bool";
          break;
        default:
          throw new Error(`Unsupported type, ${typeof fieldValue}, value: ${fieldValue}`);
      }
      if (onlyGetType) {
        return eipType;
      } else {
        types[parentTypeName].push({ name, type: eipType });
      }
    }
  }

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    addField(key, value, typeName);
  });

  return types;
}

/**
 * Capitalizes the first letter of a string.
 * @param string - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Generates EIP-712 value structures from a given object.
 * @template T - The type of the object to generate values for
 * @param params - The object to convert to EIP-712 format
 * @returns EIP-712 compatible value structure
 */
export function generateEIP712Value<T>(params: T): EIP712Value {
  const value: EIP712Value = {};

  function addField(name: string, field: unknown) {
    if (Array.isArray(field) || (typeof field === "object" && field !== null)) {
      Object.entries(field).forEach(([key, val]) => {
        addField(`${name}${capitalizeFirstLetter(key)}`, val);
      });
    } else {
      value[name] = field;
    }
  }

  Object.entries(params as Record<string, unknown>).forEach(([key, field]) => {
    addField(key, field);
  });

  return value;
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
