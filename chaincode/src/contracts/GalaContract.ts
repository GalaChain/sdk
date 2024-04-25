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
  ContractAPI,
  GalaChainResponse,
  GalaChainResponseType,
  GetObjectDto,
  GetObjectHistoryDto
} from "@gala-chain/api";
import { Contract } from "fabric-contract-api";

import { GalaChainContext, GalaChainStub } from "../types";
import { getObjectHistory, getPlainObjectByKey } from "../utils";
import { getApiMethods } from "./GalaContractApi";
import { EVALUATE, GalaTransaction } from "./GalaTransaction";
import { trace } from "./tracing";

export abstract class GalaContract extends Contract {
  /**
   * @param name Contract name
   * @param version Contract version. The actual value should be defined in the child
   *    * class, and should be taken from package.json. If you extend contract class
   *    * that extends GalaContract, you should also override version.
   */
  constructor(
    name: string,
    private readonly version: string
  ) {
    super(name);
  }

  public getVersion(): string {
    return this.version;
  }

  public createContext(): GalaChainContext {
    return new GalaChainContext();
  }

  public async beforeTransaction(ctx: GalaChainContext): Promise<void> {
    await trace("before", ctx, () => super.beforeTransaction(ctx));
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public async aroundTransaction(ctx: GalaChainContext, fn: Function, parameters: unknown): Promise<void> {
    // note: Fabric uses Promise<void> type, but actually it returns transaction result
    return await trace("around", ctx, () => super.aroundTransaction(ctx, fn, parameters));
  }

  public async afterTransaction(ctx: GalaChainContext, result: unknown): Promise<void> {
    await trace("after", ctx, async () => {
      await super.afterTransaction(ctx, result);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (typeof result === "object" && result?.["Status"] === GalaChainResponseType.Success) {
        await (ctx.stub as unknown as GalaChainStub).flushWrites();
      }

      ctx?.logger?.logTimeline(
        "End Transaction",
        ctx.stub.getFunctionAndParameters()?.fcn ?? this.getName(),
        [{ chaincodeResult: result }]
      );
    });
  }

  @GalaTransaction({
    type: EVALUATE,
    out: "string"
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async GetContractVersion(ctx: GalaChainContext): Promise<GalaChainResponse<string>> {
    return GalaChainResponse.Success(this.version);
  }

  @GalaTransaction({
    type: EVALUATE,
    out: "string",
    description: "Gets the contract version. Deprecated. Use GetContractVersion instead."
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async GetChaincodeVersion(ctx: GalaChainContext): Promise<GalaChainResponse<string>> {
    return this.GetContractVersion(ctx);
  }

  @GalaTransaction({
    type: EVALUATE,
    out: "object"
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async GetContractAPI(ctx: GalaChainContext): Promise<GalaChainResponse<ContractAPI>> {
    const methods = getApiMethods(this);
    const contractName = this.getName();
    return GalaChainResponse.Success({ contractName, methods, contractVersion: this.version });
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetObjectDto,
    out: "object"
  })
  public GetObjectByKey(
    ctx: GalaChainContext,
    dto: GetObjectDto
  ): Promise<GalaChainResponse<Record<string, unknown>>> {
    return GalaChainResponse.Wrap(getPlainObjectByKey(ctx, dto.objectId));
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetObjectHistoryDto,
    out: "object"
  })
  public GetObjectHistory(
    ctx: GalaChainContext,
    dto: GetObjectHistoryDto
  ): Promise<GalaChainResponse<Record<string, unknown>>> {
    return GalaChainResponse.Wrap(getObjectHistory(ctx, dto.objectId));
  }
}
