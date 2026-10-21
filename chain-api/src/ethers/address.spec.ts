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
import { getAddress } from "./address";
import { TypedDataEncoder } from "./hash/typed-data";

describe("getAddress", () => {
  it("checksums an address from a 0x-prefixed digest", () => {
    const address = "0x8ba1f109551bd432803012645ac136ddd64dba72";
    const checksum = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";

    expect(getAddress(address)).toBe(checksum);
    expect(getAddress(checksum)).toBe(checksum);
  });

  it("encodes an address field and verifyingContract", () => {
    const address = "0x8ba1f109551bd432803012645ac136ddd64dba72";
    const encoded = TypedDataEncoder.encode(
      { name: "GalaChain", verifyingContract: address },
      { Mail: [{ name: "to", type: "address" }] },
      { to: address }
    );

    expect(encoded).toMatch(/^0x[0-9a-f]+$/);
  });

  it("encodes a fractional number declared as a string", () => {
    const types = { Fee: [{ name: "burnPercentage", type: "string" }] };
    const domain = { name: "GalaChain" };

    expect(TypedDataEncoder.encode(domain, types, { burnPercentage: 0.9 })).toBe(
      TypedDataEncoder.encode(domain, types, { burnPercentage: "0.9" })
    );
  });
});
