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
  AllowanceType,
  CreateTokenClassDto,
  CreateVestingTokenDto,
  FetchVestingTokenDto,
  TokenAllowance,
  TokenBalance,
  TokenClaim,
  TokenClass,
  TokenClassKey,
  TokenHold,
  TokenInstance,
  TokenMintAllowance,
  VestingToken,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, randomize, transactionSuccess, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";

describe("VestingToken", () => {
  const tokenClassKey = new TokenClassKey();
  tokenClassKey.collection = randomize("TEST");
  tokenClassKey.category = "Unit";
  tokenClassKey.type = "none";
  tokenClassKey.additionalKey = "none";

  test("Create Vesting Token", async () => {
    // Given
    const createTokenClassDto = new CreateTokenClassDto();
    const tokenClassKey = new TokenClassKey();
    tokenClassKey.collection = randomize("TEST");
    tokenClassKey.category = "Unit";
    tokenClassKey.type = "none";
    tokenClassKey.additionalKey = "none";

    // Gross - probably a lot of defaults/optionals I could leave off
    createTokenClassDto.network = currency.tokenClass().network;
    createTokenClassDto.decimals = currency.tokenClass().decimals;
    createTokenClassDto.maxCapacity = new BigNumber(1000);
    createTokenClassDto.maxSupply = new BigNumber(1000);
    createTokenClassDto.tokenClass = tokenClassKey;
    createTokenClassDto.name = currency.tokenClass().name;
    createTokenClassDto.symbol = currency.tokenClass().symbol;
    createTokenClassDto.description = currency.tokenClass().description;
    createTokenClassDto.totalMintAllowance = currency.tokenClass().totalMintAllowance;
    createTokenClassDto.totalBurned = currency.tokenClass().totalBurned;
    createTokenClassDto.contractAddress = currency.tokenClass().contractAddress;
    createTokenClassDto.metadataAddress = currency.tokenClass().metadataAddress;
    createTokenClassDto.rarity = currency.tokenClass().rarity;
    createTokenClassDto.image = currency.tokenClass().image;
    createTokenClassDto.isNonFungible = currency.tokenClass().isNonFungible;
    createTokenClassDto.authorities = currency.tokenClass().authorities;

    const { ctx, contract, writes } = fixture(GalaChainTokenContract).callingUser(users.testAdminId);

    const vestingTokenDto: CreateVestingTokenDto = await createValidDTO(CreateVestingTokenDto, {
      tokenClass: createTokenClassDto,
      startDate: ctx.txUnixTime + 1000 * 60,
      vestingName: "SuperTokenTGE",
      allocations: [
        {
          name: "allocation1",
          owner: users.testUser1Id,
          quantity: new BigNumber(100),
          cliff: 90,
          vestingDays: 1
        },
        {
          name: "allocation2",
          owner: users.testUser2Id,
          quantity: new BigNumber(50),
          cliff: 1,
          vestingDays: 2
        },
        {
          name: "allocation3",
          owner: users.testAdminId,
          quantity: new BigNumber(850),
          cliff: 0,
          vestingDays: 0
        }
      ]
    });

    // When
    const response = await contract.CreateVestingToken(ctx, vestingTokenDto);

    // Then
    // VestingToken (basic vesting token info)
    expect(response).toEqual(transactionSuccess());

    // Should have:
    // New Token class with supply=max
    // A balance for each allocation with locks
    // VestingToken object
    const allocation1 = vestingTokenDto.allocations[0];
    const allocation2 = vestingTokenDto.allocations[1];
    const allocation3 = vestingTokenDto.allocations[2];

    expect(writes).toMatchObject(
      writesMap(
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          ...tokenClassKey,
          owner: users.testUser1Id,
          quantity: allocation1.quantity,
          lockedHolds: [
            plainToInstance(TokenHold, {
              created: ctx.txUnixTime,
              createdBy: users.testUser1Id,
              expires:
                vestingTokenDto.startDate +
                1000 * 24 * 60 * 60 * (allocation1.cliff + allocation1.vestingDays),
              instanceId: 0,
              lockAuthority: users.testAdminId,
              name: "SuperTokenTGE-allocation1",
              quantity: allocation1.quantity,
              vestingPeriodStart: vestingTokenDto.startDate + 1000 * 24 * 60 * 60 * allocation1.cliff
            })
          ]
        }),
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          ...tokenClassKey,
          owner: users.testUser2Id,
          quantity: allocation2.quantity,
          lockedHolds: [
            plainToInstance(TokenHold, {
              created: ctx.txUnixTime,
              createdBy: users.testUser2Id,
              expires:
                vestingTokenDto.startDate +
                1000 * 24 * 60 * 60 * (allocation2.cliff + allocation2.vestingDays),
              instanceId: 0,
              lockAuthority: users.testAdminId,
              name: "SuperTokenTGE-allocation2",
              quantity: allocation2.quantity,
              vestingPeriodStart: vestingTokenDto.startDate + 1000 * 24 * 60 * 60 * allocation2.cliff
            })
          ]
        }),
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          ...tokenClassKey,
          owner: users.testAdminId,
          quantity: allocation3.quantity,
          lockedHolds: [
            plainToInstance(TokenHold, {
              created: ctx.txUnixTime,
              createdBy: users.testAdminId,
              expires: vestingTokenDto.startDate,
              instanceId: 0,
              lockAuthority: users.testAdminId,
              name: "SuperTokenTGE-allocation3",
              quantity: allocation3.quantity,
              vestingPeriodStart: vestingTokenDto.startDate
            })
          ]
        }),
        plainToInstance(TokenClass, {
          ...currency.tokenClass(),
          collection: tokenClassKey.collection,
          category: tokenClassKey.category,
          type: tokenClassKey.type,
          totalSupply: new BigNumber(1000),
          maxCapacity: new BigNumber(1000),
          maxSupply: new BigNumber(1000)
        }),
        plainToInstance(VestingToken, {
          ...tokenClassKey,
          vestingName: vestingTokenDto.vestingName,
          startDate: vestingTokenDto.startDate,
          allocations: vestingTokenDto.allocations
        })
      )
    );
  });

  test("Fetch Vesting Token Info", async () => {
    // Given
    const vestingTokenClassKey = new TokenClassKey();
    vestingTokenClassKey.collection = randomize("TEST");
    vestingTokenClassKey.category = "Unit";
    vestingTokenClassKey.type = "none";
    vestingTokenClassKey.additionalKey = "none";

    const vestingToken = new VestingToken();
    vestingToken.collection = vestingTokenClassKey.collection;
    vestingToken.category = "Unit";
    vestingToken.type = "none";
    vestingToken.additionalKey = "none";
    vestingToken.allocations = [];
    vestingToken.startDate = 123;
    vestingToken.vestingName = "SuperTokenTGE";

    const fetchVestingTokenDto: FetchVestingTokenDto = await createValidDTO(FetchVestingTokenDto, {
      tokenClasses: vestingTokenClassKey
    });

    const { ctx, contract } = fixture(GalaChainTokenContract).savedState(vestingToken);

    // When
    const response = await contract.FetchVestingTokens(ctx, fetchVestingTokenDto);

    // Then
    expect(response).toEqual(transactionSuccess());
  });
});

describe("Token Hold Helpers", () => {
  const newBalance = () =>
    new TokenBalance({
      owner: "user",
      collection: "test",
      category: "test",
      type: "test",
      additionalKey: "test"
    });

  const newLockedHold = (vestingPeriodStart: number | undefined, expires: number | undefined = undefined) =>
    new TokenHold({
      createdBy: "me",
      instanceId: new BigNumber(0),
      quantity: new BigNumber(1000),
      created: 10,
      expires: expires ?? 100,
      name: "test hold",
      lockAuthority: "me",
      vestingPeriodStart: vestingPeriodStart
    });

  test("isVestingHold returns true when vestingStartPeriod not undefined", () => {
    const vestedLockedHold = newLockedHold(25);

    expect(vestedLockedHold.isVestingHold()).toEqual(true);

    const unVestedLockedHold = newLockedHold(undefined);
    expect(unVestedLockedHold.isVestingHold()).toEqual(false);
  });

  test("isVestingStarted returns true when vestingStartPeriod defined and current time > vestingStartPeriod", () => {
    const currentTime = 30;

    const unVestedLockedHold = newLockedHold(undefined);
    expect(unVestedLockedHold.isVestingStarted(currentTime)).toEqual(false);

    const vestedLockedHold = newLockedHold(25);
    expect(vestedLockedHold.isVestingStarted(currentTime)).toEqual(true);
    expect(vestedLockedHold.isVestingStarted(currentTime + 100)).toEqual(true);
  });

  test("timeSinceStart returns correct value when vestingStartPeriod defined and current time > vestingStartPeriod", () => {
    const currentTime = 30;

    const unVestedLockedHold = newLockedHold(undefined);
    expect(unVestedLockedHold.timeSinceStart(currentTime)).toEqual(0);

    const vestedLockedHold = newLockedHold(25);
    expect(vestedLockedHold.timeSinceStart(currentTime)).toEqual(5);
    expect(vestedLockedHold.timeSinceStart(currentTime + 100)).toEqual(105);
  });

  test("totalTimeOfVestingPeriod returns true when vestingStartPeriod defined and current time > vestingStartPeriod", () => {
    const unVestedLockedHold = newLockedHold(undefined);
    expect(unVestedLockedHold.totalTimeOfVestingPeriod()).toEqual(0);

    const vestedLockedHold = newLockedHold(25);
    expect(vestedLockedHold.totalTimeOfVestingPeriod()).toEqual(75);
  });

  test("getLockedVestingQuantity", () => {
    let currentTime = 80;

    const unVestedLockedHold = newLockedHold(undefined);
    expect(unVestedLockedHold.getLockedVestingQuantity(currentTime)).toEqual(new BigNumber(0));

    // 1000 / 50 = 20 per period (day)
    // 100 - 80 = 20 periods (day)
    // 20 * 20 = 400
    let vestedLockedHold = newLockedHold(50);
    expect(vestedLockedHold.getLockedVestingQuantity(currentTime)).toEqual(new BigNumber(400));

    // 1000 / 4 = 250 per period (day)
    // (CT + 3 days) - CT = 3 periods (day)
    // 3 * 250 = 750
    const oneDay = 1000 * 60 * 60 * 24;
    currentTime = 1738939680;
    // starts one day before current time, expires three days after
    vestedLockedHold = newLockedHold(currentTime - oneDay, currentTime + 3 * oneDay);
    // result is 749.999999999999872 I could round this and say it's good, but want to think about maybe
    // sending in the token decimals to the method and having that handle it?
    // it could still happen with high enough decimals (e.g. 16 in this case)
    // expect(vestedLockedHold.getLockedVestingQuantity(currentTime)).toEqual(new BigNumber(750));
  });
});
