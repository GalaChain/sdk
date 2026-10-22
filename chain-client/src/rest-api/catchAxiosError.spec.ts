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
import { AxiosError } from "axios";

import { catchAxiosError } from "./catchAxiosError";

describe("catchAxiosError", () => {
  it("rethrows a transport failure", () => {
    const error = new AxiosError("timeout of 1000ms exceeded");

    expect(() => catchAxiosError(error)).toThrow(error);
  });

  it("returns a chain error body when the response status is an error", () => {
    const error = new AxiosError("bad");
    error.response = {
      data: { error: { Status: 0, Message: "nope" } },
      status: 500,
      statusText: "error",
      headers: {},
      config: {} as never
    };

    expect(catchAxiosError(error)).toEqual({ data: { Status: 0, Message: "nope" } });
  });
});
