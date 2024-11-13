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
import chalk from "chalk";

import { FetchLogsError, UnauthorizedError } from "../../errors";
import { LogEntry } from "../../galachain-utils";
import * as utils from "../../galachain-utils";
import Log from "./index";

jest.mock("../../__mocks__/chalk");
jest.mock("../../galachain-utils");
jest.setTimeout(10000);

const consts = {
  developerPrivateKey: "bf2168e0e2238b9d879847987f556a093040a2cab07983a20919ac33103d0d00"
};

describe("Logs Command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should fetch and print logs with correct coloring based on status", async () => {
    const mockLogs: LogEntry[] = [
      { message: "Info message", timestamp: "2023-11-06T15:19:48.894Z", status: "info" },
      { message: "Warning message", timestamp: "2023-11-06T15:19:48.894Z", status: "warn" },
      { message: "Error message", timestamp: "2023-11-06T15:19:48.894Z", status: "error" },
      { message: "Debug message", timestamp: "2023-11-06T15:19:48.894Z", status: "debug" }
    ];

    jest.spyOn(utils, "getLogs").mockResolvedValue(mockLogs);
    jest.spyOn(utils, "getPrivateKey").mockResolvedValue(consts.developerPrivateKey);

    const logSpy = jest.spyOn(Log.prototype, "log").mockImplementation(() => {});

    await Log.run(["--startTime=1d"]);

    expect(utils.getLogs).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledTimes(mockLogs.length);

    expect(chalk.green).toHaveBeenCalledWith("INFO ");
    expect(chalk.yellow).toHaveBeenCalledWith("WARN ");
    expect(chalk.red).toHaveBeenCalledWith("ERROR");
    expect(chalk.blue).toHaveBeenCalledWith("DEBUG");
  });

  it("should handle UnauthorizedError correctly", async () => {
    const errorMessage = "Unauthorized access";
    jest.spyOn(utils, "getLogs").mockRejectedValue(new UnauthorizedError(errorMessage));
    jest.spyOn(utils, "getPrivateKey").mockResolvedValue(consts.developerPrivateKey);

    await expect(Log.run([])).rejects.toThrow(`Failed to fetch logs: ${errorMessage}`);
  });

  it("should handle FetchLogsError correctly", async () => {
    const errorMessage = "Failed to fetch logs";
    jest.spyOn(utils, "getLogs").mockRejectedValue(new FetchLogsError(errorMessage));
    jest.spyOn(utils, "getPrivateKey").mockResolvedValue(consts.developerPrivateKey);

    await expect(Log.run([])).rejects.toThrow(`Failed to fetch logs: ${errorMessage}`);
  });

  it("should handle invalid time input", async () => {
    jest.spyOn(utils, "getPrivateKey").mockResolvedValue(consts.developerPrivateKey);

    await expect(Log.run(["--startTime=5x"])).rejects.toThrow(
      "Invalid time input '5x'. Expected ISO8601 date or shorthand like '5m', '1h', '2d'."
    );
  });

  it("should handle empty logs gracefully", async () => {
    jest.spyOn(utils, "getPrivateKey").mockResolvedValue(consts.developerPrivateKey);
    jest.spyOn(utils, "getLogs").mockResolvedValue([]);

    const logSpy = jest.spyOn(Log.prototype, "log").mockImplementation(() => {});

    await Log.run([]);

    expect(logSpy).toHaveBeenCalledWith(
      chalk.yellow(
        "No logs found. You can also try specifying a different time range with the --startTime and --endTime flags."
      )
    );

    logSpy.mockRestore();
  });
});
