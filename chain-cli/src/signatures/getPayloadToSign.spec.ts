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
import { getPayloadToSign } from "./getPayloadToSign";

describe("getPayloadToSign", () => {
  it("rejects a bare 0x signing prefix", () => {
    expect(() => getPayloadToSign({ a: 1, prefix: "0x" })).toThrow(/Invalid hexadecimal signing prefix/);
  });

  it("keeps the serialized body when the prefix is hex", () => {
    const withA = getPayloadToSign({ a: 1, prefix: "0xabcd" });
    const withB = getPayloadToSign({ b: 2, prefix: "0xabcd" });

    expect(withA.subarray(0, 2)).toEqual(Buffer.from("abcd", "hex"));
    expect(withA.subarray(2).toString("utf8")).toContain('"a":1');
    expect(withB.subarray(2).toString("utf8")).toContain('"b":2');
    expect(withA.equals(withB)).toBe(false);
  });
});
