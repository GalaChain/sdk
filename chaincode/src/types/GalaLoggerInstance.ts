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
import { IContextDetails, ILoggerCommons, IProcessDetails, ITimeLogData } from "@gala-chain/api";
import { Context } from "fabric-contract-api";
import { nanoid } from "nanoid";
import os from "os";
import { hrtime } from "process";
import * as winston from "winston";
import { Logger } from "winston";

import { GalaChainContext } from ".";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require("fabric-contract-api/lib/logger") as {
  setLevel: (level: string) => void;
  getLogger: (name?: string) => Logger;
};

const print = winston.format.printf((param: winston.Logform.TransformableInfo) => {
  const { level, message } = param;
  const timestamp = param.timestamp as string;
  const context = param.context as string;
  const stack = param.stack as string[] | undefined;

  // If an error and has a stack trace
  if (stack instanceof Array && stack.length) {
    return `${timestamp} ${level} [${context}] ${stack[0]}`;
  }

  return `${timestamp} ${level} [${context}] ${message}`;
});

const readableFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.align(),
  print
);

export function createReadableLogger(logLevel = "info"): winston.LoggerOptions {
  return {
    level: logLevel,
    format: readableFormat,
    transports: [new winston.transports.Console()]
  };
}

export function createJsonLogger(logLevel = "warn"): winston.LoggerOptions {
  return {
    level: logLevel,
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
    exceptionHandlers: [new winston.transports.Console()],
    rejectionHandlers: [new winston.transports.Console()],
    handleExceptions: true,
    handleRejections: true
  };
}

function determineLogLevel(): string {
  const LOG_LEVEL = process.env?.LOG_LEVEL?.toLowerCase();

  const logLevels = ["error", "warn", "info", "verbose", "debug"];

  if (typeof LOG_LEVEL === "string" && logLevels.includes(LOG_LEVEL)) {
    return LOG_LEVEL;
  }

  return "debug";
}

export function winstonConfig(): winston.LoggerOptions {
  const { JSON_LOGS } = process.env;
  const LOG_LEVEL: string = determineLogLevel();

  let logger: winston.LoggerOptions;

  if (JSON_LOGS?.toLowerCase() === "true") {
    logger = createJsonLogger(LOG_LEVEL);
  } else {
    logger = createReadableLogger(LOG_LEVEL);
  }

  return logger;
}

export const createLoggerInstance = (ctx: Context): Logger =>
  logger.getLogger(ctx.stub.getFunctionAndParameters().fcn);

export interface GalaLoggerInstance {
  getLogger(name?: string): Logger;
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  log(
    level: "debug" | "info" | "warn" | "error",
    msg: string | (Record<string, unknown> & { message: string })
  ): void;
  logTimeline(timelineActionDescription: string, context: string, metaData?: unknown[], error?: Error): void;
}

export class GalaLoggerInstanceImpl implements GalaLoggerInstance {
  public instance: Logger;
  private readonly prefix: string;
  private readonly ctx: GalaChainContext;

  private readonly uniqueId: string = nanoid();
  private readonly createdAt: bigint = hrtime.bigint();

  constructor(ctx: GalaChainContext) {
    this.ctx = ctx;
    this.instance = createLoggerInstance(ctx);
    this.instance.configure(winstonConfig());

    const channelId = ctx.stub.getChannelID();
    const shortTxId = ctx.stub.getTxID().substring(0, 8);
    this.prefix = `[${channelId}-${shortTxId}]`;
  }

  private get commonProcess(): IProcessDetails {
    return {
      host: os.hostname(),
      uptime: this.uptime,
      loadAvg: os.loadavg()
    };
  }

  private get commonContext(): IContextDetails {
    const fcn = this.ctx?.stub?.getFunctionAndParameters?.();
    return {
      uniqueId: this.uniqueId,
      channelId: this.ctx.stub?.getChannelID(),
      creator: this.ctx.stub?.getCreator()?.mspid,
      txId: this.ctx?.stub?.getTxID(),
      chaincode: fcn?.fcn,
      parameters: fcn?.params,
      createdAt: this.createdAtDate
    };
  }

  private get commonMeta(): ILoggerCommons {
    return {
      context: this.commonContext,
      process: this.commonProcess
    };
  }

  private get timeElapsed(): string {
    const elapsed = this.getElapsedNanos();
    return `${elapsed / BigInt(1e6)}ms`;
  }

  private get uptime(): string {
    return `${(process.hrtime.bigint() / BigInt(1e9))?.toString()}s`;
  }

  private get createdAtDate(): Date {
    return new Date(Date.parse((this.createdAt / BigInt(1e6)).toString()));
  }

  setLevel(level: string): void {
    logger.setLevel(level);
  }

  getLogger(name?: string): Logger {
    return logger.getLogger(name);
  }

  error(message: string) {
    this.log("error", message);
  }

  warn(message: string) {
    this.log("warn", message);
  }

  info(message: string) {
    this.log("info", message);
  }

  debug(message: string) {
    this.log("debug", message);
  }

  log(
    level: "debug" | "info" | "warn" | "error",
    msg: string | (Record<string, unknown> & { message: string })
  ) {
    const timestamp = Date.now();
    const record =
      typeof msg === "string"
        ? { timestamp, level, message: `${this.prefix} ${msg}` }
        : { timestamp, ...msg, level, message: msg["message"] };

    this.instance.log(record);
  }

  getElapsedNanos(): bigint {
    return hrtime.bigint() - this.createdAt;
  }

  logTimeline(
    timelineActionDescription: string,
    context: string,
    metaData?: unknown[],
    error: Error | null = null
  ): void {
    const args: ITimeLogData = {
      description: timelineActionDescription,
      requestId: this.uniqueId,
      elapsed: `${this.timeElapsed}`,
      method: [this.ctx?.stub?.getChannelID(), this.ctx?.stub?.getFunctionAndParameters?.().fcn].join(":")
    };

    // special case for cron call to prevent bloated logs
    const isContractAPIRequest = this.ctx?.stub?.getFunctionAndParameters()?.fcn.endsWith("GetContractAPI");
    if (!isContractAPIRequest) {
      args.metaData = metaData;
      args.info = this.commonMeta;
    }

    const level = error ? "error" : "info";

    const logData = {
      timestamp: Date.now(),
      context,
      message: JSON.stringify(args),
      stack: error?.stack
    };

    this.log(level, logData);
  }
}
