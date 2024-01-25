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
import fs from "fs/promises";

import { getPathFileName, parseJsonFromStringOrFile } from "../src/utils";

describe("parseJsonFromStringOrFile", () => {
  it("should parse JSON string", async () => {
    // Given
    const jsonString = `{"maxSupply": "50000000000"}`;

    // When
    const parsed = await parseJsonFromStringOrFile(jsonString);

    // Then
    expect(parsed).toEqual({ maxSupply: "50000000000" });
  });

  it("should fail when parse JSON string", async () => {
    // Given
    const jsonString = `{"maxSupply": "50000000000", invalid json file ** }}} }`;

    // When
    try {
      await parseJsonFromStringOrFile(jsonString);
    } catch (e: any) {
      expect(e.message).toContain("string passed to --data flag failed to parse as valid JSON.");
      expect(e.message).toContain(
        "No valid JSON value found at filepath provided. Provided either a JSON.parse()-able string or file path to a valid JSON object."
      );
    }
  });

  it("should parse JSON file", async () => {
    // Given
    const filePath = "./test.json";
    const jsonString = `{"maxSupply": "50000000000"}`;
    await fs.writeFile(filePath, jsonString);

    // When
    const parsed = await parseJsonFromStringOrFile(filePath);

    // Then
    expect(parsed).toEqual({ maxSupply: "50000000000" });

    await fs.unlink(filePath);
  });

  it("should fail when parse JSON file", async () => {
    // Given
    const filePath = "./test.json";
    const jsonString = `{"maxSupply": "50000000000", invalid json file ** }}} }`;
    await fs.writeFile(filePath, jsonString);

    // When
    try {
      await parseJsonFromStringOrFile(filePath);
    } catch (e: any) {
      expect(e.message).toContain("string passed to --data flag failed to parse as valid JSON.");
      expect(e.message).toContain(
        "No valid JSON value found at filepath provided. Provided either a JSON.parse()-able string or file path to a valid JSON object."
      );
    }

    await fs.unlink(filePath);
  });
});

describe("getPathFileName", () => {
  it("should return the file name when given a path with a slash", () => {
    // Given
    const path = "/home/user/documents/file.txt";

    // When
    const result = getPathFileName(path);

    // Then
    expect(result).toEqual("file.txt");
  });

  it("should return the file name when given a path with a backslash", () => {
    // Given
    const path = "C:\\Users\\User\\Documents\\file.txt";

    // When
    const result = getPathFileName(path);

    // Then
    expect(result).toEqual("file.txt");
  });

  it("should return the file name when given a path without slashes or backslashes", () => {
    // Given
    const path = "file.txt";

    // When
    const result = getPathFileName(path);

    // Then
    expect(result).toEqual("file.txt");
  });
});
