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
  GalaChainResponse,
  GrantAllowanceDto,
  TokenAllowance,
  TokenBalance,
  TokenInstance,
  TokenInstanceQueryKey,
  TokenMintAllowance,
  TokenMintAllowanceRequest,
  TokenMintStatus,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { instanceToInstance, instanceToPlain, plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { InvalidDecimalError, NotATokenAuthorityError } from "../token/TokenError";
import { inverseEpoch, inverseTime } from "../utils";
import { DuplicateAllowanceError, DuplicateUserError, InsufficientTokenBalanceError } from "./AllowanceError";
import { grantAllowance } from "./grantAllowance";

describe("GrantAllowance", () => {
  it("should GrantAllowance", async () => {
    const nftInstance = plainToInstance(TokenInstance, { ...nft.tokenInstance1(), owner: users.testUser2Id });
    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const nftInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, nft.tokenInstance1KeyPlain());

    const nftBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2Id,
      ...nftClassKey,
      instanceIds: [new BigNumber("1")],
      quantity: new BigNumber("1")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(nftClass, nftInstance, nftBalance);

    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    const allowance = nft.tokenAllowance((a) => ({ ...a, created: ctx.txUnixTime }));
    expect(response).toEqual(GalaChainResponse.Success([allowance]));
    expect(writes).toEqual(writesMap(allowance));
  });

  it("should fail to GrantAllowance when quantity is less than decimal limit", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstanceQueryKey = await createValidDTO(
      TokenInstanceQueryKey,
      currency.tokenInstanceKeyPlain()
    );

    const currencyBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2Id,
      ...currencyClassKey,
      instanceIds: [],
      quantity: new BigNumber("1000")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const decimalQuantity = new BigNumber("0.000000000001");

    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: decimalQuantity }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new InvalidDecimalError(decimalQuantity, currencyClass.decimals))
    );
    expect(writes).toEqual({});
  });

  it("should fail to GrantAllowance for fungible token when quantity is greater than balance", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstanceQueryKey = await createValidDTO(
      TokenInstanceQueryKey,
      currency.tokenInstanceKeyPlain()
    );

    const currencyBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2Id,
      ...currencyClassKey,
      instanceIds: [],
      quantity: new BigNumber("1000")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: new BigNumber("1001") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new InsufficientTokenBalanceError(
          users.testUser2Id,
          currencyInstanceKey.toStringKey(),
          AllowanceType[AllowanceType.Lock],
          new BigNumber("1000"),
          new BigNumber("1001")
        )
      )
    );
    expect(writes).toEqual({});
  });

  it("should GrantAllowance for fungible token when quantity is exactly balance", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstanceQueryKey = await createValidDTO(
      TokenInstanceQueryKey,
      currency.tokenInstanceKeyPlain()
    );

    const currencyBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2Id,
      ...currencyClassKey,
      instanceIds: [],
      quantity: new BigNumber("1000")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: new BigNumber("1000") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    const allowance = currency.tokenAllowance((a) => ({
      ...a,
      created: ctx.txUnixTime,
      quantity: new BigNumber("1000"),
      grantedBy: users.testUser2Id,
      grantedTo: users.testUser1Id,
      allowanceType: AllowanceType.Lock
    }));
    expect(response).toEqual(GalaChainResponse.Success([allowance]));
    expect(writes).toEqual(writesMap(allowance));
  });

  it("ensures a unique set of users", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstanceQueryKey = await createValidDTO(
      TokenInstanceQueryKey,
      currency.tokenInstanceKeyPlain()
    );

    const currencyBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2Id,
      ...currencyClassKey,
      instanceIds: [],
      quantity: new BigNumber("1000")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    dto.quantities = [
      { user: users.testUser1Id, quantity: new BigNumber("100") },
      { user: users.testUser1Id, quantity: new BigNumber("100") }
    ];

    // When
    // we don't call contract.GrantAllowance directly because it will throw an error od dto validation,
    // and we want to be sure we validate it again inside the function (TODO do we?)
    const response = grantAllowance(ctx, { ...dto, expires: dto.expires ?? 0 });

    // Then
    await expect(response).rejects.toEqual(new DuplicateUserError(dto.quantities.map((q) => q.user)));
    expect(writes).toEqual({});
  });

  it("Supports PartialKeys for NFTs, but skips any FT retrieved", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstanceQueryKey = await createValidDTO(
      TokenInstanceQueryKey,
      currency.tokenInstanceKeyPlain()
    );

    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const nftInstance = plainToInstance(TokenInstance, { ...nft.tokenInstance1(), owner: users.testUser2Id });

    const currencyBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2Id,
      ...currencyClassKey,
      instanceIds: [],
      quantity: new BigNumber("1000")
    });
    const nftBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2Id,
      ...nftClassKey,
      instanceIds: [new BigNumber("1")],
      quantity: new BigNumber("1")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(currencyClass, currencyInstance, nftClass, currencyBalance, nftBalance, nftInstance);

    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    const partialDto = instanceToInstance(dto);
    partialDto.tokenInstance = plainToInstance(TokenInstanceQueryKey, {
      collection: "TEST"
    });

    // When
    const response = await contract.GrantAllowance(ctx, partialDto);

    // Then
    const allowance = nft.tokenAllowance((a) => ({ ...a, created: ctx.txUnixTime }));
    expect(response).toEqual(GalaChainResponse.Success([allowance]));
    expect(writes).toEqual(writesMap(allowance));
  });

  it("only permits tokenClass.authorities to Mint", async () => {
    // Given
    const nftInstance = plainToInstance(TokenInstance, { ...nft.tokenInstance1(), owner: users.testUser2Id });
    const nftClass = nft.tokenClass();
    const nftInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, nft.tokenInstance1KeyPlain());

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(nftClass, nftInstance);

    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Mint,
      uses: new BigNumber("1")
    });

    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    await expect(response).toEqual(
      GalaChainResponse.Error(
        new NotATokenAuthorityError(users.testUser2Id, nftClass.getCompositeKey(), nftClass.authorities)
      )
    );
    expect(writes).toEqual({});
  });

  it("prevents issuing duplicate Lock allowances", async () => {
    // Given
    const nftInstance = plainToInstance(TokenInstance, { ...nft.tokenInstance1(), owner: users.testUser2Id });
    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const nftInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, nft.tokenInstance1KeyPlain());

    const nftBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2Id,
      ...nftClassKey,
      instanceIds: [new BigNumber("1")],
      quantity: new BigNumber("1")
    });

    const existingAllowance = plainToInstance(TokenAllowance, {
      grantedTo: users.testUser1Id,
      ...nft.tokenInstance1KeyPlain(),
      allowanceType: AllowanceType.Lock,
      grantedBy: users.testUser2Id,
      created: 0,
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0,
      quantity: new BigNumber("100"),
      quantitySpent: new BigNumber("0")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(nftClass, nftInstance, existingAllowance, nftBalance);

    existingAllowance.created = ctx.txUnixTime;

    const existingChainKey = `client|testUser1$TEST$Item$Potion$Elixir$1$1$client|testUser2`;
    const expectedErrorPayload = instanceToPlain(existingAllowance);

    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new DuplicateAllowanceError(existingChainKey, expectedErrorPayload))
    );
    expect(writes).toEqual({});
  });

  it("writes TokenMintAllowanceRequest chain objects for mint allowances", async () => {
    // Given
    const nftInstance = plainToInstance(TokenInstance, { ...nft.tokenInstance1(), owner: users.testUser2Id });
    const nftClass = nft.tokenClass();
    const { collection, category, type, additionalKey } = nft.tokenInstance1KeyPlain();
    const instance = TokenInstance.FUNGIBLE_TOKEN_INSTANCE;
    const nftInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, {
      collection,
      category,
      type,
      additionalKey,
      instance
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testAdminId)
      .savedState(nftClass, nftInstance);

    const requestedQuantity = new BigNumber("100");
    const dto: GrantAllowanceDto = await createValidDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1Id, quantity: requestedQuantity }],
      allowanceType: AllowanceType.Mint,
      uses: new BigNumber("1")
    });

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    const timeKey = inverseTime(ctx);
    const epoch = inverseEpoch(ctx);
    const allowance = nft.tokenAllowance((a) => ({
      ...a,
      grantedBy: users.testAdminId,
      created: ctx.txUnixTime,
      allowanceType: AllowanceType.Mint,
      instance: new BigNumber("0")
    }));
    const { grantedTo, grantedBy } = allowance;
    const totalKnownMintAllowancesCount = new BigNumber("0");
    const mintAllowance = plainToInstance(TokenMintAllowance, {
      collection,
      category,
      type,
      additionalKey,
      grantedBy: grantedBy,
      grantedTo: grantedTo,
      created: ctx.txUnixTime,
      totalKnownMintAllowancesAtRequest: new BigNumber("0"),
      quantity: requestedQuantity
    });
    const mintAllowanceRequest = plainToInstance(TokenMintAllowanceRequest, {
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintAllowancesCount,
      grantedBy: grantedBy,
      grantedTo: grantedTo,
      created: ctx.txUnixTime,
      quantity: requestedQuantity,
      state: TokenMintStatus.Unknown,
      epoch: epoch,
      expires: 0,
      uses: new BigNumber("1")
    });

    mintAllowance.reqId = mintAllowanceRequest.requestId();
    mintAllowanceRequest.id = mintAllowanceRequest.requestId();

    expect(response).toEqual(GalaChainResponse.Success([allowance]));

    expect(writes).toEqual(writesMap(allowance, mintAllowance, mintAllowanceRequest));
  });
});
