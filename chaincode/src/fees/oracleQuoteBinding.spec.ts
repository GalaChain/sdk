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
import { OracleBridgeFeeAssertionDto, TokenClassKey, TokenInstance, TokenInstanceKey } from "@gala-chain/api";
import BigNumber from "bignumber.js";

import { assertOracleQuoteMatchesTransfer } from "./feeGateImplementations";

const token = {
  collection: "GALA",
  category: "Unit",
  type: "none",
  additionalKey: "none",
  instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
} as TokenInstanceKey;

function quote(overrides: Partial<OracleBridgeFeeAssertionDto> = {}): OracleBridgeFeeAssertionDto {
  return {
    destinationChainId: 2,
    bridgeToken: token,
    bridgeTokenIsNonFungible: false,
    ...overrides
  } as OracleBridgeFeeAssertionDto;
}

describe("oracle quote binding", () => {
  it("accepts a quote for the same token, fungible flag, and destination", () => {
    expect(() =>
      assertOracleQuoteMatchesTransfer(quote(), { destinationChainId: 2, tokenInstance: token })
    ).not.toThrow();
  });

  it("rejects a quote for a different token, fungible flag, or destination", () => {
    const nft = { ...token, instance: new BigNumber("1") } as TokenInstanceKey;

    expect(() =>
      assertOracleQuoteMatchesTransfer(quote({ destinationChainId: 1001 }), {
        destinationChainId: 2,
        tokenInstance: token
      })
    ).toThrow(/destination/);

    expect(() =>
      assertOracleQuoteMatchesTransfer(quote(), { destinationChainId: 2, tokenInstance: nft })
    ).toThrow(/non-fungible/);

    expect(() =>
      assertOracleQuoteMatchesTransfer(
        quote({ bridgeToken: { ...token, collection: "OTHER" } as TokenClassKey }),
        { destinationChainId: 2, tokenInstance: token }
      )
    ).toThrow(/different token/);
  });
});
