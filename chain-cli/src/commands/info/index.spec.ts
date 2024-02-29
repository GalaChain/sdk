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
import { ux } from "@oclif/core";

import axios from "axios";

import Info from "../../../src/commands/info";

const fakePrivateKey = "bf2168e0e2238b9d879847987f556a093040a2cab07983a20919ac33103d0d00";

describe("ChainInfo Command", () => {
  it("should check if it gets info from a chaincode", async () => {
    // Given
    axios.get = jest.fn().mockResolvedValue({
      status: 200,
      data: {
        status: "CH_CREATED",
        lastOperationId: "operation-id"
      }
    });

    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    // When
    await Info.run([fakePrivateKey]);

    // Then
    expect(result.join()).toContain(`CH_CREATED`);
    expect(result.join()).toContain(`operation-id`);

    jest.resetAllMocks();
  });
  it("should not find private key and prompt", async () => {
    // Given
    axios.get = jest.fn().mockResolvedValue({
      status: 200,
      data: {
        status: "CH_CREATED",
        lastOperationId: "operation-id"
      }
    });

    const result: (string | Uint8Array)[] = [];
    jest.spyOn(process.stdout, "write").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    jest.spyOn(console, "log").mockImplementation((v) => {
      result.push(v);
      return true;
    });

    process.env = { ...process.env, DEV_PRIVATE_KEY: undefined };

    jest.spyOn(ux, "prompt").mockResolvedValueOnce(fakePrivateKey);

    // When
    await Info.run();

    // Then
    expect(result.join()).toContain("Private key not found");

    jest.resetAllMocks();
  });
});
