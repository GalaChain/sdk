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
import DtoVerify from "./index";

jest.setTimeout(30000);

const dataTestJson = `{
  "firstName": "Tom",
  "id": "1",
  "lastName": "Cruise",
  "photo": "https://jsonformatter.org/img/tom-cruise.jpg",
  "signature": "N9aRUvGUedrnOrZch0o0bHUyHHXIUDvV6xOhKsja7j63/eyWDoilWW35iTXFXFQ8uSP3mejoRS4NkVVcd13xchs="
}`;

const fakePublicKey =
  "04692dd79bfded81ec75994eee9b50c9aac299272df3ca21fd4661028094ce6b3fe07c1abc10c8188ae62b120508f8aacbdff150a1910248c9bf49d4b730ad5813";

const mockParseJsonFromStringOrFile = jest.fn();
const mockReadPublicKeyFromFile = jest.fn();

jest.mock("../../utils", () => ({
  ...jest.requireActual("../../utils"),
  // see: https://jestjs.io/docs/es6-class-mocks#calling-jestmock-with-the-module-factory-parameter
  parseJsonFromStringOrFile: () => mockParseJsonFromStringOrFile(),
  readPublicKeyFromFile: () => mockReadPublicKeyFromFile()
}));

describe("DtoVerify Command", () => {
  it("it should validate the signature", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    mockReadPublicKeyFromFile.mockResolvedValue(Promise.resolve(fakePublicKey));
    mockParseJsonFromStringOrFile.mockResolvedValue(Promise.resolve(JSON.parse(dataTestJson)));

    // When
    await DtoVerify.run(["./test-key", dataTestJson]);

    // Then
    expect(result.join()).toContain("Signature is valid.");
  });

  it("it should fail when not found the signature", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    mockReadPublicKeyFromFile.mockRejectedValue(new Error("Failed to read public key from file"));

    // When
    const op = DtoVerify.run(["./test-key", dataTestJson]);

    // Then
    await expect(op).rejects.toThrow("Failed to read public key from file");
  });

  it("it should validate the signature field", async () => {
    // Given
    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    mockReadPublicKeyFromFile.mockResolvedValue(fakePublicKey);

    let jsonModified = JSON.parse(dataTestJson);
    delete jsonModified.signature;
    jsonModified = JSON.stringify(jsonModified);

    mockParseJsonFromStringOrFile.mockResolvedValue(JSON.parse(jsonModified));

    // When
    const op = DtoVerify.run(["./test-key", jsonModified]);

    // Then
    await expect(op).rejects.toThrow("Signature is not present in the DTO.");
  });
});
