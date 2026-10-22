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
import axios from "axios";
import { PassThrough } from "stream";

import { BadRequestError, UnauthorizedError } from "./errors";
import { getLogs, streamLogs } from "./galachain-utils";

jest.mock("axios", () => {
  const get = jest.fn();
  const isAxiosError = (error: unknown) =>
    Boolean(error && typeof error === "object" && (error as { isAxiosError?: boolean }).isAxiosError);
  return {
    __esModule: true,
    default: { get, isAxiosError },
    isAxiosError
  };
});

const privateKey = "45f2db331d77c0154c70be06d7d9fe00fa2b5471872f134d73a6e43c6b7e3d29";

function httpError(status: number, message: string) {
  return {
    isAxiosError: true,
    message: "Request failed",
    response: { status, data: { message } }
  };
}

describe("log requests", () => {
  it("keeps HTTP status classification", async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(httpError(403, "no"));
    await expect(getLogs({ privateKey })).rejects.toBeInstanceOf(UnauthorizedError);

    (axios.get as jest.Mock).mockRejectedValueOnce(httpError(400, "bad"));
    await expect(getLogs({ privateKey })).rejects.toBeInstanceOf(BadRequestError);
  });

  it("stays pending until the stream ends and rejects stream errors", async () => {
    let resolveGet: (value: unknown) => void = () => undefined;
    const getCalled = new Promise<void>((resolve) => {
      (axios.get as jest.Mock).mockImplementation(
        () =>
          new Promise((resolveResponse) => {
            resolveGet = resolveResponse;
            resolve();
          })
      );
    });

    let settled = false;
    const pending = streamLogs({ privateKey }, () => undefined).finally(() => {
      settled = true;
    });
    await getCalled;
    const stream = new PassThrough();
    resolveGet({ data: stream });
    await new Promise((resolve) => setImmediate(resolve));
    expect(settled).toBe(false);

    stream.end();
    await pending;
    expect(settled).toBe(true);

    const failing = new PassThrough();
    let resolveFailing: (value: unknown) => void = () => undefined;
    const failingCalled = new Promise<void>((resolve) => {
      (axios.get as jest.Mock).mockImplementation(
        () =>
          new Promise((resolveResponse) => {
            resolveFailing = resolveResponse;
            resolve();
          })
      );
    });
    const rejected = streamLogs({ privateKey }, () => undefined);
    await failingCalled;
    resolveFailing({ data: failing });
    await new Promise((resolve) => setImmediate(resolve));
    failing.emit("error", new Error("broken stream"));
    await expect(rejected).rejects.toThrow(/broken stream/);
  });
});
