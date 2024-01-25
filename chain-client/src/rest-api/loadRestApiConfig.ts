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
import { ValidationError } from "class-validator";
import fs from "fs";
import { Schema, Validator } from "jsonschema";

export interface ContractConfig {
  pathFragment: string;
  chaincodeName: string;
  contractName: string;
}

export interface ChannelConfig {
  pathFragment: string;
  channelName: string;
  contracts: ContractConfig[];
}

export interface RestApiConfig {
  channels: ChannelConfig[];
}

export const restApiJsonSchema: Schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    IChannelConfig: {
      properties: {
        channelName: {
          type: "string"
        },
        contracts: {
          items: {
            $ref: "#/definitions/IContractConfig"
          },
          type: "array"
        },
        pathFragment: {
          type: "string"
        }
      },
      required: ["channelName", "contracts", "pathFragment"] as ["channelName", "contracts", "pathFragment"],
      type: "object"
    },
    IContractConfig: {
      properties: {
        chaincodeName: {
          type: "string"
        },
        contractName: {
          type: "string"
        },
        pathFragment: {
          type: "string"
        }
      },
      required: ["chaincodeName", "contractName", "pathFragment"] as [
        "chaincodeName",
        "contractName",
        "pathFragment"
      ],
      type: "object"
    }
  },
  properties: {
    channels: {
      items: {
        $ref: "#/definitions/IChannelConfig"
      },
      type: "array"
    }
  },
  required: ["channels"] as ["channels"],
  type: "object"
} as const;

function loadJson(path: string): Record<string, unknown> {
  const content = fs.readFileSync(path).toString();

  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${path}: ${e}`);
  }
}

export function loadRestApiConfig(configPath: string): RestApiConfig {
  const json = loadJson(configPath);

  const validator = new Validator();
  const validation = validator.validate(json, restApiJsonSchema);

  if (validation.valid) {
    return json as unknown as RestApiConfig;
  } else {
    throw new Error(getValidationErrorMessage(validation.errors));
  }
}

function getValidationErrorMessage(validationErrors: ValidationError[]): string {
  return validationErrors
    .map((e) => {
      const targetInfo = typeof e.target === "object" ? ` of ${e.target.constructor?.name ?? e.target}` : "";
      const intro = `Property '${e.property}'${targetInfo} has failed the following constraints:`;
      const constraints = e.constraints ?? {};
      const details = Object.keys(constraints)
        .sort()
        .map((k) => `${k} (${constraints[k]})`);
      return `${intro} ${details.join(", ")}`;
    })
    .join(". ");
}
