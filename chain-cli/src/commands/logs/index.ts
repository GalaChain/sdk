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
import { Flags } from "@oclif/core";

import chalk from "chalk";

import BaseCommand from "../../base-command";
import { BadRequestError, FetchLogsError, UnauthorizedError } from "../../errors";
import { LogEntry, getLogs, getPrivateKey, streamLogs } from "../../galachain-utils";

interface LogQueryParams {
  privateKey: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  filter?: string;
}

interface SSEEvent {
  id: string;
  event: string;
  data: string;
}

const VALID_FILTERS = ["info", "warn", "debug", "error"];

export default class Log extends BaseCommand<typeof Log> {
  static override flags = {
    developerPrivateKey: Flags.string({
      char: "k",
      description:
        "Private key to sign the data. It can be a file path or a key string. " +
        "If not provided, the private key will be read from the environment variable DEV_PRIVATE_KEY.",
      required: false
    }),
    startTime: Flags.string({
      char: "s",
      description:
        "Start time for logs. Accepts ISO8601 format or shorthand (e.g., 2023-01-01T00:00:00Z, 5m, 1h, 2d).",
      required: false
    }),
    endTime: Flags.string({
      char: "e",
      description: "End time for logs. Accepts ISO8601 format or shorthand (e.g., now, 0).",
      default: "now",
      required: false
    }),
    limit: Flags.integer({
      char: "l",
      description: "Maximum number of log entries to fetch.",
      required: false
    }),
    filter: Flags.string({
      char: "f",
      description: "Filter for logs (e.g., error, info, warn, debug).",
      required: false
    }),
    follow: Flags.boolean({
      description: "Specify if logs should be streamed.",
      default: false
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Log);

    if (flags.filter && !VALID_FILTERS.includes(flags.filter.toLowerCase())) {
      this.error(
        chalk.red(`Invalid filter '${flags.filter}'. Valid filters are: ${VALID_FILTERS.join(", ")}.`),
        { exit: 1 }
      );
    }

    const developerPrivateKey = await getPrivateKey(flags.developerPrivateKey);

    const commonParams: LogQueryParams = {
      privateKey: developerPrivateKey,
      filter: flags.filter
    };

    try {
      if (flags.follow) {
        await this.streamLogs(commonParams);
      } else {
        const params = {
          ...commonParams,
          startTime: flags.startTime ? this.parseTime(flags.startTime) : undefined,
          endTime: flags.endTime ? this.parseTime(flags.endTime) : undefined,
          limit: flags.limit
        };

        await this.fetchLogs(params);
      }
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  async fetchLogs(params: LogQueryParams): Promise<void> {
    try {
      const logs = await getLogs(params);

      if (!Array.isArray(logs) || logs.length === 0) {
        let suggestion = "No logs found.";
        if (params.filter) {
          suggestion += ` Ensure that the filter '${
            params.filter
          }' is correct. Valid filters are: ${VALID_FILTERS.join(", ")}.`;
        }
        suggestion +=
          " You can also try specifying a different time range with the --startTime and --endTime flags.";
        this.log(chalk.yellow(suggestion));
        return;
      }

      for (const logEntry of logs) {
        this.printLog(logEntry);
      }
    } catch (error: any) {
      throw new FetchLogsError(error.message);
    }
  }

  async streamLogs(params: LogQueryParams): Promise<void> {
    try {
      let buffer = "";
      await streamLogs(params, (data) => {
        buffer += data;

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        events.forEach((eventBlock) => {
          this.handleSSEEvent(eventBlock);
        });
      });
    } catch (error: any) {
      throw new FetchLogsError(error.message);
    }
  }

  handleSSEEvent(eventBlock: string) {
    const event: SSEEvent = this.parseSSEEvent(eventBlock);

    if (event.event === "error") {
      throw new FetchLogsError(event.data);
    } else {
      this.handleStreamedLog(event.data);
    }
  }

  parseSSEEvent(eventBlock: string): SSEEvent {
    const lines = eventBlock.split("\n");
    let eventType = "message";
    let data = "";
    let id = "";

    lines.forEach((line) => {
      if (line.startsWith("event:")) {
        eventType = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice("data:".length).trim();
      } else if (line.startsWith("id:")) {
        id = line.slice("id:".length).trim();
      }
    });

    return { event: eventType, data, id };
  }

  handleStreamedLog(data: string) {
    try {
      const logEntry: LogEntry = JSON.parse(data);
      this.printLog(logEntry);
    } catch {
      this.log(data);
    }
  }

  printLog(logEntry: LogEntry) {
    const { message, timestamp, status } = logEntry;

    let levelColor: chalk.Chalk = chalk.white;
    const levelPadded = (status || "info").toUpperCase().padEnd(5);

    switch (status.toLowerCase()) {
      case "info":
        levelColor = chalk.green;
        break;
      case "warn":
        levelColor = chalk.yellow;
        break;
      case "error":
        levelColor = chalk.red;
        break;
      case "debug":
        levelColor = chalk.blue;
        break;
      default:
        levelColor = chalk.white;
    }

    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3
    });

    this.log(`${chalk.gray(formattedTime)} ${levelColor(levelPadded)} ${message}`);
  }

  parseTime(time: string): string {
    if (time === "now" || time === "0") {
      return new Date().toISOString();
    }

    const shorthandRegex = /^(\d+)([smhd])$/;
    const match = shorthandRegex.exec(time);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];

      const currentTime = new Date();

      switch (unit) {
        case "s":
          currentTime.setSeconds(currentTime.getSeconds() - value);
          break;
        case "m":
          currentTime.setMinutes(currentTime.getMinutes() - value);
          break;
        case "h":
          currentTime.setHours(currentTime.getHours() - value);
          break;
        case "d":
          currentTime.setDate(currentTime.getDate() - value);
          break;
        default:
          throw new BadRequestError(`Invalid time unit: ${unit}`);
      }
      return currentTime.toISOString();
    }

    const date = new Date(time);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    throw new Error(
      `Invalid time input '${time}'. Expected ISO8601 date or shorthand like '5m', '1h', '2d'.`
    );
  }

  handleError(error: any): void {
    if (error instanceof UnauthorizedError) {
      this.error(chalk.red(`Unauthorized: ${error.message}`), { exit: 1 });
    } else if (error instanceof BadRequestError) {
      this.error(chalk.yellow(`Bad Request: ${error.message}`), { exit: 1 });
    } else if (error instanceof FetchLogsError) {
      this.error(chalk.red(`Failed to fetch logs: ${error.message}`), { exit: 1 });
    } else {
      this.error(chalk.red(`An unexpected error occurred: ${error.message}`), { exit: 1 });
    }
  }
}
