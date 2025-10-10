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
  ChainError,
  ContractAPI,
  DryRunDto,
  DryRunResultDto,
  ErrorCode,
  GalaChainErrorResponse,
  GalaChainResponse,
  GalaChainResponseType,
  GetObjectDto,
  GetObjectHistoryDto,
  NotFoundError,
  UserProfile,
  ValidationFailedError,
  createValidDTO,
  isValidUserAlias,
  signatures
} from "@gala-chain/api";
import { Contract } from "fabric-contract-api";

import { PublicKeyService } from "../services";
import { GalaChainContext, GalaChainContextConfig, GalaChainStub } from "../types";
import { getObjectHistory, getPlainObjectByKey } from "../utils";
import { getApiMethod, getApiMethods } from "./GalaContractApi";
import { EVALUATE, GalaTransaction, SUBMIT } from "./GalaTransaction";

export class BatchWriteLimitExceededError extends ValidationFailedError {
  constructor(writesLimit: number) {
    super(
      `Batch writes limit of ${writesLimit} keys exceeded. ` +
        `This operation can be repeated with a smaller batch.`
    );
  }
}

export class BatchPartialSuccessRequiredError extends ChainError {
  public readonly code: ErrorCode;

  constructor(index: number, error: GalaChainErrorResponse<unknown>) {
    const message = `Batch operation with index ${index} failed with error: ${error.ErrorKey}: ${error.Message}`;
    super(message, { index, error });
    this.code = error.ErrorCode;
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
    private readonly version: string,
    private readonly config: GalaChainContextConfig = {}
  ) {
    super(name);
  }

  public getVersion(): string {
    return this.version;
  }

  public createContext(): GalaChainContext {
    return new GalaChainContext(this.config);
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
  public async GetContractAPI(ctx: GalaChainContext): Promise<ContractAPI> {
    const api = this.getContractAPI() as ContractAPI & Record<string, unknown>;
    api.channelId = ctx.operationCtx.channelId;
    api.chaincodeId = ctx.operationCtx.chaincodeId;
    return api;
  }

  public getContractAPI(): ContractAPI {
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

    // If the caller public key is provided, we use it to set the dry run on behalf of the user.
    if (dto.callerPublicKey) {
      const ethAddr = signatures.getEthAddress(signatures.getNonCompactHexPublicKey(dto.callerPublicKey));
      const userProfile = await PublicKeyService.getUserProfile(ctx, ethAddr);

      if (!userProfile) {
        throw new NotFoundError(`User profile for ${ethAddr} not found`);
      }

      ctx.setDryRunOnBehalfOf({
        ...userProfile,
        signedByKeys: [],
        signatureQuorum: 0
      });
    }

    // If the signer address is provided, we use it to set the dry run on behalf of the user.
    // Initially we don't fetch the actual registered user to get actual roles, but we use the default roles.
    // That might be a future improvement.
    else if (dto.signerAddress && isValidUserAlias(dto.signerAddress)) {
      ctx.setDryRunOnBehalfOf({
        alias: dto.signerAddress,
        roles: [...UserProfile.DEFAULT_ROLES],
        signedByKeys: [],
        signatureQuorum: 0
      });
    }

    // If neither callerPublicKey nor signerAddress is provided, we throw an error.
    else {
      throw new ValidationFailedError("Either callerPublicKey or signerAddress must be provided");
    }

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
    enforceUniqueKey: true,
    description: "Submit a batch of transactions",
    allowedOrgs: [process.env.CURATOR_ORG_MSP ?? "CuratorOrg"]
  })
  public async BatchSubmit(ctx: GalaChainContext, batchDto: BatchDto): Promise<GalaChainResponse<unknown>[]> {
    const responses: GalaChainResponse<unknown>[] = [];
    const softWritesLimit = batchDto.writesLimit ?? BatchDto.WRITES_DEFAULT_LIMIT;
    const writesLimit = Math.min(softWritesLimit, BatchDto.WRITES_HARD_LIMIT);
    let writesCount = ctx.stub.getWritesCount();

    for (const [index, op] of batchDto.operations.entries()) {
      // Use sandboxed context to avoid flushes of writes and deletes, and populate
      // the stub with current writes and deletes.
      const sandboxCtx = ctx.createReadOnlyContext(index);
      sandboxCtx.stub.setWrites(ctx.stub.getWrites());
      sandboxCtx.stub.setDeletes(ctx.stub.getDeletes());

      // Execute the operation. Collect both successful and failed responses.
      let response: GalaChainResponse<unknown>;
      try {
        if (writesCount >= writesLimit) {
          throw new BatchWriteLimitExceededError(writesLimit);
        }

        const method = getApiMethod(this, op.method, (m) => m.isWrite && m.methodName !== "BatchSubmit");
        response = await this[method.methodName](sandboxCtx, op.dto);
      } catch (error) {
        response = GalaChainResponse.Error(error);
      }
      responses.push(response);

      // Update the current context with the writes and deletes if the operation
      // is successful.
      if (GalaChainResponse.isSuccess(response)) {
        ctx.stub.setWrites(sandboxCtx.stub.getWrites());
        ctx.stub.setDeletes(sandboxCtx.stub.getDeletes());
        writesCount = ctx.stub.getWritesCount();
      }

      // Store the first error if it's the first error we encounter.
      if (batchDto.noPartialSuccess && GalaChainResponse.isError(response)) {
        throw new BatchPartialSuccessRequiredError(index, response);
      }
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

    for (const [index, op] of batchDto.operations.entries()) {
      // Create a new context for each operation
      const sandboxCtx = ctx.createReadOnlyContext(index);

      // Execute the operation. Collect both successful and failed responses.
      let response: GalaChainResponse<unknown>;
      try {
        const method = getApiMethod(this, op.method, (m) => !m.isWrite && m.methodName !== "BatchEvaluate");
        response = await this[method.methodName](sandboxCtx, op.dto);
      } catch (error) {
        response = GalaChainResponse.Error(error);
      }
      responses.push(response);
    }
    return responses;
  }
}
