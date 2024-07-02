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
import { ChainCallDTO, ChainKey, ChainObject, GalaChainResponse } from "@gala-chain/api";
import { NotImplementedError } from "@gala-chain/api";
import { Exclude } from "class-transformer";
import { IsPositive } from "class-validator";
import { Transaction } from "fabric-contract-api";

import { version } from "../../package.json";
import { EVALUATE, GalaContract, GalaTransaction, SUBMIT } from "../contracts";
import { GalaChainContext, createValidChainObject } from "../types";
import { getObjectsByPartialCompositeKey, putChainObject } from "../utils/state";

export class SuperheroDto extends ChainCallDTO {
  public name: string;

  @IsPositive()
  public age: number;

  public static create(name: string, age: number) {
    const dto = new SuperheroDto();
    dto.name = name;
    dto.age = age;

    return dto;
  }
}

export class SuperheroQueryDto extends ChainCallDTO {
  // this is used to check if chaincode uses cache
  public saveBeforeReturn: SuperheroDto[];
}

export class Superhero extends ChainObject {
  @ChainKey({ position: 0 })
  public name: string;

  public age: number;

  @Exclude()
  public static readonly INDEX_KEY: string = "superhero";
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

  @Transaction()
  public async IncrementTwiceWrong(ctx: GalaChainContext, key: string): Promise<GalaChainResponse<void>> {
    const getOrZero = async (): Promise<number> => +(await ctx.stub.getState(key)).toString() ?? 0;
    const incrementedFirstTime = (await getOrZero()) + 1;
    await ctx.stub.putState(key, Buffer.from(incrementedFirstTime.toString()));

    // This is intentional to verify this works - gets 0 in this place, because Fabric works
    // this way. At the end the value is incremented only once.
    const incrementedSecondTime = (await getOrZero()) + 1;
    await ctx.stub.putState(key, Buffer.from(incrementedSecondTime.toString()));

    return GalaChainResponse.Success(undefined);
  }

  @GalaTransaction({
    type: SUBMIT,
    in: SuperheroDto,
    allowedOrgs: ["CuratorOrg"]
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
}
