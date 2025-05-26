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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {
  ChainCallDTO,
  ChainKey,
  ChainObject,
  GalaChainResponse,
  NotFoundError,
  NotImplementedError,
  SubmitCallDTO,
  createValidChainObject,
  randomUniqueKey
} from "@gala-chain/api";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsPositive, IsString, ValidateNested } from "class-validator";
import { Transaction } from "fabric-contract-api";

import { version } from "../../package.json";
import {
  EVALUATE,
  GalaContract,
  GalaTransaction,
  SUBMIT,
  Submit,
  UnsignedEvaluate,
  requireCuratorAuth
} from "../contracts";
import { GalaChainContext } from "../types";
import { getObjectsByPartialCompositeKey, putChainObject } from "../utils";

export class SuperheroDto extends SubmitCallDTO {
  public name: string;

  @IsPositive()
  public age: number;

  public static create(name: string, age: number) {
    const dto = new SuperheroDto();
    dto.name = name;
    dto.age = age;
    dto.uniqueKey = randomUniqueKey();

    return dto;
  }
}

export class SuperheroQueryDto extends ChainCallDTO {
  // this is used to check if chaincode uses cache
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuperheroDto)
  public saveBeforeReturn: SuperheroDto[];
}

export class Superhero extends ChainObject {
  @IsString()
  @ChainKey({ position: 0 })
  public name: string;

  @IsPositive()
  public age: number;

  @Exclude()
  public static readonly INDEX_KEY: string = "superhero";
}

export class KVDto extends ChainCallDTO {
  @IsNotEmpty()
  public key: string;

  public value?: string;
}

export class NestedKVDto extends ChainCallDTO {
  @IsNotEmpty()
  public key: string;

  public text?: string;

  public map?: Record<string, unknown>;

  public counter?: number;

  public array?: Array<unknown>;
}

export default class TestGalaContract extends GalaContract {
  constructor() {
    super("TestGalaContract", version);
  }

  @Transaction()
  public async Put(ctx: GalaChainContext, key: string, value: string): Promise<GalaChainResponse<void>> {
    return GalaChainResponse.Success(await ctx.stub.putState(key, Buffer.from(value)));
  }

  @Transaction()
  public async Get(ctx: GalaChainContext, key: string): Promise<GalaChainResponse<string>> {
    return GalaChainResponse.Success((await ctx.stub.getState(key)).toString());
  }

  @Transaction()
  public async ErrorAfterPut(
    ctx: GalaChainContext,
    key: string,
    value: string
  ): Promise<GalaChainResponse<string>> {
    try {
      await this.Put(ctx, key, value);
      throw new NotImplementedError("Some error after put was invoked");
    } catch (e) {
      return GalaChainResponse.Error(e as Error);
    }
  }

  @GalaTransaction({
    type: SUBMIT,
    in: KVDto,
    enforceUniqueKey: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async PutKv(ctx: GalaChainContext, dto: KVDto): Promise<void> {
    await ctx.stub.putState(dto.key, Buffer.from(dto.value ?? "placeholder"));
  }

  @UnsignedEvaluate({
    in: KVDto
  })
  public async GetKv(ctx: GalaChainContext, dto: KVDto): Promise<string> {
    const response = (await ctx.stub.getState(dto.key)).toString();
    if (response === "") {
      throw new NotFoundError(`Object ${dto.key} not found`);
    }
    return response;
  }

  @GalaTransaction({
    type: SUBMIT,
    in: KVDto,
    enforceUniqueKey: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async ErrorAfterPutKv(ctx: GalaChainContext, dto: KVDto): Promise<void> {
    await this.PutKv(ctx, dto);
    throw new NotImplementedError("Some error after put was invoked");
  }

  @Transaction()
  public async IncrementTwiceWrong(ctx: GalaChainContext, key: string): Promise<GalaChainResponse<void>> {
    const getOrZero = async (): Promise<number> => +(await ctx.stub.getState(key)).toString();
    const incrementedFirstTime = (await getOrZero()) + 1;
    await ctx.stub.putState(key, Buffer.from(incrementedFirstTime.toString()));

    // This is intentional to verify this works - gets 0 in this place, because Fabric works
    // this way. At the end the value is incremented only once.
    const incrementedSecondTime = (await getOrZero()) + 1;
    await ctx.stub.putState(key, Buffer.from(incrementedSecondTime.toString()));

    return GalaChainResponse.Success(undefined);
  }

  @Submit({
    in: SuperheroDto,
    ...requireCuratorAuth
  })
  public async CreateSuperhero(ctx: GalaChainContext, dto: SuperheroDto): Promise<GalaChainResponse<void>> {
    ctx.logger.info(`Creating superhero ${dto.name}`);

    const superhero = new Superhero();
    superhero.name = dto.name;
    superhero.age = dto.age;
    await putChainObject(ctx, superhero);

    return GalaChainResponse.Success(undefined);
  }

  @GalaTransaction({
    type: EVALUATE,
    in: SuperheroQueryDto,
    out: "object"
  })
  public async QuerySuperheroes(ctx: GalaChainContext, dto: SuperheroQueryDto) {
    // populate cache with saves
    await Promise.all(
      dto.saveBeforeReturn.map(async (s) => {
        const superhero = await createValidChainObject(Superhero, s);
        await putChainObject(ctx, superhero);
      })
    );

    return getObjectsByPartialCompositeKey(ctx, Superhero.INDEX_KEY, [], Superhero);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: NestedKVDto,
    enforceUniqueKey: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async PutNestedKv(ctx: GalaChainContext, dto: NestedKVDto): Promise<void> {
    const { uniqueKey, ...rest } = dto;
    const value = JSON.stringify(rest);
    await ctx.stub.putState(dto.key, Buffer.from(value));
  }

  @GalaTransaction({
    type: EVALUATE,
    in: NestedKVDto
  })
  public async GetNestedKv(ctx: GalaChainContext, dto: NestedKVDto): Promise<unknown> {
    const response = (await ctx.stub.getState(dto.key)).toString();
    if (response === "") {
      throw new NotFoundError(`Object ${dto.key} not found`);
    }
    return JSON.parse(response);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: NestedKVDto,
    enforceUniqueKey: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async ErrorAfterPutNestedKv(ctx: GalaChainContext, dto: NestedKVDto): Promise<void> {
    const value = JSON.stringify(dto);
    await ctx.stub.putState(dto.key, Buffer.from(value));

    throw new NotImplementedError("Some error after put was invoked");
  }

  @GalaTransaction({
    type: SUBMIT,
    in: NestedKVDto,
    enforceUniqueKey: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async GetSetPutNestedKv(ctx: GalaChainContext, dto: NestedKVDto): Promise<unknown> {
    const response = (await ctx.stub.getCachedState(dto.key)).toString();
    if (response === "") {
      const { uniqueKey, ...rest } = dto;
      const value = JSON.stringify(rest);
      await ctx.stub.putState(dto.key, Buffer.from(value));
      return rest;
    }

    let previous: NestedKVDto;

    try {
      previous = JSON.parse(response);
    } catch (e) {
      throw new Error(`Failed to parse previous value: ${response} -- ${e}`);
    }

    const updated = { ...previous };

    if (dto.text) {
      updated.text = dto.text;
    }

    if (dto.map) {
      updated.map = updated.map ? { ...updated.map, ...dto.map } : { ...dto.map };
    }

    if (dto.counter) {
      updated.counter = updated.counter ? updated.counter + dto.counter : dto.counter;
    }

    if (dto.array) {
      updated.array = updated.array ? [...updated.array, ...dto.array] : [...dto.array];
    }

    try {
      const value = JSON.stringify(updated);
      await ctx.stub.putState(dto.key, Buffer.from(value));
    } catch (e) {
      throw new Error(`Failed to stringify and save updated dto: ${e}`);
    }

    return updated;
  }

  @GalaTransaction({
    type: SUBMIT,
    in: NestedKVDto,
    enforceUniqueKey: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async UnterminatedAsyncErrorOp(ctx: GalaChainContext, dto: NestedKVDto): Promise<void> {
    // using 25ms delay to be sure that the operation will be called after
    // the transaction is committed, but before the DelayedOp
    setTimeout(() => ctx.stub.putState(dto.key, Buffer.from(dto.text ?? "")), 25);
    throw new Error("Async operation was not awaited");
  }

  @GalaTransaction({
    type: SUBMIT,
    in: NestedKVDto,
    enforceUniqueKey: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async DelayedOp(ctx: GalaChainContext, dto: NestedKVDto): Promise<unknown> {
    // using 50ms delay to be sure that the actual state change is applied before
    // the UnterminatedAsyncErrorOp is finished, but the wait is enough to see
    // the potential effect of the state change by UnterminatedAsyncErrorOp
    const result = await ctx.stub.putState(dto.key, Buffer.from(dto.text ?? ""));
    await new Promise((resolve) => setTimeout(() => resolve(undefined), 50));
    return result;
  }

  @GalaTransaction({
    type: SUBMIT,
    in: ChainCallDTO,
    enforceUniqueKey: true,
    allowedOrgs: ["CuratorOrg"]
  })
  public async GetCtxData(ctx: GalaChainContext, dto: ChainCallDTO): Promise<unknown> {
    return {
      callingUser: ctx.callingUser,
      txId: ctx.stub.getTxID(),
      txUnixTime: ctx.txUnixTime
    };
  }
}
