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
import { ChainCallDTO, ContractAPI, GalaChainResponse, Inferred } from "@gala-chain/api";
import axios, { AxiosError } from "axios";

import { ChainClient, ChainClientBuilder, ClassType, ContractConfig, isClassType } from "../generic";
import { RestApiConfig } from "./loadRestApiConfig";

async function getPath(
  restApiUrl: string,
  cfg: ContractConfig,
  method: string,
  isWrite: boolean
): Promise<string> {
  const key = `${cfg.channelName}|${cfg.chaincodeName}|${cfg.contractName}`;
  const contractApi = RestApiClientBuilder.restApiConfigReversed[key];

  if (!contractApi) {
    throw new Error(`Cannot find contract API for key ${key}`);
  }

  const methodApi = (await contractApi.api).methods.find((m) => m.methodName === method);

  if (!methodApi) {
    throw new Error(`Cannot find method API for method ${method} and contract key ${key}`);
  }

  if (isWrite && !methodApi.isWrite) {
    throw new Error(`Method ${method} is read-only`);
  }

  if (!isWrite && methodApi.isWrite) {
    throw new Error(`Method ${method} is not read-only`);
  }

  return `${restApiUrl}/${contractApi.path}/${methodApi.apiMethodName ?? methodApi.methodName}`;
}

function catchAxiosError(e?: AxiosError<{ error?: { Status?: number } }>) {
  // if data object contains { error: { Status: 0 } }, it means this is GalaChainResponse
  if (e?.response?.data?.error?.Status === 0) {
    return { data: e?.response?.data?.error };
  } else {
    const data = { axiosError: { message: e?.message, data: e?.response?.data } };
    console.warn(`Axios error:`, JSON.stringify(data));

    return { data: data };
  }
}

export class RestApiClient extends ChainClient {
  private readonly restApiUrl: Promise<string>;

  constructor(
    builder: Promise<RestApiClientBuilder>,
    contractConfig: ContractConfig,
    private readonly credentials: RestApiAdminCredentials,
    orgMsp: string
  ) {
    super(builder, credentials.adminKey, contractConfig, orgMsp);
    this.restApiUrl = builder.then((b) => b.restApiUrl);
  }

  public async isReady(): Promise<true> {
    await this.builder;
    await this.credentials;
    return true;
  }

  async disconnect(): Promise<void> {
    // ensure all promises end, then do nothing
    await this.isReady();
  }

  async submitTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const path = await getPath(await this.restApiUrl, this.contractConfig, method, true);

    return this.post(path, dtoOrResp, resp);
  }

  async evaluateTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const path = await getPath(await this.restApiUrl, this.contractConfig, method, false);

    return this.post(path, dtoOrResp, resp);
  }

  public async post<T>(
    path: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const { adminKey, adminSecret } = this.credentials;
    const [dto, responseType] = isClassType(dtoOrResp) ? [undefined, dtoOrResp] : [dtoOrResp, resp];
    const serialized = JSON.parse(dto?.serialize() ?? "{}");
    console.log(adminKey, "POST:", path, serialized);

    const headers = {
      "x-identity-lookup-key": adminKey,
      "x-user-encryption-key": adminSecret
    };

    const response = await axios
      .post<Record<string, unknown>>(path, serialized, { headers: headers })
      .catch((e) => catchAxiosError(e));

    console.log("Response: ", response.data);

    return GalaChainResponse.deserialize<T>(responseType, response.data ?? {});
  }

  public forUser(userId: string): ChainClient {
    console.warn(`Ignoring forUser(${userId}) for RestApiClient`);
    return this;
  }
}

export interface RestApiAdminCredentials {
  adminKey: string;
  adminSecret: string;
}

export class RestApiClientBuilder extends ChainClientBuilder {
  static isRestApiInitializedAndHealthy: Record<string, boolean> = {};
  static restApiConfigReversed: Record<string, { path: string; api: ContractAPI }> = {};

  constructor(
    public readonly restApiUrl: string,
    public readonly orgMsp: string,
    private readonly credentials: RestApiAdminCredentials,
    public readonly restApiConfig: RestApiConfig
  ) {
    super();
  }

  private async ensureInitializedRestApi(): Promise<void> {
    if (RestApiClientBuilder.isRestApiInitializedAndHealthy[this.restApiUrl]) {
      return;
    }

    try {
      const headers = {
        "x-identity-lookup-key": this.credentials.adminKey,
        "x-user-encryption-key": this.credentials.adminSecret
      };

      // ensure admin account is created
      await axios.post(`${this.restApiUrl}/identity/ensure-admin`, undefined, { headers });

      // refresh api (may fail silently)
      await axios.post(`${this.restApiUrl}/refresh-api`, undefined, { headers });

      for (const channel of this.restApiConfig.channels) {
        for (const contract of channel.contracts) {
          const key = `${channel.channelName}|${contract.chaincodeName}|${contract.contractName}`;
          const path = `${channel.pathFragment}/${contract.pathFragment}`;
          const getApiPath = `${this.restApiUrl}/${path}/GetContractAPI`;

          console.log("Loading ContractAPI:", getApiPath);
          const apiResponse = await axios.post(getApiPath, undefined, { headers });

          if (!GalaChainResponse.isSuccess<ContractAPI>(apiResponse.data)) {
            throw new Error(`Failed to load ContractAPI for ${key}: ${JSON.stringify(apiResponse.data)}`);
          }

          console.log("API:", getApiPath, apiResponse.data);
          RestApiClientBuilder.restApiConfigReversed[key] = { path: path, api: apiResponse.data.Data };
        }
      }

      RestApiClientBuilder.isRestApiInitializedAndHealthy[this.restApiUrl] = true;
    } catch (e) {
      const { data } = catchAxiosError(e);
      console.error(JSON.stringify(data));
      throw e;
    }
  }

  public forContract(config: ContractConfig): RestApiClient {
    const payload = {
      userId: this.credentials.adminKey,
      identityEncryptionKey: this.credentials.adminSecret
    };

    const headers = {
      "x-identity-lookup-key": this.credentials.adminKey,
      "x-user-encryption-key": this.credentials.adminSecret
    };

    const credentialsExists = this.ensureInitializedRestApi()
      .then(async () => {
        const resp = await axios.post(`${this.restApiUrl}/identity/ensure-user`, payload, { headers });
        const status = resp.data.status;
        if (![1, 2, 3].includes(status)) {
          console.warn(`Failed to create user ${this.credentials.adminKey}: ${JSON.stringify(resp.data)}`);
        }
      })
      .catch((e) => {
        throw new Error(`Failed to create user ${this.credentials.adminKey}: ${e.message}`);
      });

    const readyBuilder = credentialsExists.then(() => this);

    return new RestApiClient(readyBuilder, config, this.credentials, this.orgMsp);
  }
}
