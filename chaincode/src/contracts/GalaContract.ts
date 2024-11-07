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
  DryRunDto,
  DryRunResultDto,
  GalaChainResponseType,
  GetObjectDto,
  GetObjectHistoryDto,
  NotFoundError,
  ValidationFailedError,
  createValidDTO,
  signatures
} from "@gala-chain/api";
import { Contract } from "fabric-contract-api";

import { PublicKeyService } from "../services";
import { GalaChainContext, GalaChainStub } from "../types";
import { getObjectHistory, getPlainObjectByKey } from "../utils";
import { getApiMethods } from "./GalaContractApi";
import { EVALUATE, GalaTransaction } from "./GalaTransaction";

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
    await super.beforeTransaction(ctx);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public async aroundTransaction(ctx: GalaChainContext, fn: Function, parameters: unknown): Promise<void> {
    // note: Fabric uses Promise<void> type, but actually it returns transaction result
    return super.aroundTransaction(ctx, fn, parameters);
  }

  public async afterTransaction(ctx: GalaChainContext, result: unknown): Promise<void> {
    await super.afterTransaction(ctx, result);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof result === "object" && result?.["Status"] === GalaChainResponseType.Success && !ctx.isDryRun) {
      await (ctx.stub as unknown as GalaChainStub).flushWrites();
    }

    ctx?.logger?.logTimeline("End Transaction", ctx.stub.getFunctionAndParameters()?.fcn ?? this.getName(), [
      { chaincodeResult: result }
    ]);
  }

  @GalaTransaction({
    type: EVALUATE,
    out: "string"
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async GetContractVersion(ctx: GalaChainContext): Promise<string> {
    return this.version;
  }

  @GalaTransaction({
    type: EVALUATE,
    out: "string",
    description: "Gets the contract version. Deprecated. Use GetContractVersion instead.",
    deprecated: true
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async GetChaincodeVersion(ctx: GalaChainContext): Promise<string> {
    return this.version;
  }

  @GalaTransaction({
    type: EVALUATE,
    out: "object"
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async GetContractAPI(ctx: GalaChainContext): Promise<ContractAPI> {
    const methods = getApiMethods(this);
    const contractName = this.getName();
    return { contractName, methods, contractVersion: this.version };
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetObjectDto,
    out: "object"
  })
  public GetObjectByKey(ctx: GalaChainContext, dto: GetObjectDto): Promise<Record<string, unknown>> {
    return getPlainObjectByKey(ctx, dto.objectId);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: GetObjectHistoryDto,
    out: "object"
  })
  public GetObjectHistory(ctx: GalaChainContext, dto: GetObjectHistoryDto): Promise<Record<string, unknown>> {
    return getObjectHistory(ctx, dto.objectId);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: DryRunDto,
    out: DryRunResultDto
  })
  public async DryRun(ctx: GalaChainContext, dto: DryRunDto): Promise<DryRunResultDto> {
    const methodNames = getApiMethods(this).reduce((map, m) => {
      map.set(m.methodName, m.methodName);
      if (m.apiMethodName) {
        map.set(m.apiMethodName, m.methodName);
      }
      return map;
    }, new Map<string, string>());

    const methodName = methodNames.get(dto.method);

    // check if method exists
    if (!methodName) {
      const availableMethods = Array.from(methodNames.keys()).sort();
      throw new NotFoundError(
        `Method ${dto.method} not found. Available methods: ${availableMethods.join(", ")}`
      );
    }

    // For dry run we don't use the regular authorization. We don't want users to provide signatures
    // to avoid replay attack in case if the method is eventually not executed, and someone in the middle
    // will replay the request.
    if (dto.dto && dto.dto.signature) {
      throw new ValidationFailedError("The dto should have no signature for dry run execution");
    }

    const ethAddr = signatures.getEthAddress(signatures.getNonCompactHexPublicKey(dto.callerPublicKey));
    const userProfile = await PublicKeyService.getUserProfile(ctx, ethAddr);

    if (!userProfile) {
      throw new NotFoundError(`User profile for ${ethAddr} not found`);
    }

    ctx.setDryRunOnBehalfOf(userProfile);

    // method needs to be executed first to populate reads, writes and deletes
    const response = await this[methodName](ctx, dto.dto);

    const gcStub = ctx.stub as unknown as GalaChainStub;

    return await createValidDTO(DryRunResultDto, {
      response,
      writes: gcStub.getWrites(),
      reads: gcStub.getReads(),
      deletes: gcStub.getDeletes()
    });
  }
}
