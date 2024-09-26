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
import { calculatePersonalSignPrefix } from "./helpers";

describe("calculatePersonalSignPrefix", () => {
  it("should return the correct prefix for a simple payload", () => {
    const payload = { message: "Hello, Ethereum!" };

    const prefix = calculatePersonalSignPrefix(payload);

    const expectedPrefix = "\u0019Ethereum Signed Message:\n76";

    expect(prefix).toBe(expectedPrefix);
  });

  it("should handle payloads requiring multiple iterations", () => {
    const payload = {
      message: "This is a longer message that will cause the length of the prefix to change when updated"
    };

    const prefix = calculatePersonalSignPrefix(payload);

    const expectedPrefix = "\u0019Ethereum Signed Message:\n149";

    expect(prefix).toBe(expectedPrefix);
  });

  it("should handle an empty payload", () => {
    const payload = {};

    const prefix = calculatePersonalSignPrefix(payload);

    const expectedPrefix = "\u0019Ethereum Signed Message:\n47";

    expect(prefix).toBe(expectedPrefix);
  });

  it("should handle payloads with numeric values", () => {
    const payload = { value: 12345 };

    const prefix = calculatePersonalSignPrefix(payload);

    const expectedPrefix = "\u0019Ethereum Signed Message:\n61";

    expect(prefix).toBe(expectedPrefix);
  });

  it("should handle payloads with nested objects", () => {
    const payload = { data: { key: "value", array: [1, 2, 3] } };

    const prefix = calculatePersonalSignPrefix(payload);

    const expectedPrefix = "\u0019Ethereum Signed Message:\n86";

    expect(prefix).toBe(expectedPrefix);
  });

  it("should handle payloads that increase the length of the length string", () => {
    const payload = { message: "x".repeat(1000) };

    const prefix = calculatePersonalSignPrefix(payload);

    const expectedPrefix = "\u0019Ethereum Signed Message:\n1062";

    expect(prefix).toBe(expectedPrefix);
  });
});
