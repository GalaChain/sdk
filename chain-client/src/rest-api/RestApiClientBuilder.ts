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
import {
  ChainCallDTO,
  ChainClient,
  ChainClientBuilder,
  ClassType,
  ContractConfig,
  GalaChainResponse,
  Inferred
} from "@gala-chain/api";
import axios from "axios";

import { FabloRestClient } from "./FabloRestClient";
import {
  RestApiAdminCredentials,
  RestApiStatus,
  SetContractApiParams,
  globalRestApiConfig
} from "./GlobalRestApiConfig";
import { RestApiClient } from "./RestApiClient";
import { RestApiConfig } from "./loadRestApiConfig";

export class RestApiClientBuilder extends ChainClientBuilder {
  constructor(
    public readonly restApiUrl: string,
    public readonly orgMsp: string,
    public readonly credentials: RestApiAdminCredentials,
    public readonly restApiConfig: RestApiConfig
  ) {
    super();
  }

  private async ensureInitializedRestApi(retriesLeft = 50): Promise<void> {
    const status = globalRestApiConfig.getStatus(this.restApiUrl);

    if (status === RestApiStatus.NONE) {
      try {
        globalRestApiConfig.markPending(this.restApiUrl);

        const shouldUseFabloRest = await this.shouldUseFabloRest();

        const apis = shouldUseFabloRest
          ? await this.getContractApisFromFabloRest()
          : await this.getContractApisFromGCRestApi();

        for (const api of apis) {
          globalRestApiConfig.setContractApi(api);
        }

        globalRestApiConfig.markInitialized(this.restApiUrl);
        return;
      } catch (e) {
        globalRestApiConfig.markFailed(this.restApiUrl, e);
        throw e;
      }
    }

    if (retriesLeft === 0) {
      const error = new Error(`Failed to initialize Rest API at ${this.restApiUrl} after 50 retries`);
      globalRestApiConfig.markFailed(this.restApiUrl, error);
      throw error;
    }

    if (status === RestApiStatus.PENDING) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return this.ensureInitializedRestApi(retriesLeft - 1);
    }
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
      globalRestApiConfig.getAuthorizedFabloRest(this.restApiUrl) ??
      (await FabloRestClient.enroll(
        this.restApiUrl,
        this.credentials.adminKey,
        this.credentials.adminSecret
      ));

    globalRestApiConfig.setAuthorizedFabloRest(this.restApiUrl, token);

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
    builder: Promise<RestApiClientBuilder>,
    adminKey: string,
    contractConfig: ContractConfig,
    orgMsp: string
  ) {
    super(builder, adminKey, contractConfig, orgMsp);
    this.clientPromise = builder.then((b) => {
      // Token present means we want to use Fablo REST
      const token = globalRestApiConfig.getAuthorizedFabloRest(b.restApiUrl);

      if (token) {
        return new FabloRestClient(
          Promise.resolve(b),
          b.restApiUrl,
          contractConfig,
          b.credentials,
          Promise.resolve(token),
          this.orgMsp
        );
      } else {
        return new RestApiClient(Promise.resolve(b), b.restApiUrl, contractConfig, this.orgMsp);
      }
    });
  }

  public async disconnect(): Promise<void> {
    const client = await this.clientPromise;
    await client.disconnect();
  }

  public forUser(userId: string, secret?: string): ChainClient {
    this.clientPromise = this.clientPromise.then((c) => c.forUser(userId, secret));
    return this;
  }

  public async evaluateTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const client = await this.clientPromise;
    // @ts-expect-error - method overload signatures fail for some reason on dtoOrResp
    return await client.evaluateTransaction(method, dtoOrResp, resp);
  }

  public async submitTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const client = await this.clientPromise;
    // @ts-expect-error - method overload signatures fail for some reason on dtoOrResp
    return await client.submitTransaction(method, dtoOrResp, resp);
  }
}
