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
import { ChainCallDTO, ClassConstructor, GalaChainResponse, Inferred, serialize } from "@gala-chain/api";
import { ChainClient, ChainClientBuilder, ClassType, ContractConfig } from "@gala-chain/client";
import { Contract } from "fabric-contract-api";
import path from "path";

import { TestChaincode } from "../unit";

export interface MockedChaincodeClientParams {
  mockedChaincodeDir: string;
  orgMsp?: string;
  adminId?: string;
}

interface ImportedChaincodeLib {
  contracts: (ClassConstructor<Contract> & { name: string })[];
}

interface ChaincodeLib {
  contracts: (ClassConstructor<Contract> & { name: string })[];
  contractsByName: Record<string, ClassConstructor<Contract>>;
}

const globalState = {} as Record<string, Record<string, Record<string, string>>>;

function getOrCreateState(channel: string, chaincode: string) {
  if (!globalState[channel]) {
    globalState[channel] = {};
  }
  if (!globalState[channel][chaincode]) {
    globalState[channel][chaincode] = {};
  }
  return globalState[channel][chaincode];
}

export class MockedChaincodeClientBuilder implements ChainClientBuilder {
  private readonly mockedChaincodeDir: string;
  private readonly mockedChaincodeIndexJs: string;
  private readonly mockedChaincodeLib: Promise<ChaincodeLib>;
  private readonly orgMsp: string;
  private readonly adminId: string;

  constructor(params: MockedChaincodeClientParams) {
    this.mockedChaincodeDir = params.mockedChaincodeDir;
    this.mockedChaincodeIndexJs = chaincodeIndexJsPath(this.mockedChaincodeDir);
    this.orgMsp = params.orgMsp ?? "MockedOrg";
    this.adminId = params.adminId ?? "client|mocked-user";

    this.mockedChaincodeLib = Promise.resolve()
      .then(async () => (await import(this.mockedChaincodeIndexJs)) as ImportedChaincodeLib) // TODO verify or throw
      .then((lib) => {
        const contractsByName = {} as Record<string, ClassConstructor<Contract>>;
        lib.contracts.forEach((contract) => {
          contractsByName[contract.name] = contract;
        });
        return { ...lib, contractsByName };
      });
  }

  public forContract(config: ContractConfig): MockedChaincodeClient {
    const chaincode = this.mockedChaincodeLib.then((lib) => {
      const contract = lib.contractsByName[config.contract];
      if (!contract) {
        throw new Error(`Contract ${config.contract} not found in ${this.mockedChaincodeDir}`);
      }
      const state = getOrCreateState(config.channel, config.chaincode);
      return new TestChaincode([contract], state, {}, this.adminId, this.orgMsp);
      // TODO state should be global => provide test
      // TODO do not save on evaluates => test
    });
    return new MockedChaincodeClient(this, chaincode, config, this.orgMsp, this.adminId);
  }
}

function chaincodeIndexJsPath(chaincodeDir: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chaincodePackageJson = require(path.join(chaincodeDir, "package.json")) as { main: string };
  const chaincodeIndexJsPath = path.join(chaincodeDir, chaincodePackageJson.main);
  return chaincodeIndexJsPath;
}

export class MockedChaincodeClient extends ChainClient {
  private readonly chaincode: Promise<TestChaincode>;
  private transactionDelayMs: number;

  constructor(
    builder: MockedChaincodeClientBuilder,
    chaincode: Promise<TestChaincode>,
    contractConfig: ContractConfig,
    orgMsp: string,
    userId: string
  ) {
    super(Promise.resolve(builder), userId, contractConfig, orgMsp);
    this.transactionDelayMs = 0;
    this.chaincode = chaincode;
  }

  private async optionalDelay() {
    if (this.transactionDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.transactionDelayMs));
    }
  }

  async submitTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    await this.optionalDelay();
    const chaincode = await this.chaincode;
    const { fullMethod, args, responseClass } = this.getParameters(method, dtoOrResp, resp);
    const response = await chaincode.invoke<Record<string, unknown>>(fullMethod, ...args);
    return GalaChainResponse.deserialize(responseClass, response);
  }

  async evaluateTransaction<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): Promise<GalaChainResponse<T>> {
    await this.optionalDelay();
    const chaincode = await this.chaincode;
    const { fullMethod, args, responseClass } = this.getParameters(method, dtoOrResp, resp);
    const response = await chaincode.query<Record<string, unknown>>(fullMethod, ...args);
    return GalaChainResponse.deserialize(responseClass, response);
  }

  private getParameters<T>(
    method: string,
    dtoOrResp?: ChainCallDTO | Record<string, unknown> | ClassType<Inferred<T>>,
    resp?: ClassType<Inferred<T>>
  ): {
    fullMethod: string;
    args: string[];
    responseClass: ClassType<Inferred<T>>;
  } {
    const fullMethod = `${this.contractConfig.contract}:${method}`;
    const [dto, responseType] = isClassType(dtoOrResp) ? [undefined, dtoOrResp] : [dtoOrResp, resp];
    const args = dto === undefined ? [] : [serialize(dto)];
    const responseClass = responseType ?? (Object as unknown as ClassType<Inferred<T>>);
    return { fullMethod, args, responseClass };
  }

  forUser(userId: string, secret?: string | undefined): ChainClient {
    throw new Error("Method not implemented.");
  }

  async disconnect(): Promise<void> {
    // do nothing
  }

  withTransactionDelay(transactionDelayMs: number) {
    this.transactionDelayMs = transactionDelayMs;
    return this;
  }
}

function isClassType(obj: unknown): obj is ClassType<unknown> {
  return typeof obj === "function";
}
