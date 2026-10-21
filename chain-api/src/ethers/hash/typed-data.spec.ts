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
import { TypedDataEncoder } from "./typed-data";

describe("TypedDataEncoder type graph", () => {
  it("keeps shared descendants on every parent", () => {
    const encoder = TypedDataEncoder.from({
      Root: [
        { name: "a", type: "A" },
        { name: "b", type: "B" }
      ],
      A: [{ name: "c", type: "C" }],
      B: [{ name: "c", type: "C" }],
      C: [{ name: "v", type: "string" }]
    });

    expect(encoder.encodeType("A")).toContain("C(string v)");
    expect(encoder.encodeType("B")).toContain("C(string v)");
    expect(encoder.encodeType("Root")).toContain("C(string v)");
  });

  it("still rejects a type that references itself through a descendant", () => {
    expect(() =>
      TypedDataEncoder.from({
        Root: [{ name: "a", type: "A" }],
        A: [{ name: "b", type: "B" }],
        B: [{ name: "a", type: "A" }]
      })
    ).toThrow(/circular type reference/);
  });

  it("walks a shared type graph once per type", () => {
    const levels = 30;
    const types: Record<string, Array<{ name: string; type: string }>> = {
      Root: [
        { name: "a", type: "A1" },
        { name: "b", type: "B1" }
      ]
    };

    for (let i = 1; i < levels; i++) {
      types[`A${i}`] = [
        { name: "a", type: `A${i + 1}` },
        { name: "b", type: `B${i + 1}` }
      ];
      types[`B${i}`] = [
        { name: "a", type: `A${i + 1}` },
        { name: "b", type: `B${i + 1}` }
      ];
    }
    types[`A${levels}`] = [{ name: "v", type: "string" }];
    types[`B${levels}`] = [{ name: "v", type: "string" }];

    const started = Date.now();
    const encoder = TypedDataEncoder.from(types);
    expect(Date.now() - started).toBeLessThan(1000);
    expect(encoder.primaryType).toBe("Root");
    expect(encoder.encodeType("B1")).toContain(`B${levels}(string v)`);
  });
});
