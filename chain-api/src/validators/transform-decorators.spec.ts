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
import { IsOptional } from "class-validator";

import { ChainCallDTO } from "../types";
import { deserialize, serialize } from "../utils";
import { BigNumberIsInteger, BigNumberIsNotNegative } from "./decorators";
import { BigNumberProperty } from "./transform-decorators";

describe("infinity", () => {
  it("validation should give errors when BigNumber is Infinity and has no flag", async () => {
    // Given
    class MockMintTokenDto extends ChainCallDTO {
      @BigNumberProperty()
      amount: BigNumber;
    }

    const NewFake = new MockMintTokenDto();
    NewFake.amount = new BigNumber(Infinity);

    // When
    const output = await NewFake.validate();

    // Then
    expect(output).toEqual([
      expect.objectContaining({
        constraints: expect.objectContaining({
          BigNumberIsNotInfinity: "amount must be finite BigNumber but is Infinity"
        })
      })
    ]);
  });

  it("validation should give no errors when BigNumber is Infinity and has allowInfinity flag", async () => {
    // Given
    class MockMintTokenDto extends ChainCallDTO {
      @BigNumberProperty({ allowInfinity: true })
      amount: BigNumber;
    }

    const NewFake = new MockMintTokenDto();
    NewFake.amount = new BigNumber(Infinity);
    // eslint-disable-next-line
    const expectedSerializedSubstring = `{\"amount\":\"Infinity\"}`;

    // When
    const output = await NewFake.validate();
    const serialized = serialize(NewFake);
    const deserialized = deserialize(MockMintTokenDto, serialized);

    // Then
    // check validation errors
    expect(output).toEqual([]);
    // check serialization and deserialization works properly
    expect(serialized).toEqual(expectedSerializedSubstring);
    expect(deserialized.amount).toEqual(NewFake.amount);
  });

  it("validation should give no errors when BigNumber is finite", async () => {
    // Given
    class MockMintTokenDto extends ChainCallDTO {
      @BigNumberProperty()
      amount: BigNumber;
    }

    const NewFake = new MockMintTokenDto();
    NewFake.amount = new BigNumber(5);
    // eslint-disable-next-line
    const expectedSerializedSubstring = `{\"amount\":\"5\"}`;

    // When
    const output = await NewFake.validate();
    const serialized = serialize(NewFake);
    const deserialized = deserialize(MockMintTokenDto, serialized);

    // Then
    expect(output.length).toEqual(0);

    // Then
    // check validation errors
    expect(output).toEqual([]);
    // check serialization and deserialization works properly
    expect(serialized).toEqual(expectedSerializedSubstring);
    expect(deserialized.amount).toEqual(NewFake.amount);
  });

  it("validation should give no errors when BigNumber is optional and property is not present", async () => {
    // Given
    class MockDto extends ChainCallDTO {
      @IsOptional()
      @BigNumberIsInteger()
      @BigNumberIsNotNegative()
      @BigNumberProperty()
      amount?: BigNumber;
    }

    const NewFake = new MockDto();
    // const expectedSerializedString = `{}`;

    // When
    const output = await NewFake.validate();
    const serialized = serialize(NewFake);
    const deserializezd = deserialize(MockDto, serialized);

    // Then
    expect(output.length).toEqual(0);
    expect(output).toEqual([]);
    expect(deserializezd.amount).toBeUndefined();
  });

  it("deserializing exponent-form string leaves amount as string and fails validation", async () => {
    class MockMintTokenDto extends ChainCallDTO {
      @BigNumberProperty()
      amount: BigNumber;
    }

    const deserialized = deserialize(MockMintTokenDto, `{"amount":"1e+999999999"}`);
    const output = await deserialized.validate();

    expect(typeof deserialized.amount).toBe("string");
    expect(deserialized.amount).toBe("1e+999999999");
    expect(output.length).toBeGreaterThan(0);
  });

  it("deserializing finite canonical decimals produces BigNumbers", async () => {
    class MockMintTokenDto extends ChainCallDTO {
      @BigNumberProperty()
      amount: BigNumber;
    }

    const five = deserialize(MockMintTokenDto, `{"amount":"5"}`);
    const onePointFive = deserialize(MockMintTokenDto, `{"amount":"1.5"}`);

    expect(BigNumber.isBigNumber(five.amount)).toBe(true);
    expect(five.amount.toFixed()).toBe("5");
    expect(BigNumber.isBigNumber(onePointFive.amount)).toBe(true);
    expect(onePointFive.amount.toFixed()).toBe("1.5");
  });

  it("deserializing over-long digit string leaves amount as string and fails validation", async () => {
    class MockMintTokenDto extends ChainCallDTO {
      @BigNumberProperty()
      amount: BigNumber;
    }

    const overLong = "9".repeat(300);
    const deserialized = deserialize(MockMintTokenDto, `{"amount":"${overLong}"}`);
    const output = await deserialized.validate();

    expect(typeof deserialized.amount).toBe("string");
    expect(deserialized.amount).toBe(overLong);
    expect(output.length).toBeGreaterThan(0);
  });
});
