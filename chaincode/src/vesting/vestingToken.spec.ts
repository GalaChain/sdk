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
  FetchVestingTokenInfoDto,
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

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testAdminId)

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
        }]
    });

    // When
    const response = await contract.CreateVestingToken(ctx, vestingTokenDto);
    
    // Then
    // VestingToken (basic vesting token info)
    expect(response).toEqual(transactionSuccess());
    
    // Should have
    // New Token class with supply=max
    // A balance for each allocation with locks
    // VestingToken object
    const allocation1 = vestingTokenDto.allocations[0]
    const allocation2 = vestingTokenDto.allocations[1]

    expect(writes).toMatchObject(
      writesMap(
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          ...tokenClassKey,
          owner: users.testUser1Id,
          quantity: allocation1.quantity,
          lockedHolds: [plainToInstance(TokenHold, {
            created: ctx.txUnixTime,
            createdBy: users.testUser1Id,
            expires: vestingTokenDto.startDate + 1000 * 24 * 60 * 60 * (allocation1.cliff),
            instanceId: 0,
            lockAuthority: users.testAdminId,
            name: "SuperTokenTGE-allocation1-0",
            quantity: 100
          })]
        }),
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          ...tokenClassKey,
          owner: users.testUser2Id,
          quantity: new BigNumber("50"),
          lockedHolds: [
            plainToInstance(TokenHold, {
              created: ctx.txUnixTime,
              createdBy: users.testUser2Id,
              expires: vestingTokenDto.startDate + 1000 * 24 * 60 * 60 * (allocation2.cliff),
              instanceId: 0,
              lockAuthority: users.testAdminId,
              name: "SuperTokenTGE-allocation2-0",
              quantity: 25
            }),
            plainToInstance(TokenHold, {
              created: ctx.txUnixTime,
              createdBy: users.testUser2Id,
              expires: vestingTokenDto.startDate + 1000 * 24 * 60 * 60 * (allocation2.cliff + 1),
              instanceId: 0,
              lockAuthority: users.testAdminId,
              name: "SuperTokenTGE-allocation2-1",
              quantity: 25
            })
          ]
        }),
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          ...tokenClassKey,
          owner: users.testAdminId,
          quantity: new BigNumber("850")
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
    let vestingTokenClassKey = new TokenClassKey
    vestingTokenClassKey.collection = randomize("TEST");
    vestingTokenClassKey.category = "Unit";
    vestingTokenClassKey.type = "none";
    vestingTokenClassKey.additionalKey = "none";

    let vestingToken = new VestingToken();
    vestingToken.collection = vestingTokenClassKey.collection
    vestingToken.category = "Unit";
    vestingToken.type = "none";
    vestingToken.additionalKey = "none";
    vestingToken.allocations = [];
    vestingToken.startDate = 123;
    vestingToken.vestingName = "SuperTokenTGE"


    const fetchVestingTokenInfoDto: FetchVestingTokenInfoDto = await createValidDTO(FetchVestingTokenInfoDto, {
      tokenClasses: vestingTokenClassKey
    });

    const { ctx, contract } = fixture(GalaChainTokenContract)
      .savedState(vestingToken);

    // When
    const response = await contract.FetchVestingTokens(ctx, fetchVestingTokenInfoDto);

    // Then
    expect(response).toEqual(transactionSuccess());
  });
});
