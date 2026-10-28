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
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import {
  CreateNftCollectionDto,
  CreateTokenClassDto,
  GrantAllowanceQuantity,
  TokenClass,
  TokenHold,
  TransferTokenDto,
  UserAlias,
  createValidChainObject,
  createValidDTO
} from "../types";
import { BigNumberProperty } from "./transform-decorators";

class OptionalInfinityQuantity {
  @BigNumberProperty({ allowInfinity: true })
  quantity: BigNumber;
}

describe("token class numbers", () => {
  const tokenClassKey = {
    collection: "CC",
    category: "Currency",
    type: "TEST",
    additionalKey: "none"
  };

  it("rejects a fractional token decimal precision", async () => {
    const dto = plainToInstance(CreateTokenClassDto, {
      tokenClass: tokenClassKey,
      name: "Name",
      symbol: "SYM",
      description: "A token",
      image: "http://example.com/a.png",
      decimals: 1.5,
      uniqueKey: "decimals-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "decimals")).toBe(true);
  });

  it("accepts a zero max supply as unlimited and a zero burned total", async () => {
    const tokenClass = await createValidChainObject(TokenClass, {
      ...tokenClassKey,
      network: "GC",
      decimals: 0,
      maxSupply: new BigNumber("0"),
      isNonFungible: false,
      maxCapacity: new BigNumber("0"),
      authorities: ["client|admin" as UserAlias],
      name: "Name",
      symbol: "SYM",
      description: "A token",
      image: "http://example.com/a.png",
      totalBurned: new BigNumber("0"),
      totalMintAllowance: new BigNumber("0"),
      totalSupply: new BigNumber("0")
    });

    expect(tokenClass.maxSupply.isZero()).toBe(true);
    expect(tokenClass.totalBurned.isZero()).toBe(true);
  });

  it("accepts a fungible hold instance of zero", async () => {
    const hold = plainToInstance(TokenHold, {
      createdBy: "client|admin",
      instanceId: "0",
      quantity: "1",
      created: 1,
      expires: 0
    });

    const errors = await validate(hold);
    expect(errors.some((error) => error.property === "instanceId")).toBe(false);
  });

  it("rejects a zero transfer quantity", async () => {
    const dto = plainToInstance(TransferTokenDto, {
      to: "client|bob",
      tokenInstance: { ...tokenClassKey, instance: "1" },
      quantity: "0",
      uniqueKey: "zero-quantity"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "quantity")).toBe(true);
  });

  it("accepts zero and Infinity as unlimited supply bounds", async () => {
    for (const bound of ["0", "Infinity"]) {
      const dto = await createValidDTO(CreateTokenClassDto, {
        tokenClass: tokenClassKey,
        name: "Name",
        symbol: "SYM",
        description: "A token",
        image: "http://example.com/a.png",
        maxSupply: bound,
        maxCapacity: bound,
        uniqueKey: `bound-${bound}`
      } as any);

      expect(dto.maxSupply?.isEqualTo(new BigNumber(bound))).toBe(true);
      expect(dto.maxCapacity?.isEqualTo(new BigNumber(bound))).toBe(true);
    }
  });

  it("accepts zero and Infinity as unlimited NFT collection bounds", async () => {
    for (const bound of ["0", "Infinity"]) {
      const dto = await createValidDTO(CreateNftCollectionDto, {
        collection: "TestCollection",
        category: "Weapon",
        type: "Sword",
        additionalKey: "none",
        name: "Test Sword",
        symbol: "TSW",
        description: "A test sword",
        image: "https://example.com/image.png",
        maxSupply: bound,
        maxCapacity: bound,
        uniqueKey: `nft-bound-${bound}`
      } as any);

      expect(dto.maxSupply?.isEqualTo(new BigNumber(bound))).toBe(true);
      expect(dto.maxCapacity?.isEqualTo(new BigNumber(bound))).toBe(true);
    }
  });

  it("accepts an infinite max supply on a persisted token class", async () => {
    const tokenClass = await createValidChainObject(TokenClass, {
      ...tokenClassKey,
      network: "GC",
      decimals: 0,
      maxSupply: new BigNumber("Infinity"),
      isNonFungible: false,
      maxCapacity: new BigNumber("Infinity"),
      authorities: ["client|admin" as UserAlias],
      name: "Name",
      symbol: "SYM",
      description: "A token",
      image: "http://example.com/a.png",
      totalBurned: new BigNumber("0"),
      totalMintAllowance: new BigNumber("0"),
      totalSupply: new BigNumber("0")
    });

    expect(tokenClass.maxSupply.isEqualTo(new BigNumber("Infinity"))).toBe(true);
  });

  it("rejects NaN when infinity is allowed and still accepts positive infinity", async () => {
    const nanQuantity = plainToInstance(OptionalInfinityQuantity, { quantity: "NaN" });
    const negativeInfinity = plainToInstance(OptionalInfinityQuantity, { quantity: "-Infinity" });
    const positiveInfinity = plainToInstance(OptionalInfinityQuantity, { quantity: "Infinity" });

    expect(await validate(nanQuantity)).not.toHaveLength(0);
    expect(await validate(negativeInfinity)).not.toHaveLength(0);
    expect(await validate(positiveInfinity)).toHaveLength(0);

    const allowance = plainToInstance(GrantAllowanceQuantity, {
      user: "client|alice",
      quantity: "NaN"
    });
    const allowanceErrors = await validate(allowance);
    expect(allowanceErrors.some((error) => error.property === "quantity")).toBe(true);
    expect(JSON.stringify(allowanceErrors)).toContain("NaN");
  });
});
