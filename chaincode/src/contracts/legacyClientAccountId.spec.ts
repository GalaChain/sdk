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
import { Context } from "fabric-contract-api";

import { legacyClientAccountId } from "./legacyClientAccountId";

describe("legacyClientAccountId", () => {
  let ctx: Context;

  beforeEach(() => {
    ctx = new Context();
    ctx.clientIdentity = {
      getID: jest
        .fn()
        .mockReturnValue(
          "x509::/OU=org/CN=name::/C=US/ST=California/L=San Francisco/O=curator.local/CN=ca.curator.local"
        ),
      assertAttributeValue: jest.fn(),
      getAttributeValue: jest.fn(),
      getIDBytes: jest.fn(),
      getMSPID: jest.fn()
    };
  });

  test("should return the legacy client account ID", () => {
    const result = legacyClientAccountId(ctx);
    expect(result).toBe("org|name");
  });

  test("should throw an error for invalid client account ID format", () => {
    ctx.clientIdentity = {
      getID: jest
        .fn()
        .mockReturnValue("x509::/OU=/CN=::/C=US/ST=/L=San Francisco/O=curator.local/CN=ca.curator.local"),
      assertAttributeValue: jest.fn(),
      getAttributeValue: jest.fn(),
      getIDBytes: jest.fn(),
      getMSPID: jest.fn()
    };
    expect(() => legacyClientAccountId(ctx)).toThrow("Invalid client account ID format");
  });
});
