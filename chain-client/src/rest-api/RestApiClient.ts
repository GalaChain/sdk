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
import axios from "axios";

import { ChainClient, ChainClientBuilder, ClassType, ContractConfig, isClassType } from "../generic";
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
    throw new Error(`Method ${method} from contract ${contractPath} is read-only`);
  }

  if (!isWrite && methodApi.isWrite) {
    throw new Error(`Method ${method} from contract ${contractPath} is not read-only`);
  }

  return `${restApiUrl}/${contractPath}/${methodApi.apiMethodName ?? methodApi.methodName}`;
}

export class RestApiClient extends ChainClient {
  private readonly restApiUrl: Promise<string>;

  constructor(
    builder: Promise<ChainClientBuilder>,
    restApiUrl: string,
    contractConfig: ContractConfig,
    private readonly credentials: RestApiAdminCredentials,
    orgMsp: string
  ) {
    super(builder, credentials.adminKey, contractConfig, orgMsp);
    this.restApiUrl = builder.then(() => restApiUrl);
  }

  public async isReady(): Promise<true> {
    await this.builder;
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

  public static async getContractApis(
    credentials: RestApiAdminCredentials,
    restApiUrl: string,
    restApiConfig: RestApiConfig
  ): Promise<SetContractApiParams[]> {
    const headers = {
      "x-identity-lookup-key": credentials.adminKey,
      "x-user-encryption-key": credentials.adminSecret
    };

    // ensure admin account is created
    await axios.post(`${restApiUrl}/identity/ensure-admin`, undefined, { headers });

    // refresh api (may fail silently)
    await axios.post(`${restApiUrl}/refresh-api`, undefined, { headers });

    const contractApis: SetContractApiParams[] = [];

    for (const channel of restApiConfig.channels) {
      for (const contract of channel.contracts) {
        const contractPath = `${channel.pathFragment}/${contract.pathFragment}`;
        const getApiPath = `${restApiUrl}/${contractPath}/GetContractAPI`;

        console.log("Loading ContractAPI:", getApiPath);
        const apiResponse = await axios.post(getApiPath, undefined, { headers });

        if (!GalaChainResponse.isSuccess<ContractAPI>(apiResponse.data)) {
          throw new Error(
            `Failed to load ContractAPI for ${contractPath}: ${JSON.stringify(apiResponse.data)}`
          );
        }

        console.log("API:", getApiPath, apiResponse.data);
        contractApis.push({
          channelName: channel.channelName,
          chaincodeName: contract.chaincodeName,
          contractName: contract.contractName,
          contractPath: contractPath,
          api: apiResponse.data.Data
        });
      }
    }

    return contractApis;
  }
}
