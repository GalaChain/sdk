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
import { writeFile } from "fs/promises";
import path from "path";

import signatures from "../../signatures";
import DtoSign from "./index";

jest.mock("fs/promises", () => ({
  writeFile: jest.fn()
}));

jest.setTimeout(10000);

const dataTestJson = `{
  "tokenClass": {
    "collection": "CLITest",
    "category": "Currency",
    "type": "TEST",
    "additionalKey": "none"
  }
}`;

const fakePrivateKey = "45f2db331d77c0154c70be06d7d9fe00fa2b5471872f134d73a6e43c6b7e3d29";
const mockParseJsonFromStringOrFile = jest.fn(
  (): Promise<Record<string, unknown>> => Promise.resolve({ dataTestJson })
);

jest.mock("../../utils", () => ({
  ...jest.requireActual("../../utils"),
  parseStringOrFileKey: () => Promise.resolve(fakePrivateKey),
  parseJsonFromStringOrFile: () => mockParseJsonFromStringOrFile()
}));

describe("DtoSign Command", () => {
  it("it should check signature field in the response", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    const target = path.resolve(__dirname, "./test-key");

    // When
    await DtoSign.run([target, dataTestJson]);

    // Then
    expect(result.join()).toContain(`tokenClass`);
    expect(result.join()).toContain(`signature`);
  });

  it("it should check DER signature field in the response", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    const target = path.resolve(__dirname, "./test-key");

    // When
    await DtoSign.run([target, dataTestJson, "-d"]);

    // Then
    expect(result.join()).toContain(`tokenClass`);
    expect(result.join()).toContain(`signature`);
    expect(result.join()).toContain(signatures.getPublicKey(fakePrivateKey));
  });

  it("keeps an existing signer address on a DER signature", async () => {
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });
    mockParseJsonFromStringOrFile.mockResolvedValueOnce({
      tokenClass: { collection: "CLITest" },
      signerAddress: "eth|0xabc"
    });

    await DtoSign.run([path.resolve(__dirname, "./test-key"), dataTestJson, "-d"]);

    const output = result.join("");
    expect(output).toContain("eth|0xabc");
    expect(output).not.toContain("signerPublicKey");
  });

  it("fails when the output file cannot be written", async () => {
    jest.mocked(writeFile).mockRejectedValueOnce(new Error("disk full"));

    await expect(
      DtoSign.run([path.resolve(__dirname, "./test-key"), dataTestJson, "-o", "signed.json"])
    ).rejects.toThrow(/Failed to writeFile to signed.json/);
  });

  it("it should return only the signature", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    const target = path.resolve(__dirname, "./test-key");

    // When
    await DtoSign.run([target, dataTestJson, "-s"]);

    // Then
    expect(result.join()).toContain(
      `4Q1j8HZWfKDL0xqqVB6O0qX965NPQ06RYixjjI6n9j5CaQ3jIW0bsDCD6ultCW4DsZpDjrYBhH5HWanGEg93ixs=`
    );
  });
});
