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

import {
  ChainClient,
  ChainClientBuilder,
  ClassType,
  ContractConfig,
  Inferred,
  Serializable
} from "../generic";
import { GalaChainResponse } from "../wire";
import { FabloRestClient } from "./FabloRestClient";
import {
  RestApiAdminCredentials,
  RestApiStatus,
  SetContractApiParams,
  globalRestApiConfig,
  normalizeRestApiUrl
} from "./GlobalRestApiConfig";
import { RestApiClient } from "./RestApiClient";
import { RestApiConfig } from "./loadRestApiConfig";

const REST_API_INIT_WAIT_MS = 10_000;

export class RestApiClientBuilder extends ChainClientBuilder {
  constructor(
    public readonly restApiUrl: string,
    public readonly orgMsp: string,
    public readonly credentials: RestApiAdminCredentials,
    public readonly restApiConfig: RestApiConfig
  ) {
    super();
  }

  private ensureInitializedRestApi(): Promise<void> {
    const initialization = globalRestApiConfig.initialize(this.restApiUrl, () => this.loadContractApis());
    return waitForInitialization(initialization, this.restApiUrl, REST_API_INIT_WAIT_MS).then(async () => {
      if (globalRestApiConfig.getStatus(this.restApiUrl) === RestApiStatus.INITIALIZED) {
        await this.publishBuilderApis();
      }
    });
  }

  private async loadContractApis(): Promise<void> {
    globalRestApiConfig.setUsesFabloRest(this.restApiUrl, await this.shouldUseFabloRest());
    await this.publishBuilderApis();
  }

  private async publishBuilderApis(): Promise<void> {
    const scope = builderScopeKey(this.restApiUrl, this.orgMsp, this.credentials, this.restApiConfig);
    if (globalRestApiConfig.hasPublishedBuilderScope(scope)) {
      return;
    }

    const apis = globalRestApiConfig.usesFabloRest(this.restApiUrl)
      ? await this.getContractApisFromFabloRest()
      : await this.getContractApisFromGCRestApi();

    for (const api of apis) {
      globalRestApiConfig.setContractApi(this.restApiUrl, api);
    }

    globalRestApiConfig.markBuilderScopePublished(scope);
  }

  private async shouldUseFabloRest(): Promise<boolean> {
    try {
      await axios.get(`${this.restApiUrl}/user/identities`);
      return false;
    } catch (e) {
      return e.response?.status === 400;
    }
  }

  private async getContractApisFromFabloRest(): Promise<SetContractApiParams[]> {
    const token =
      globalRestApiConfig.getAuthorizedFabloRest(this.restApiUrl, this.credentials, this.orgMsp) ??
      (await FabloRestClient.enroll(
        this.restApiUrl,
        this.credentials.adminKey,
        this.credentials.adminSecret
      ));

    globalRestApiConfig.setAuthorizedFabloRest(this.restApiUrl, this.credentials, this.orgMsp, token);

    return await FabloRestClient.getContractApis(token, this.restApiUrl, this.restApiConfig);
  }

  private async getContractApisFromGCRestApi(): Promise<SetContractApiParams[]> {
    return await RestApiClient.getContractApis(this.credentials, this.restApiUrl, this.restApiConfig);
  }

  public forContract(config: ContractConfig): ChainClient {
    const readyBuilder = this.ensureInitializedRestApi().then(() => this);
    return new AsyncProxyClient(readyBuilder, this.credentials.adminKey, config, this.orgMsp);
  }
}

class AsyncProxyClient extends ChainClient {
  private clientPromise: Promise<ChainClient>;

  constructor(
    private readonly readyBuilder: Promise<RestApiClientBuilder>,
    adminKey: string,
    contractConfig: ContractConfig,
    orgMsp: string
  ) {
    super(readyBuilder, adminKey, contractConfig, orgMsp);
    this.clientPromise = readyBuilder.then((b) => this.createClient(b, contractConfig));
  }

  private createClient(builder: RestApiClientBuilder, contractConfig: ContractConfig): ChainClient {
    // Token present means we want to use Fablo REST
    const token = globalRestApiConfig.getAuthorizedFabloRest(
      builder.restApiUrl,
      builder.credentials,
      this.orgMsp
    );

    if (token) {
      return new FabloRestClient(
        Promise.resolve(builder),
        builder.restApiUrl,
        contractConfig,
        builder.credentials,
        Promise.resolve(token),
        this.orgMsp,
        this.userId
      );
    }

    return new RestApiClient(Promise.resolve(builder), builder.restApiUrl, contractConfig, this.orgMsp);
  }

  public async disconnect(): Promise<void> {
    const client = await this.clientPromise;
    await client.disconnect();
  }

  public forUser(userId: string, secret?: string): ChainClient {
    const forked = new AsyncProxyClient(this.readyBuilder, userId, this.contractConfig, this.orgMsp);
    forked.clientPromise = this.clientPromise.then((client) => client.forUser(userId, secret));
    return forked;
  }

  public async evaluateTransaction<T>(
    method: string,
    dtoOrResp?: Serializable | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const client = await this.clientPromise;
    // @ts-expect-error - method overload signatures fail for some reason on dtoOrResp
    return await client.evaluateTransaction(method, dtoOrResp, resp);
  }

  public async submitTransaction<T>(
    method: string,
    dtoOrResp?: Serializable | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const client = await this.clientPromise;
    // @ts-expect-error - method overload signatures fail for some reason on dtoOrResp
    return await client.submitTransaction(method, dtoOrResp, resp);
  }
}

function builderScopeKey(
  apiUrl: string,
  orgMsp: string,
  credentials: RestApiAdminCredentials,
  restApiConfig: RestApiConfig
): string {
  return JSON.stringify([
    normalizeRestApiUrl(apiUrl),
    orgMsp,
    credentials.adminKey,
    credentials.adminSecret,
    restApiConfig
  ]);
}

function waitForInitialization(initialization: Promise<void>, apiUrl: string, waitMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Failed to initialize Rest API at ${apiUrl} after 50 retries`));
    }, waitMs);

    initialization.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
