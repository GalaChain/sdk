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
import { extractOtelTrace } from "./extractOtelTrace";

describe("extractOtelTrace", () => {
  it("should extract trace from a dto object", () => {
    // Given
    const dto = {
      uniqueKey: "k",
      trace: { traceId: "abc123", spanId: "def456" }
    };

    // When
    const result = extractOtelTrace(dto);

    // Then
    expect(result).toEqual({ traceId: "abc123", spanId: "def456" });
  });

  it("should extract trace from a JSON string dto", () => {
    // Given
    const dto = JSON.stringify({
      trace: { traceId: "abc123", spanId: "def456" }
    });

    // When
    const result = extractOtelTrace(dto);

    // Then
    expect(result).toEqual({ traceId: "abc123", spanId: "def456" });
  });

  it("should ignore invalid all-zero otel context", () => {
    // Given
    const dto = {
      trace: {
        traceId: "00000000000000000000000000000000",
        spanId: "0000000000000000"
      }
    };

    // When & Then
    expect(extractOtelTrace(dto)).toBeUndefined();
  });

  it("should return undefined when trace is missing", () => {
    // When & Then
    expect(extractOtelTrace({ uniqueKey: "k" })).toBeUndefined();
    expect(extractOtelTrace(undefined)).toBeUndefined();
    expect(extractOtelTrace("not-json")).toBeUndefined();
  });
});
