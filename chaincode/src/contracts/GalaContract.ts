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
  BatchDto,
  ContractAPI,
  DryRunDto,
  DryRunResultDto,
  GalaChainResponse,
  GalaChainResponseType,
  GetObjectDto,
  GetObjectHistoryDto,
  NotFoundError,
  ValidationFailedError,
  createValidDTO,
  signatures
} from "@gala-chain/api";
import { Contract, Transaction } from "fabric-contract-api";

import { PublicKeyService } from "../services";
import { GalaChainContext, GalaChainStub } from "../types";
import { getObjectHistory, getPlainObjectByKey } from "../utils";
import { getApiMethod, getApiMethods } from "./GalaContractApi";
import { EVALUATE, GalaTransaction, SUBMIT } from "./GalaTransaction";
import { trace } from "./tracing";

export class BatchWriteLimitExceededError extends ValidationFailedError {
  constructor(writesLimit: number) {
    super(
      `Batch writes limit of ${writesLimit} keys exceeded. ` +
        `This operation can be repeated with a smaller batch.`
    );
  }
}

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
      if (
        typeof result === "object" &&
        result?.["Status"] === GalaChainResponseType.Success &&
        !ctx.isDryRun
      ) {
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
    const method = getApiMethod(this, dto.method);

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
    const response = await this[method.methodName](ctx, dto.dto);

    const gcStub = ctx.stub as unknown as GalaChainStub;

    return await createValidDTO(DryRunResultDto, {
      response,
      writes: Object.fromEntries(Object.entries(gcStub.getWrites()).map(([k, v]) => [k, v.toString()])),
      reads: Object.fromEntries(Object.entries(gcStub.getReads()).map(([k, v]) => [k, v.toString()])),
      deletes: gcStub.getDeletes()
    });
  }

  @GalaTransaction({
    type: SUBMIT,
    in: BatchDto,
    out: "object",
    description: "Submit a batch of transactions",
    allowedOrgs: [process.env.CURATOR_ORG_MSP ?? "CuratorOrg"]
  })
  public async BatchSubmit(ctx: GalaChainContext, batchDto: BatchDto): Promise<GalaChainResponse<unknown>[]> {
    const responses: GalaChainResponse<unknown>[] = [];
    const aggregatedCache = {
      writes: ctx.stub.getWrites(),
      deletes: ctx.stub.getDeletes()
    };

    const writesLimit = Math.min(
      batchDto.writesLimit ?? BatchDto.WRITES_DEFAULT_LIMIT,
      BatchDto.WRITES_HARD_LIMIT
    );
    let writesCount = Object.keys(ctx.stub.getWrites()).length;

    for (const op of batchDto.operations) {
      // 1. Reset the calling user, to allow each operation to perform the
      //    authorization.
      ctx.resetCallingUser();

      // 2. Execute the operation. Collect both successful and failed responses.
      let response: GalaChainResponse<unknown>;
      try {
        if (writesCount >= writesLimit) {
          throw new BatchWriteLimitExceededError(writesLimit);
        }

        const method = getApiMethod(this, op.method, (m) => m.isWrite && m.methodName !== "BatchSubmit");
        response = await this[method.methodName](ctx, op.dto);
      } catch (error) {
        response = GalaChainResponse.Error(error);
      }
      responses.push(response);

      // 3. Update the cache.
      //
      //    If the operation is successful, we keep the changes. Otherwise, we
      //    restore the cache to the previous state to prevent from having
      //    cached writes that come from failed transactions.
      //
      //    At the end, we override the cache with the state without cached
      //    reads to keep the cache small.
      //
      if (GalaChainResponse.isSuccess(response)) {
        aggregatedCache.writes = ctx.stub.getWrites();
        aggregatedCache.deletes = ctx.stub.getDeletes();
        writesCount = Object.keys(aggregatedCache.writes).length;
      } else {
        ctx.stub.setWrites(aggregatedCache.writes);
        ctx.stub.setDeletes(aggregatedCache.deletes);
      }
      ctx.stub.setReads({});
    }
    return responses;
  }

  @GalaTransaction({
    type: EVALUATE,
    in: BatchDto,
    out: "object",
    description: "Evaluate a batch of transactions"
  })
  public async BatchEvaluate(
    ctx: GalaChainContext,
    batchDto: BatchDto
  ): Promise<GalaChainResponse<unknown>[]> {
    const responses: GalaChainResponse<unknown>[] = [];

    for (const op of batchDto.operations) {
      // 1. Reset the calling user, to allow each operation to perform the
      //    authorization.
      ctx.resetCallingUser();

      // 2. Execute the operation. Collect both successful and failed responses.
      let response: GalaChainResponse<unknown>;
      try {
        const method = getApiMethod(this, op.method, (m) => !m.isWrite && m.methodName !== "BatchEvaluate");
        response = await this[method.methodName](ctx, op.dto);
      } catch (error) {
        response = GalaChainResponse.Error(error);
      }
      responses.push(response);

      // 3. We don't need to update the cache.
    }
    return responses;
  }
}
