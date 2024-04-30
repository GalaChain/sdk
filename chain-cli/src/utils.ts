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
import { signatures } from "@gala-chain/api";
import { readFile } from "fs/promises";

export async function readPublicKeyFromFile(path: string): Promise<string> {
  return await readFile(path, { encoding: "utf-8" }).catch((e) => {
    throw new Error(`Failed to read public key from file: ${path}. ${e}`);
  });
}

export async function parseStringOrFileKey(stringOrPath: string): Promise<string> {
  const errorMessages: string[] = [];

  try {
    signatures.normalizePrivateKey(stringOrPath);
    return stringOrPath;
  } catch (e) {
    errorMessages.push(`Fail to parse ${stringOrPath} as a valid private key.`);
  }

  try {
    const keyFromFile = (await readFile(stringOrPath, { encoding: "utf-8" })).trim();
    signatures.normalizePrivateKey(keyFromFile);
    return keyFromFile;
  } catch (e) {
    errorMessages.push(`No valid private key found at ${stringOrPath}.`);
  }

  errorMessages.push("Provide either a valid private key or file path to a valid private key.");
  throw new Error(errorMessages.join("\n"));
}

export async function parseJsonFromStringOrFile(jsonOrPath: string): Promise<unknown> {
  let data;

  const errorMessages: string[] = [];
  try {
    data = JSON.parse(jsonOrPath);
  } catch (e) {
    errorMessages.push(
      `string passed to --data flag failed to parse as valid JSON. Assuming file path to JSON data: ${jsonOrPath}`
    );
  }

  if (!data) {
    try {
      data = await readFile(jsonOrPath, { encoding: "utf-8" });
      data = JSON.parse(data);
    } catch (e) {
      errorMessages.push(
        `No valid JSON value found at filepath provided. Provided either a JSON.parse()-able string or file path to a valid JSON object.`
      );
      throw new Error(errorMessages.join(" ---- "));
    }
  }

  return data;
}

export function getPathFileName(path: string): string {
  // verify if the path contains a slash or backslash (linux/mac or windows)
  if (path.includes("/") || path.includes("\\")) {
    const projectName = new RegExp(/.*[/\\]([^/\\]+)$/).exec(path);

    if (projectName != null && projectName.length > 1) {
      return projectName[1];
    }

    return path;
  }

  return path;
}
