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
import { GalaChainResponse, GalaChainResponseType } from "./response";

class Item {
  value?: string;
}

describe("GalaChainResponse.deserialize", () => {
  it("should deserialize success response", () => {
    // When
    const response = GalaChainResponse.deserialize(Item, '{"Status":1,"Data":{"value":"x"}}');

    // Then
    expect(response.Status).toEqual(GalaChainResponseType.Success);
    expect(response.Data).toBeInstanceOf(Item);
    expect(response.Data).toEqual({ value: "x" });
  });

  it("should deserialize success response without data", () => {
    // When
    const response = GalaChainResponse.deserialize(undefined, { Status: 1 });

    // Then
    expect(response).toEqual({ Status: GalaChainResponseType.Success, Data: undefined });
  });

  it("should deserialize error response", () => {
    // When
    const response = GalaChainResponse.deserialize(Item, {
      Status: 0,
      Message: "nope",
      ErrorCode: 404,
      ErrorKey: "NOT_FOUND"
    });

    // Then
    expect(response).toEqual({
      Status: GalaChainResponseType.Error,
      Message: "nope",
      ErrorCode: 404,
      ErrorKey: "NOT_FOUND",
      ErrorPayload: undefined
    });
  });

  it("should fill defaults for error response with missing fields", () => {
    // When
    const response = GalaChainResponse.deserialize(Item, { Status: 0 });

    // Then
    expect(response).toEqual(
      expect.objectContaining({ Status: GalaChainResponseType.Error, ErrorCode: 500, ErrorKey: "UNKNOWN" })
    );
  });

  it.each<[string, string | Record<string, unknown>]>([
    ["empty object", {}],
    ["string status", { Status: "1", Data: { value: "x" } }],
    ["unknown status", { Status: 2, Data: { value: "x" } }],
    ["null", "null"],
    ["array", "[]"],
    ["number", "1"]
  ])("should treat malformed response (%s) as error", (_, input) => {
    // When
    const response = GalaChainResponse.deserialize(Item, input);

    // Then
    expect(GalaChainResponse.isSuccess(response)).toBe(false);
    expect(response).toEqual(
      expect.objectContaining({
        Status: GalaChainResponseType.Error,
        ErrorCode: 500,
        ErrorKey: "INVALID_CHAIN_RESPONSE"
      })
    );
    expect(response.Data).toBeUndefined();
  });
});
