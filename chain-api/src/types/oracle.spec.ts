import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import { ExternalToken } from "./OraclePriceAssertion";
import { TokenInstanceKey } from "./TokenInstance";
import { createValidDTO } from "./dtos";
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

    const tonUsdPriceAssertion = await createValidDTO(OraclePriceAssertionDto, {
      oracle: mockOracle,
      identity: mockOracleIdentity,
      externalBaseToken: tonDetails,
      externalQuoteToken: usdDetails,
      exchangeRate: new BigNumber(mockTonUsdQuote["the-open-network"].usd),
      timestamp: 0
    });

    const galaUsdPriceAssertion = await createValidDTO(OraclePriceAssertionDto, {
      oracle: mockOracle,
      identity: mockOracleIdentity,
      baseToken: galaTokenInstanceKey,
      externalQuoteToken: usdDetails,
      exchangeRate: new BigNumber(mockGalaUsdQuote.gala.usd),
      timestamp: 0
    });

    const mockAssertionDto = await createValidDTO(OraclePriceCrossRateAssertionDto, {
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
