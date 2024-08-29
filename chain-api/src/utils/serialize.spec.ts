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
import { ArrayMinSize, IsString } from "class-validator";

import { toUtf8Bytes } from "../ethers/utils/utf8";
import { ChainCallDTO, ChainObject } from "../types";
import { BigNumberProperty } from "../validators";
import serialize from "./serialize";

class TestDTO extends ChainCallDTO {
  @BigNumberProperty()
  quantity: BigNumber;

  @IsString({ each: true })
  @ArrayMinSize(1)
  names: string[];
}

class TestChainObject extends ChainObject {
  @BigNumberProperty()
  quantity: BigNumber;

  @IsString({ each: true })
  @ArrayMinSize(1)
  names: string[];
}

function createTestObjects(plain: { quantity: BigNumber; names: string[] }) {
  const dto = new TestDTO();
  dto.quantity = plain.quantity;
  dto.names = plain.names;

  const chainObject = new TestChainObject();
  chainObject.quantity = plain.quantity;
  chainObject.names = plain.names;

  return { dto, chainObject, plain };
}

it("should sort fields", () => {
  // Given
  const obj = { c: 8, b: [{ z: 6, y: 5, x: 4 }, 7], a: 3 };

  // When
  const serialized = serialize(obj);

  // Then
  expect(serialized).toEqual('{"a":3,"b":[{"x":4,"y":5,"z":6},7],"c":8}');
});

// Known issue, we used `sort-keys-recursive` before, which does sort arrays
it("should not sort arrays", () => {
  // Given
  const { dto, chainObject, plain } = createTestObjects({
    quantity: new BigNumber("1.23"),
    names: ["Bob", "Alice", "Chris"]
  });
  const expectedClassS = '{"names":["Bob","Alice","Chris"],"quantity":"1.23"}';
  const expectedPlainS = '{"names":["Bob","Alice","Chris"],"quantity":{"c":[1,23000000000000],"e":0,"s":1}}';

  // When
  const [plainS, dtoS, chainObjectS] = [plain, dto, chainObject].map((o) => serialize(o));

  // Then
  expect(dtoS).toEqual(expectedClassS);
  expect(chainObjectS).toEqual(expectedClassS);
  expect(plainS).toEqual(expectedPlainS);
});

it("should handle very large numbers with decimals", () => {
  // Given
  const largeNumberS = "12300000000000000000000000000000.456"; // Note no exp notation
  const largeNumber = new BigNumber(largeNumberS);
  expect(largeNumber.isGreaterThan(Number.MAX_SAFE_INTEGER)).toEqual(true);

  const { dto, chainObject, plain } = createTestObjects({
    quantity: largeNumber,
    names: ["Alice"]
  });
  const expectedClassS = `{"names":["Alice"],"quantity":"${largeNumberS}"}`;
  const expectedPlainS = '{"names":["Alice"],"quantity":{"c":[1230,0,0,45600000000000],"e":31,"s":1}}';

  // When
  const [plainS, dtoS, chainObjectS] = [plain, dto, chainObject].map((o) => serialize(o));

  // Then
  expect(dtoS).toEqual(expectedClassS);
  expect(chainObjectS).toEqual(expectedClassS);
  expect(plainS).toEqual(expectedPlainS);
});

it("should handle very large numbers with no decimals", () => {
  // Given
  const largeNumberS = "900000000000000000000000000000"; // Note no exp notation
  const largeNumber = new BigNumber(largeNumberS);
  expect(largeNumber.isGreaterThan(Number.MAX_SAFE_INTEGER)).toEqual(true);

  const { dto, chainObject, plain } = createTestObjects({
    quantity: largeNumber,
    names: ["Alice"]
  });
  const expectedClassS = `{"names":["Alice"],"quantity":"${largeNumberS}"}`;
  const expectedPlainS = '{"names":["Alice"],"quantity":{"c":[90],"e":29,"s":1}}';

  // When
  const [plainS, dtoS, chainObjectS] = [plain, dto, chainObject].map((o) => serialize(o));

  // Then
  expect(dtoS).toEqual(expectedClassS);
  expect(chainObjectS).toEqual(expectedClassS);
  expect(plainS).toEqual(expectedPlainS);
});

it("Bignumber toUtf8Bytes", () => {
  const bigNumber = BigNumber("300");
  expect(toUtf8Bytes(bigNumber)).toEqual(toUtf8Bytes("300"));
});
