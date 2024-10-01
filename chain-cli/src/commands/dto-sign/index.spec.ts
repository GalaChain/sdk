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
import path from "path";

import DtoSign from "./index";

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

jest.mock("../../utils", () => ({
  ...jest.requireActual("../../utils"),
  parseStringOrFileKey: () => Promise.resolve(fakePrivateKey),
  parseJsonFromStringOrFile: () => Promise.resolve({ dataTestJson })
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
