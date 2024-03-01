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

import { ContractAPI } from "@gala-chain/api";

import { ContractConfig } from "../generic";

export interface RestApiAdminCredentials {
  adminKey: string;
  adminSecret: string;
}

interface ContractApiValue {
  contractPath: string;
  api: ContractAPI;
}

export type SetContractApiParams = ContractApiValue & ContractConfig;

export class GlobalRestApiConfig {
  private isRestApiInitializedAndHealthy: Record<string, true | Error> = {};
  private contractApis: Record<string, ContractApiValue> = {};
  private authorizedFabloRest: Record<string, string> = {};

  public isHealthy(apiUrl: string) {
    const result = this.isRestApiInitializedAndHealthy[apiUrl];

    if (result === true) {
      return true;
    }

    if (result === undefined) {
      return false;
    }

    throw new Error(`Failed to initialize Rest API at ${apiUrl} failed to initialize: ${result?.message}`);
  }

  public markHealthy(apiUrl: string) {
    this.isRestApiInitializedAndHealthy[apiUrl] = true;
  }

  public markUnhealthy(apiUrl: string, error: Error) {
    this.isRestApiInitializedAndHealthy[apiUrl] = error;
  }

  public setContractApi(params: SetContractApiParams) {
    const key = `${params.channelName}|${params.chaincodeName}|${params.contractName}`;
    this.contractApis[key] = { contractPath: params.contractPath, api: params.api };
  }

  public getContractApi(params: { channelName: string; chaincodeName: string; contractName: string }) {
    const key = `${params.channelName}|${params.chaincodeName}|${params.contractName}`;
    return (
      this.contractApis[key] ??
      (() => {
        throw new Error(`Cannot find contract API for key ${key}`);
      })
    );
  }

  public setAuthorizedFabloRest(apiUrl: string, token: string) {
    this.authorizedFabloRest[apiUrl] = token;
  }

  public getAuthorizedFabloRest(apiUrl: string): string | undefined {
    return this.authorizedFabloRest[apiUrl];
  }
}

export const globalRestApiConfig = new GlobalRestApiConfig();
