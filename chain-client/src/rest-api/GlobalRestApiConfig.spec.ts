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
import { globalRestApiConfig } from "./GlobalRestApiConfig";

describe("getContractApi", () => {
  it("throws when contract metadata is missing", () => {
    const params = { channel: "missing", chaincode: "assets", contract: "Unknown" };

    expect(() => globalRestApiConfig.getContractApi(params)).toThrow(
      "Cannot find contract API for key missing|assets|Unknown"
    );
  });
});
