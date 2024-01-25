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

export interface ILoggerCommons {
  context: IContextDetails;
  process: IProcessDetails;
  request?: IRequestDetails;
  response?: IResponseDetails;
}

export interface IContextDetails {
  uniqueId: string;
  createdAt: Date;
  channelId: string;
  chaincode: string;
  parameters: string[];
  txId?: string;
  creator: string;
}

export interface IProcessDetails {
  host: string;
  uptime: string;
  loadAvg: number[];
}

export interface IRequestDetails {
  host: string;
  path: string;
  port: string;
  headers: Record<string, unknown>;
}

export interface IResponseDetails {
  isError: boolean;
  statusCode: number;
  message: string;
  payload: Record<string, unknown>;
}

export interface ITimeLogData {
  description: string;
  requestId: string;
  elapsed: string;
  method: string;
  info?: ILoggerCommons;
  metaData?: unknown[];
}
