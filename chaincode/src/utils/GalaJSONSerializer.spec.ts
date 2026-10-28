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
import GalaJSONSerializer from "./GalaJSONSerializer";

function schemaFor(items: Record<string, unknown>) {
  return {
    properties: {
      prop: {
        type: "array",
        items
      }
    }
  };
}

describe("GalaJSONSerializer arrays", () => {
  const serializer = new GalaJSONSerializer();

  function read(payload: unknown, items: Record<string, unknown>) {
    return serializer.fromBuffer(Buffer.from(JSON.stringify(payload)), schemaFor(items), "test");
  }

  it("delivers string elements without extra quote marks", () => {
    const result = read(["alice", "bob", 'say "hi"'], { type: "string" });

    expect(result.jsonForValidation).toEqual(["alice", "bob", 'say "hi"']);
    expect(result.value).toEqual(["alice", "bob", 'say "hi"']);
  });

  it("delivers number, boolean, object, and nested string arrays", () => {
    expect(read([1, 2], { type: "number" }).value).toEqual([1, 2]);
    expect(read([true, false], { type: "boolean" }).value).toEqual([true, false]);
    expect(read([{ name: "alice" }], { type: "object" }).value).toEqual([{ name: "alice" }]);
    expect(
      read([["alice"]], {
        type: "array",
        items: { type: "string" }
      }).value
    ).toEqual([["alice"]]);
  });
});
