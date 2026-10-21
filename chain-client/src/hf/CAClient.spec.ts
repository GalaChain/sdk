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
import { enrollUser } from "./CAClient";

describe("pending enrollment ids", () => {
  it.each(["constructor", "toString", "__proto__"])("enrolls %s as its own user id", async (userId) => {
    const caClient = {
      enroll: jest.fn().mockResolvedValue({
        certificate: "cert",
        key: { toBytes: () => "key-bytes" }
      })
    };
    const wallet = {
      get: jest.fn().mockResolvedValue(undefined),
      put: jest.fn().mockResolvedValue(undefined)
    };

    const identity = await enrollUser(caClient as never, wallet as never, "Org1MSP", userId, "secret");

    expect(caClient.enroll).toHaveBeenCalledWith({ enrollmentID: userId, enrollmentSecret: "secret" });
    expect(wallet.put).toHaveBeenCalledWith(userId, expect.objectContaining({ type: "X.509" }));
    expect(identity.mspId).toBe("Org1MSP");
  });
});
