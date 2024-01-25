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
import { ClassConstructor, NotImplementedError } from "@gala-chain/api";
import { ChaincodeStubClassType, TestChaincodeStub } from "@gala-chain/test";
import { Context, Contract } from "fabric-contract-api";

import { GalaJSONSerializer } from "../utils";

interface ChaincodeFromContractClassType {
  // eslint-disable-next-line  @typescript-eslint/no-misused-new
  new (
    contractClasses: Array<{ new (): Contract }>,
    serializers,
    metadata,
    title,
    version
  ): ChaincodeFromContractClassType;

  Invoke(
    stub: ChaincodeStubClassType
  ): Promise<{ status: 200; payload: Buffer } | { status: 500; message: Error }>;
}

const ChaincodeFromContract =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("fabric-shim/lib/contract-spi/chaincodefromcontract") as ChaincodeFromContractClassType;

const serializers = {
  transaction: "galaJsonSerializer",
  serializers: {
    galaJsonSerializer: GalaJSONSerializer
  }
};

type InvokeResponse = Record<string, unknown> | Array<Record<string, unknown>>;

/** @deprecated */
export default class TestChaincode {
  private readonly chaincode: ChaincodeFromContractClassType;

  public constructor(
    contracts: ClassConstructor<Contract>[],
    public readonly state: Record<string, string> = {},
    public readonly writes: Record<string, string> = {},
    public callingUser: string = "client|admin",
    public readonly callHistory: unknown[] = []
  ) {
    const getCurrentCallingUser = () => {
      const [prefix, userId] = this.callingUser.split("|");
      if (userId === undefined) {
        throw new Error("invalid calling user, expected format: client|userId");
      } else {
        return { userId, prefix };
      }
    };

    const contractsWrapped = contracts.map((c) => {
      const wrapped = class extends c {
        beforeTransaction(ctx: Context): Promise<void> {
          const { userId, prefix } = getCurrentCallingUser();

          callHistory.push({ ...ctx.stub.getFunctionAndParameters(), callingUser: `${prefix}|${userId}` });

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ctx.clientIdentity.id = `x509::/OU=${prefix}/CN=${userId}:`;

          return super.beforeTransaction(ctx);
        }
      };

      // ensure we have the same name as the original class
      Object.defineProperty(wrapped, "name", { value: c.name });

      return wrapped as unknown as ClassConstructor<Contract>;
    });

    this.chaincode = new ChaincodeFromContract(contractsWrapped, serializers, {}, "gala-chain-test", "0.0.1");
  }

  public setCallingUser(user: string): TestChaincode {
    this.callingUser = user;
    return this;
  }

  public async invoke<T = InvokeResponse>(
    method: string,
    ...args: (string | { serialize: () => string })[]
  ): Promise<T> {
    const argsSerialized = args.map((arg) => (typeof arg === "string" ? arg : arg.serialize()));
    const stub = new TestChaincodeStub([method, ...argsSerialized], this.state, this.writes);
    const rawResponse = await this.chaincode.Invoke(stub);

    if (rawResponse.status === 200) {
      const stringResponse = rawResponse.payload.toString();

      return JSON.parse(stringResponse) as T;
    } else {
      throw rawResponse.message;
    }
  }

  public getContractInstance<T extends Contract>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    contractClass: { new (...args: unknown[]): T } & Function
  ): T {
    // The code below accesses internals of chaincode implementation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const data = this.chaincode.contractImplementations[contractClass.name] as
      | { name: string; contractInstance: T }
      | undefined;

    if (data === undefined) {
      throw new NotImplementedError(`Cannot get contract instance for ${contractClass.name}`);
    } else {
      return data.contractInstance;
    }
  }
}
