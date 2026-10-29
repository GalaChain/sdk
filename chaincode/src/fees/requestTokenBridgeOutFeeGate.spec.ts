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
  ChainId,
  OracleBridgeFeeAssertion,
  OracleBridgeFeeAssertionDto,
  OracleDefinition,
  UnauthorizedError,
  ValidationFailedError,
  createValidSubmitDTO
} from "@gala-chain/api";
import { fixture, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { KnownOracles } from "../oracle";
import { currency } from "../testdata";
import { GalaChainContext } from "../types";
import { requestTokenBridgeOutFeeGate } from "./feeGateImplementations";

describe("requestTokenBridgeOutFeeGate", () => {
  const oracle = users.testUser1;
  const otherOracle = users.testUser2;

  function setup(authorities: string[]) {
    const oracleDefinition = new OracleDefinition();
    oracleDefinition.name = KnownOracles.Bridge;
    oracleDefinition.authorities = authorities;

    return fixture<GalaChainContext, GalaChainTokenContract>(GalaChainTokenContract)
      .callingUser(oracle)
      .registeredUsers(oracle, otherOracle, users.attacker)
      .savedState(oracleDefinition);
  }

  async function feeAssertion(signingIdentity: string, signerKey: string, timestamp: number) {
    return createValidSubmitDTO(OracleBridgeFeeAssertionDto, {
      galaDecimals: 8,
      bridgeToken: currency.tokenClassKey(),
      bridgeTokenIsNonFungible: false,
      estimatedTxFeeUnitsTotal: new BigNumber("0"),
      estimatedPricePerTxFeeUnit: new BigNumber("0"),
      estimatedTotalTxFeeInExternalToken: new BigNumber("0"),
      estimatedTotalTxFeeInGala: new BigNumber("0"),
      timestamp,
      signingIdentity,
      destinationChainId: ChainId.Ethereum
    }).signed(signerKey);
  }

  function storedFeeAssertions(writes: Record<string, string>): OracleBridgeFeeAssertion[] {
    return Object.entries(writes)
      .filter(([key]) => key.includes(OracleBridgeFeeAssertion.INDEX_KEY))
      .map(([, value]) => JSON.parse(value));
  }

  async function run(authorities: string[], signingIdentity: string, signerKey: string, timestamp?: number) {
    const { ctx, getWrites } = setup(authorities);
    const assertion = await feeAssertion(signingIdentity, signerKey, timestamp ?? ctx.txUnixTime);
    const runGate = requestTokenBridgeOutFeeGate(ctx, {
      destinationChainId: ChainId.Ethereum,
      tokenInstance: currency.tokenInstanceKey(),
      quantity: new BigNumber("1"),
      destinationChainTxFee: assertion
    });
    return { ctx, getWrites, runGate };
  }

  it("accepts an assertion signed by a listed authority and saves that alias", async () => {
    const { ctx, getWrites, runGate } = await run(
      [oracle.identityKey],
      oracle.identityKey,
      oracle.privateKey
    );

    await runGate;
    await ctx.stub.flushWrites();

    expect(storedFeeAssertions(getWrites())).toEqual([
      expect.objectContaining({ oracle: KnownOracles.Bridge, signingIdentity: oracle.identityKey })
    ]);
  });

  it("accepts an authority listed by eth address and still saves the alias", async () => {
    const { ctx, getWrites, runGate } = await run([oracle.ethAddress], oracle.identityKey, oracle.privateKey);

    await runGate;
    await ctx.stub.flushWrites();

    expect(storedFeeAssertions(getWrites())).toEqual([
      expect.objectContaining({ signingIdentity: oracle.identityKey })
    ]);
  });

  it("rejects a registered user who claims another authority", async () => {
    const { getWrites, runGate } = await run(
      [oracle.identityKey],
      oracle.identityKey,
      users.attacker.privateKey
    );

    await expect(runGate).rejects.toThrow(UnauthorizedError);
    expect(getWrites()).toEqual({});
  });

  it("rejects an unregistered key that claims an authority", async () => {
    const throwaway = users.random();
    const { getWrites, runGate } = await run([oracle.identityKey], oracle.identityKey, throwaway.privateKey);

    await expect(runGate).rejects.toThrow(UnauthorizedError);
    expect(getWrites()).toEqual({});
  });

  it("rejects an authority that claims a different authority", async () => {
    const { getWrites, runGate } = await run(
      [oracle.identityKey, otherOracle.identityKey],
      otherOracle.identityKey,
      oracle.privateKey
    );

    await expect(runGate).rejects.toThrow(UnauthorizedError);
    expect(getWrites()).toEqual({});
  });

  it("rejects an expired assertion from a listed authority", async () => {
    const { getWrites, runGate } = await run([oracle.identityKey], oracle.identityKey, oracle.privateKey, 0);

    await expect(runGate).rejects.toThrow(ValidationFailedError);
    expect(getWrites()).toEqual({});
  });
});
