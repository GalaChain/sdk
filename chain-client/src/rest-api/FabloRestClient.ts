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
  ContractAPI,
  ContractConfig,
  GalaChainResponse,
  Inferred,
  isClassType,
  serialize
} from "@gala-chain/api";
import axios from "axios";

import { RestApiAdminCredentials, SetContractApiParams, globalRestApiConfig } from "./GlobalRestApiConfig";
import { catchAxiosError } from "./catchAxiosError";
import { RestApiConfig } from "./loadRestApiConfig";

async function getPath(
  restApiUrl: string,
  cfg: ContractConfig,
  method: string,
  isWrite: boolean
): Promise<string> {
  const { api, contractPath } = globalRestApiConfig.getContractApi(cfg);

  const methodApi = api.methods.find((m) => m.methodName === method);

  if (!methodApi) {
    throw new Error(`Cannot find method API for method ${method} and contract ${contractPath}`);
  }

  if (isWrite && !methodApi.isWrite) {
    throw new Error(`Method ${method} is read-only`);
  }

  if (!isWrite && methodApi.isWrite) {
    throw new Error(`Method ${method} is not read-only`);
  }

  const type = isWrite ? "invoke" : "query";

  return `${restApiUrl}/${type}/${cfg.channel}/${cfg.chaincode}`;
}

export class FabloRestClient extends ChainClient {
  private readonly restApiUrl: Promise<string>;

  constructor(
    builder: Promise<ChainClientBuilder>,
    restApiUrl: string,
    contractConfig: ContractConfig,
    private readonly credentials: RestApiAdminCredentials,
    private token: Promise<string>,
    orgMsp: string
  ) {
    super(builder, credentials.adminKey, contractConfig, orgMsp);
    this.restApiUrl = builder.then(() => restApiUrl);
  }

  public async isReady(): Promise<true> {
    await this.builder;
    await this.token;
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

    return this.post(path, method, dtoOrResp, resp);
  }

  async evaluateTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const path = await getPath(await this.restApiUrl, this.contractConfig, method, false);

    return this.post(path, method, dtoOrResp, resp);
  }

  private async post<T>(
    path: string,
    methodName: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const [dto, responseType] = isClassType(dtoOrResp) ? [undefined, dtoOrResp] : [dtoOrResp, resp];
    const args = dto ? [serialize(dto)] : [];
    const payload = { method: `${this.contractConfig.contract}:${methodName}`, args };

    const headers = {
      Authorization: `Bearer ${await this.token}`
    };

    const response = await axios.post(path, payload, { headers }).catch((e) => catchAxiosError(e));

    return GalaChainResponse.deserialize<T>(responseType, response?.data?.response ?? {});
  }

  public static async enroll(restApiUrl: string, userId: string, secret: string): Promise<string> {
    const response = await axios
      .post(`${restApiUrl}/user/enroll`, { id: userId, secret })
      .catch((e) => catchAxiosError(e));

    if (!response.data.token) {
      throw new Error(`User enrollment failed, invalid response: ${JSON.stringify(response.data)}`);
    }

    return response.data.token;
  }

  public forUser(userId: string, secret?: string): ChainClient {
    this.token = this.restApiUrl.then((url) =>
      FabloRestClient.enroll(url, userId, secret ?? this.credentials.adminSecret)
    );
    return this;
  }

  public static async getContractApis(
    token: string,
    restApiUrl: string,
    restApiConfig: RestApiConfig
  ): Promise<SetContractApiParams[]> {
    const headers = {
      Authorization: `Bearer ${token}`
    };

    const contractApis: SetContractApiParams[] = [];

    for (const channel of restApiConfig.channels) {
      for (const contract of channel.contracts) {
        const contractPath = `${channel.channelName}/${contract.chaincodeName}`;
        const getApiPath = `${restApiUrl}/query/${contractPath}`;
        const payload = { method: `${contract.contractName}:GetContractAPI`, args: [] };

        const apiResponse = await axios
          .post(getApiPath, payload, { headers })
          .catch((e) => catchAxiosError(e));

        if (!GalaChainResponse.isSuccess<ContractAPI>(apiResponse.data.response)) {
          throw new Error(
            `Failed to get ${payload.method} for ${contractPath}: ${JSON.stringify(apiResponse.data)}`
          );
        }

        contractApis.push({
          channelName: channel.channelName,
          chaincodeName: contract.chaincodeName,
          contractName: contract.contractName,
          contractPath: contractPath,
          api: apiResponse.data.response.Data
        });
      }
    }

    return contractApis;
  }
}
