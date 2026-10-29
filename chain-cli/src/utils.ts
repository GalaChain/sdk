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
import { statSync } from "fs";
import { readFile } from "fs/promises";

import signatures from "./signatures";

export async function readPublicKeyFromFile(path: string): Promise<string> {
  const contents = await readFile(path, { encoding: "utf-8" }).catch((e) => {
    throw new Error(`Failed to read public key from file: ${path}. ${e}`);
  });
  return contents.trim();
}

function isExistingFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function looksLikeRawPrivateKey(value: string): boolean {
  const trimmed = value.trim();
  if (/^(0x)?[0-9a-fA-F]{60,66}$/.test(trimmed)) {
    return true;
  }
  return /^[A-Za-z0-9+/]{43}=?$/.test(trimmed) && Buffer.from(trimmed, "base64").length === 32;
}

/**
 * Private keys passed as command arguments end up in shell history and process lists,
 * so a key argument must be a path to a key file.
 */
export function assertPrivateKeyFileArg(keyArg: string): void {
  if (isExistingFile(keyArg)) {
    return;
  }
  if (looksLikeRawPrivateKey(keyArg)) {
    throw new Error(
      "A raw private key is not accepted as an argument. Pass a path to a private key file instead."
    );
  }
  throw new Error(`Private key file not found: ${keyArg}. Pass a path to a private key file.`);
}

// Accepts a path to a key file, or a raw key from sources that are not command arguments
// (environment variable, prompt, default key file contents).
export async function parseStringOrFileKey(stringOrPath: string): Promise<string> {
  if (isExistingFile(stringOrPath)) {
    try {
      const keyFromFile = (await readFile(stringOrPath, { encoding: "utf-8" })).trim();
      signatures.normalizePrivateKey(keyFromFile);
      return keyFromFile;
    } catch (e) {
      throw new Error(`Failed to parse private key from file: ${stringOrPath}.`);
    }
  }

  try {
    signatures.normalizePrivateKey(stringOrPath);
    return stringOrPath;
  } catch (e) {
    throw new Error("Failed to parse private key.");
  }
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

export function getPathFileName(inputPath: string): string {
  const trimmed = inputPath.trim().replace(/[\\/]+$/, "");
  const name = trimmed.split(/[\\/]/).pop() ?? "";
  if (!name || name === "." || name === "..") {
    throw new Error(`Cannot derive a project name from path "${inputPath}".`);
  }
  return name;
}
