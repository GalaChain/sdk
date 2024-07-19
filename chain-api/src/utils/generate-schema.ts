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
import { defaultMetadataStorage } from "class-transformer/cjs/storage";
import { targetConstructorToSchema } from "class-validator-jsonschema";
import { SchemaObject } from "openapi3-ts";

import { RuntimeError } from "./error";

type ClassConstructor = {
  new (...args: unknown[]): unknown;
};

class GenerateSchemaError extends RuntimeError {}

function customTargetConstructorToSchema(classType: ClassConstructor) {
  const schema = targetConstructorToSchema(classType, {
    additionalConverters: {
      ["enumProperty"]: (meta) => {
        const [values, , enumValuesInfo] = meta.constraints; // this is by convention in this decorator
        const type: { type?: "number" } = values.every((v) => typeof v === "number")
          ? { type: "number" }
          : {};
        const schemaObj: SchemaObject = {
          ...type,
          enum: values,
          description: enumValuesInfo
        };
        return schemaObj;
      },
      ["IsUserAliasConstraint"]: (meta) => {
        return {
          type: "string",
          description:
            "Allowed value is string following the format of 'client|<user-id>', or 'eth|<checksumed-eth-addr>', or valid system-level username."
        };
      }
    },
    classTransformerMetadataStorage: defaultMetadataStorage
  });

  return schema;
}

export type Primitive = "number" | "string" | "boolean" | "null" | "object";

function isPrimitive(x: unknown): x is Primitive {
  return x === "number" || x === "string" || x === "boolean" || x === "null" || x === "object";
}

function isPrimitiveOrUndef(x: unknown): x is Primitive | undefined {
  return isPrimitive(x) || x === undefined;
}

function updateDefinitions(
  object: SchemaObject,
  rootClass: ClassConstructor,
  property: string | undefined
): void {
  // Replace BigNumber with string
  if (object["$ref"] === "#/definitions/BigNumber") {
    delete object["$ref"];
    object.type = "string";
    object.description = ((object.description ?? "") + " Number provided as a string.").trim();
    return;
  }

  // Update items type in Arrays
  if (object["type"] === "array") {
    if (object.items && typeof object.items === "object") {
      updateDefinitions(object.items as Record<string, unknown>, rootClass, property);
    }
    return;
  }

  // Try to get type from registry and expand it
  if (object["$ref"] && typeof object["$ref"] === "string" && object["$ref"].startsWith("#/definitions/")) {
    try {
      const typeMetadata = defaultMetadataStorage.findTypeMetadata(rootClass, property);

      if (typeMetadata === undefined) {
        const className = object["$ref"].replace("#/definitions/", "");
        throw new GenerateSchemaError(`Cannot find type metadata of ${className} for property ${property}`);
      }

      if (typeof typeMetadata.typeFunction !== "function") {
        throw new GenerateSchemaError(`reflectedType of ${typeMetadata} is not a function`);
      }

      const classType = typeMetadata.typeFunction();
      const schema = customTargetConstructorToSchema(classType);
      updateDefinitions(schema, classType, undefined);

      Object.keys(schema).map((k) => {
        if (k === "description") {
          // descriptions are appended, not overwritten
          object[k] = `${object[k] ?? ""} ${schema[k] ?? ""}`.trim();
        } else {
          object[k] = schema[k];
        }
      });
    } catch (e) {
      console.error("Error processing schema:", e.message);
    } finally {
      object.type = "object";
      delete object["$ref"];
    }
    return;
  }

  Object.entries(object).forEach(([property, v]) => {
    if (typeof v === "object" && !!v) {
      updateDefinitions(v as Record<string, unknown>, rootClass, property);
    }
  });
}

export function generateSchema(classType: ClassConstructor) {
  const schema = customTargetConstructorToSchema(classType);
  updateDefinitions(schema, classType, undefined);
  return schema;
}

export function generateResponseSchema(
  type: ClassConstructor | Primitive | undefined,
  isArray?: "array"
): SchemaObject {
  const objectSchema: SchemaObject = isPrimitiveOrUndef(type)
    ? { type: type ?? "null" }
    : generateSchema(type);
  const responseDataSchema: SchemaObject =
    isArray === "array" ? { type: "array", items: objectSchema } : objectSchema;

  return {
    type: "object",
    properties: {
      Status: {
        enum: [0, 1],
        description: "Indicates Error (0) or Success (1)"
      },
      Message: {
        type: "string"
      },
      Data: responseDataSchema
    },
    required: ["Status"]
  };
}
