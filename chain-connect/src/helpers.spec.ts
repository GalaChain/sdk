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
import { signatures } from "@gala-chain/api";
import { Wallet } from "ethers";

import { calculatePersonalSignPrefix, recoverPublicKeyFromPersonalSign } from "./helpers";

describe("calculatePersonalSignPrefix", () => {
  it.each([
    [{ message: "Hello, Ethereum!" }],
    [
      {
        message: "This is a longer message that will cause the length of the prefix to change when updated"
      }
    ],
    [{}],
    [{ value: 12345 }],
    [{ data: { key: "value", array: [1, 2, 3] } }],
    [{ message: "x".repeat(1000) }]
  ])("uses the byte length of the personal-sign message", (payload) => {
    const message = signatures.personalSignMessage(payload);
    const prefix = calculatePersonalSignPrefix(payload);

    expect(prefix).toBe("\u0019Ethereum Signed Message:\n" + Buffer.byteLength(message, "utf8"));
  });

  it("ignores typed-data metadata", () => {
    const payload = { quantity: "1" };
    const withMetadata = {
      ...payload,
      domain: { name: "GalaChain" },
      types: { TransferToken: [{ name: "quantity", type: "string" }] }
    };

    expect(calculatePersonalSignPrefix(withMetadata)).toBe(calculatePersonalSignPrefix(payload));
  });
});

describe("recoverPublicKeyFromPersonalSign", () => {
  it("recovers the signer public key and address from a personal sign", async () => {
    const wallet = new Wallet("0x3b19099e96dccf44e1dfc13c89c7e490d902a96b0791faf185e194ae0e71786d");

    const result = await recoverPublicKeyFromPersonalSign("I <3 GalaChain", (message) =>
      wallet.signMessage(message)
    );

    expect(result.recoveredAddress).toEqual(wallet.address);
    expect(result.publicKey.startsWith("0x04")).toBe(true);
  });
});
