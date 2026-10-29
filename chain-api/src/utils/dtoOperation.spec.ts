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
import { configuredDtoOperation, withDtoOperation } from "./dtoOperation";

describe("configuredDtoOperation", () => {
  it("joins the channel, chaincode, contract, and method", () => {
    expect(
      configuredDtoOperation(
        { channel: "product-channel", chaincode: "basic-product", contract: "PublicKeyContract" },
        "GetMyProfile"
      )
    ).toBe("product-channel_basic-product_PublicKeyContract:GetMyProfile");
  });

  it("returns undefined when any part is missing", () => {
    expect(
      configuredDtoOperation({ channel: "product-channel", chaincode: "basic-product" }, "GetMyProfile")
    ).toBe(undefined);
  });
});

describe("withDtoOperation", () => {
  it("sets the operation on an unsigned payload", () => {
    expect(
      withDtoOperation({ quantity: "1" }, "asset-channel_basic-asset_GalaChainToken:TransferToken")
    ).toEqual({
      quantity: "1",
      dtoOperation: "asset-channel_basic-asset_GalaChainToken:TransferToken"
    });
  });

  it("keeps an operation that is already set", () => {
    const payload = { dtoOperation: "kept" };
    expect(withDtoOperation(payload, "other")).toBe(payload);
  });

  it("does not add an operation to a signed payload", () => {
    const payload = { signature: "abc" };
    expect(withDtoOperation(payload, "other")).toBe(payload);
  });
});
