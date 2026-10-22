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
import { GalaChainResponseError } from "./galaChain";

describe("GalaChainResponseError", () => {
  it("is an Error and keeps a string error key", () => {
    const error = new GalaChainResponseError({
      error: "Bad Request",
      message: "nope",
      statusCode: 400
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GalaChainResponseError);
    expect(error.name).toBe("GalaChainResponseError");
    expect(error.message).toBe("nope");
    expect(error.Error).toBe("Bad Request");
  });

  it.each([undefined, null, false, 0])("does not store %p as the error key", (value) => {
    const error = new GalaChainResponseError({
      error: value as never,
      message: "nope"
    });

    expect(error.Error).toBe("UNKNOWN");
    expect(typeof error.Error).toBe("string");
    expect(error.message).toBe("nope");
  });
});
