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
  ClassType,
  ContractConfig,
  GalaChainResponse,
  Inferred,
  isClassType,
  serialize
} from "@gala-chain/api";
import { Contract, Gateway, Network } from "fabric-network";

import { HFClientBuilder } from "./HFClientBuilder";

export class HFClient extends ChainClient {
  private contractPromise: Promise<{ contract: Contract; gateway: Gateway; network: Network }> | undefined;

  constructor(
    private resolvedBuilder: HFClientBuilder,
    userId: string,
    contractConfig: ContractConfig,
    private readonly createContractPromise: (userId: string) => Promise<{
      contract: Contract;
      gateway: Gateway;
      network: Network;
    }>
  ) {
    super(Promise.resolve(resolvedBuilder), userId, contractConfig, resolvedBuilder.orgMsp);
  }

  public forUser(userId: string): ChainClient {
    return new HFClient(this.resolvedBuilder, userId, this.contractConfig, this.createContractPromise);
  }

  public get contract(): Promise<Contract> {
    if (this.contractPromise === undefined) {
      this.contractPromise = this.createContractPromise(this.userId);
    }

    return this.contractPromise.then((c) => c.contract);
  }

  public async disconnect(): Promise<void> {
    if (this.contractPromise === undefined) {
      return;
    }

    const { gateway } = await this.contractPromise;
    gateway.disconnect();
    this.contractPromise = undefined;
  }

  public async submitTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const [dto, responseType] = isClassType(dtoOrResp) ? [undefined, dtoOrResp] : [dtoOrResp, resp];
    const serialized = dto ? serialize(dto) : undefined;

    const contract = await this.contract;
    const transaction = contract.createTransaction(method);

    const responseBuffer =
      serialized === undefined ? await transaction.submit() : await transaction.submit(serialized);

    const responseString = responseBuffer.toString();

    return GalaChainResponse.deserialize<T>(responseType, responseString);
  }

  public async evaluateTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    const [dto, responseType] = isClassType(dtoOrResp) ? [undefined, dtoOrResp] : [dtoOrResp, resp];
    const serialized = dto ? serialize(dto) : undefined;

    const contract = await this.contract;
    const transaction = contract.createTransaction(method);

    const responseBuffer =
      serialized === undefined ? await transaction.evaluate() : await transaction.evaluate(serialized);

    const responseString = responseBuffer.toString();

    return GalaChainResponse.deserialize<T>(responseType, responseString);
  }
}
