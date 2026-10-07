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

import { consts } from "./__test__/data";
import { getDeploymentResponse, streamLogs } from "./galachain-utils";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("service portal requests", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it("bounds a deployment status request", async () => {
    mockedAxios.get.mockResolvedValue({ data: { status: "CC_DEPLOYED" } });

    await getDeploymentResponse({
      privateKey: consts.developerPrivateKey,
      chaincodeName: consts.chaincodeName
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ timeout: 30_000 })
    );
  });

  it("bounds only the start of a log stream", async () => {
    jest.useFakeTimers();
    mockedAxios.get.mockResolvedValue({
      data: { on: () => undefined }
    });

    await streamLogs({ privateKey: consts.developerPrivateKey }, () => undefined);

    const config = mockedAxios.get.mock.calls[0][1] as { timeout?: number; signal: AbortSignal };
    expect(config.timeout).toBeUndefined();
    expect(config.signal.aborted).toBe(false);

    await jest.advanceTimersByTimeAsync(30_000);
    expect(config.signal.aborted).toBe(false);
  });
});
