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
import fs from "fs";
import { Schema, ValidationError, Validator } from "jsonschema";

export interface ContractConfig {
  pathFragment: string;
  chaincodeName: string;
  contractName: string;
}

export interface ChannelConfig {
  pathFragment: string;
  channelName: string;
  asLocalHost?: boolean;
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
          type: "string",
          minLength: 1
        },
        contracts: {
          items: {
            $ref: "#/definitions/IContractConfig"
          },
          minItems: 1,
          type: "array"
        },
        pathFragment: {
          type: "string",
          minLength: 1
        },
        asLocalHost: {
          type: "boolean"
        }
      },
      additionalProperties: false,
      required: ["channelName", "contracts", "pathFragment"] as ["channelName", "contracts", "pathFragment"],
      type: "object"
    },
    IContractConfig: {
      additionalProperties: false,
      properties: {
        chaincodeName: {
          type: "string",
          minLength: 1
        },
        contractName: {
          type: "string",
          minLength: 1
        },
        pathFragment: {
          type: "string",
          minLength: 1
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
      minItems: 1,
      type: "array"
    }
  },
  additionalProperties: false,
  required: ["channels"] as ["channels"],
  type: "object"
} as const;

function loadJson(path: string): Record<string, unknown> {
  const content = fs.readFileSync(path).toString();
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${path}: ${e}`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Failed to parse JSON at ${path}: expected an object`);
  }

  return parsed as Record<string, unknown>;
}

export function loadRestApiConfig(configPath: string): RestApiConfig {
  const json = loadJson(configPath);

  const validator = new Validator();
  const validation = validator.validate(json, restApiJsonSchema);

  if (!validation.valid) {
    throw new Error(getValidationErrorMessage(validation.errors));
  }

  const config = json as unknown as RestApiConfig;
  assertUniqueNames(config);
  return config;
}

function assertUniqueNames(config: RestApiConfig): void {
  const channelNames = new Set<string>();
  for (const channel of config.channels) {
    if (channelNames.has(channel.channelName)) {
      throw new Error(`Duplicate channel ${channel.channelName}`);
    }
    channelNames.add(channel.channelName);

    const contractNames = new Set<string>();
    for (const contract of channel.contracts) {
      if (contractNames.has(contract.contractName)) {
        throw new Error(`Duplicate contract ${contract.contractName} on channel ${channel.channelName}`);
      }
      contractNames.add(contract.contractName);
    }
  }
}

function getValidationErrorMessage(validationErrors: ValidationError[]): string {
  return validationErrors.map((error) => `${error.property} ${error.message}`).join(". ");
}
