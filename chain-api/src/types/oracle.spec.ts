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

import { ExternalToken } from "./OraclePriceAssertion";
import { TokenInstanceKey } from "./TokenInstance";
import { createValidDTO, createValidSubmitDTO } from "./dtos";
import { OraclePriceAssertionDto, OraclePriceCrossRateAssertionDto } from "./oracle";

describe("oracle.ts", () => {
  const mockOracle = "mock-oracle";
  const mockOracleIdentity = "client|mock-oracle";

  const galaTokenInstanceKey = plainToInstance(TokenInstanceKey, {
    collection: "GALA",
    category: "Unit",
    type: "none",
    additionalKey: "none"
  });

  const usdDetails = plainToInstance(ExternalToken, {
    name: "USD",
    symbol: "usd"
  });

  const tonDetails = plainToInstance(ExternalToken, {
    name: "Toncoin",
    symbol: "ton"
  });

  test("cross rate calculations", async () => {
    const mockTonUsdQuote = {
      "the-open-network": {
        usd: 5.5
      }
    };

    const mockGalaUsdQuote = {
      gala: {
        usd: 0.025
      }
    };

    const tonUsdPriceAssertion = await createValidSubmitDTO(OraclePriceAssertionDto, {
      oracle: mockOracle,
      identity: mockOracleIdentity,
      externalBaseToken: tonDetails,
      externalQuoteToken: usdDetails,
      exchangeRate: new BigNumber(mockTonUsdQuote["the-open-network"].usd),
      timestamp: 0
    });

    const galaUsdPriceAssertion = await createValidSubmitDTO(OraclePriceAssertionDto, {
      oracle: mockOracle,
      identity: mockOracleIdentity,
      baseToken: galaTokenInstanceKey,
      externalQuoteToken: usdDetails,
      exchangeRate: new BigNumber(mockGalaUsdQuote.gala.usd),
      timestamp: 0
    });

    const mockAssertionDto = await createValidSubmitDTO(OraclePriceCrossRateAssertionDto, {
      oracle: mockOracle,
      identity: mockOracleIdentity,
      baseTokenCrossRate: tonUsdPriceAssertion,
      quoteTokenCrossRate: galaUsdPriceAssertion,
      externalCrossRateToken: usdDetails,
      crossRate: new BigNumber("220")
    });

    const voidResult = mockAssertionDto.validateCrossRate();

    expect(voidResult).toBeUndefined();

    mockAssertionDto.crossRate = new BigNumber("42");

    expect(mockAssertionDto.validateCrossRate).toThrow();
  });
});
