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
  createValidChainObject,
  createValidDTO,
  createValidRangedChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, nft, transactionErrorKey, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { instanceToInstance, instanceToPlain, plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { InvalidDecimalError, NotATokenAuthorityError } from "../token/TokenError";
import { inverseEpoch, inverseTime } from "../utils";
import { DuplicateAllowanceError, DuplicateUserError, MintCapacityExceededError } from "./AllowanceError";
import { grantAllowance } from "./grantAllowance";

describe("GrantAllowance", () => {
  it("should GrantAllowance", async () => {
    const nftInstance = await createValidChainObject(TokenInstance, {
      ...nft.tokenInstance1(),
      owner: users.testUser2.identityKey
    });
    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const nftInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, nft.tokenInstance1KeyPlain());

    const nftBalance = new TokenBalance({
      owner: users.testUser2.identityKey,
      ...nftClassKey
    });
    nftBalance.addInstance(new BigNumber("1"));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(nftClass, nftInstance, nftBalance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    const allowance = nft.tokenAllowance((a) => ({ ...a, created: ctx.txUnixTime }));
    expect(response).toEqual(GalaChainResponse.Success([allowance]));
    expect(getWrites()).toEqual(writesMap(allowance));
  });

  it("should fail to GrantAllowance when the instance is missing in balance", async () => {
    const nftInstance = await createValidChainObject(TokenInstance, {
      ...nft.tokenInstance1(),
      owner: users.testUser2.identityKey
    });
    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const nftInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, nft.tokenInstance1KeyPlain());

    const nftBalance = new TokenBalance({
      owner: users.testUser2.identityKey,
      ...nftClassKey
    });
    expect(nftBalance.getNftInstanceIds()).toEqual([]);

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(nftClass, nftInstance, nftBalance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    expect(response).toEqual(transactionErrorKey("TOKEN_NOT_IN_BALANCE"));
    expect(getWrites()).toEqual(writesMap());
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

    const currencyBalance = new TokenBalance({ owner: users.testUser2.identityKey, ...currencyClassKey });
    currencyBalance.addQuantity(new BigNumber("1000"));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const decimalQuantity = new BigNumber("0.000000000001");

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: decimalQuantity }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new InvalidDecimalError(decimalQuantity, currencyClass.decimals))
    );
    expect(getWrites()).toEqual({});
  });

  it("should allow user to GrantAllowance for fungible token when quantity is greater than balance", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstanceQueryKey = await createValidDTO(
      TokenInstanceQueryKey,
      currency.tokenInstanceKeyPlain()
    );

    const currencyBalance = new TokenBalance({ owner: users.testUser2.identityKey, ...currencyClassKey });
    currencyBalance.addQuantity(new BigNumber("1000"));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber("1001") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    const allowance = currency.tokenAllowance((a) => ({
      ...a,
      created: ctx.txUnixTime,
      quantity: new BigNumber("1001"),
      grantedBy: users.testUser2.identityKey,
      grantedTo: users.testUser1.identityKey,
      allowanceType: AllowanceType.Lock
    }));
    expect(response).toEqual(GalaChainResponse.Success([allowance]));
    expect(getWrites()).toEqual(writesMap(allowance));
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

    const currencyBalance = new TokenBalance({ owner: users.testUser2.identityKey, ...currencyClassKey });
    currencyBalance.addQuantity(new BigNumber("1000"));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber("1000") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    const allowance = currency.tokenAllowance((a) => ({
      ...a,
      created: ctx.txUnixTime,
      quantity: new BigNumber("1000"),
      grantedBy: users.testUser2.identityKey,
      grantedTo: users.testUser1.identityKey,
      allowanceType: AllowanceType.Lock
    }));
    expect(response).toEqual(GalaChainResponse.Success([allowance]));
    expect(getWrites()).toEqual(writesMap(allowance));
  });

  it("should allow infinite Allowances for fungible token", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const currencyClassKey = currency.tokenClassKey();
    const currencyInstanceQueryKey = await createValidDTO(
      TokenInstanceQueryKey,
      currency.tokenInstanceKeyPlain()
    );

    const currencyBalance = plainToInstance(TokenBalance, {
      owner: users.testUser2.identityKey,
      ...currencyClassKey,
      instanceIds: [],
      quantity: new BigNumber("1000")
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber(Infinity) }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber(Infinity)
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    const allowance = currency.tokenAllowance((a) => ({
      ...a,
      created: ctx.txUnixTime,
      quantity: new BigNumber(Infinity),
      grantedBy: users.testUser2.identityKey,
      grantedTo: users.testUser1.identityKey,
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber(Infinity)
    }));
    delete allowance.quantitySpent;
    delete allowance.usesSpent;

    expect(response).toEqual(GalaChainResponse.Success([allowance]));
    expect(getWrites()).toEqual(writesMap(allowance));
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

    const currencyBalance = new TokenBalance({ owner: users.testUser2.identityKey, ...currencyClassKey });
    currencyBalance.addQuantity(new BigNumber("1000"));

    const { ctx, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(currencyClass, currencyInstance, currencyBalance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    // done separately to bypass validation
    dto.quantities = [dto.quantities[0], dto.quantities[0]];

    dto.sign(users.testUser2.privateKey);

    // When
    // we don't call contract.GrantAllowance directly because it will throw an error on dto validation,
    // and we want to be sure we validate it again inside the function (TODO do we?)
    const response = grantAllowance(ctx, { ...dto, expires: dto.expires ?? 0 });

    // Then
    await expect(response).rejects.toEqual(new DuplicateUserError(dto.quantities.map((q) => q.user)));
    expect(getWrites()).toEqual({});
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
    const nftInstance = await createValidChainObject(TokenInstance, {
      ...nft.tokenInstance1(),
      owner: users.testUser2.identityKey
    });

    const currencyBalance = new TokenBalance({
      owner: users.testUser2.identityKey,
      ...currencyClassKey
    });
    currencyBalance.addQuantity(new BigNumber("1000"));

    const nftBalance = new TokenBalance({ owner: users.testUser2.identityKey, ...nftClassKey });
    nftBalance.addInstance(new BigNumber("1"));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(currencyClass, currencyInstance, nftClass, currencyBalance, nftBalance, nftInstance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    });

    const partialDto = instanceToInstance(dto);
    partialDto.tokenInstance = await createValidDTO(TokenInstanceQueryKey, { collection: "TEST" });

    partialDto.sign(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, partialDto);

    // Then
    const allowance = nft.tokenAllowance((a) => ({ ...a, created: ctx.txUnixTime }));
    expect(response).toEqual(GalaChainResponse.Success([allowance]));
    expect(getWrites()).toEqual(writesMap(allowance));
  });

  it("only permits tokenClass.authorities to Mint", async () => {
    // Given
    const nftInstance = await createValidChainObject(TokenInstance, {
      ...nft.tokenInstance1(),
      owner: users.testUser2.identityKey
    });
    const nftClass = nft.tokenClass();
    const nftInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, nft.tokenInstance1KeyPlain());

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(nftClass, nftInstance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Mint,
      uses: new BigNumber("1")
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new NotATokenAuthorityError(
          users.testUser2.identityKey,
          nftClass.getCompositeKey(),
          nftClass.authorities
        )
      )
    );
    expect(getWrites()).toEqual({});
  });

  it("should fail to grant Infinite Mint allowance", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyClass = currency.tokenClass();
    const currencyInstanceQueryKey = await createValidDTO(
      TokenInstanceQueryKey,
      currency.tokenInstanceKeyPlain()
    );

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(currencyClass, currencyInstance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: currencyInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber(Infinity) }],
      allowanceType: AllowanceType.Mint,
      uses: new BigNumber(Infinity)
    }).signed(users.admin.privateKey);

    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new MintCapacityExceededError(
          currencyClass.getCompositeKey(),
          currencyClass.maxCapacity,
          new BigNumber(Infinity)
        )
      )
    );
    expect(getWrites()).toEqual({});
  });

  it("prevents issuing duplicate Lock allowances", async () => {
    // Given
    const nftInstance = await createValidChainObject(TokenInstance, {
      ...nft.tokenInstance1(),
      owner: users.testUser2.identityKey
    });
    const nftClass = nft.tokenClass();
    const nftClassKey = nft.tokenClassKey();
    const nftInstanceQueryKey = await createValidDTO(TokenInstanceQueryKey, nft.tokenInstance1KeyPlain());

    const nftBalance = new TokenBalance({ owner: users.testUser2.identityKey, ...nftClassKey });
    nftBalance.addInstance(new BigNumber("1"));

    const existingAllowance = await createValidChainObject(TokenAllowance, {
      grantedTo: users.testUser1.identityKey,
      ...nft.tokenInstance1KeyPlain(),
      allowanceType: AllowanceType.Lock,
      grantedBy: users.testUser2.identityKey,
      created: 1,
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0,
      quantity: new BigNumber("100"),
      quantitySpent: new BigNumber("0")
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(nftClass, nftInstance, existingAllowance, nftBalance);

    existingAllowance.created = ctx.txUnixTime;

    const existingChainKey = `client|testUser1$TEST$Item$Potion$Elixir$1$1$client|testUser2`;
    const expectedErrorPayload = instanceToPlain(existingAllowance);

    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: new BigNumber("100") }],
      allowanceType: AllowanceType.Lock,
      uses: new BigNumber("1")
    }).signed(users.testUser2.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new DuplicateAllowanceError(existingChainKey, expectedErrorPayload))
    );
    expect(getWrites()).toEqual({});
  });

  it("writes TokenMintAllowanceRequest chain objects for mint allowances", async () => {
    // Given
    const nftInstance = await createValidChainObject(TokenInstance, {
      ...nft.tokenInstance1(),
      owner: users.testUser2.identityKey
    });
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

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin)
      .savedState(nftClass, nftInstance);

    const requestedQuantity = new BigNumber("100");
    const dto: GrantAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
      tokenInstance: nftInstanceQueryKey,
      quantities: [{ user: users.testUser1.identityKey, quantity: requestedQuantity }],
      allowanceType: AllowanceType.Mint,
      uses: new BigNumber("1")
    }).signed(users.admin.privateKey);

    // When
    const response = await contract.GrantAllowance(ctx, dto);

    // Then
    const timeKey = inverseTime(ctx);
    const epoch = inverseEpoch(ctx);
    const allowance = nft.tokenAllowance((a) => ({
      ...a,
      grantedBy: users.admin.identityKey,
      created: ctx.txUnixTime,
      allowanceType: AllowanceType.Mint,
      instance: new BigNumber("0")
    }));
    const totalKnownMintAllowancesCount = new BigNumber("0");
    const mintAllowance = await createValidChainObject(TokenMintAllowance, {
      collection,
      category,
      type,
      additionalKey,
      grantedBy: allowance.grantedBy,
      grantedTo: allowance.grantedTo,
      created: ctx.txUnixTime,
      totalKnownMintAllowancesAtRequest: new BigNumber("0"),
      quantity: requestedQuantity,
      reqId: "-" // will be updated later
    });

    const mintAllowanceRequest = await createValidRangedChainObject(TokenMintAllowanceRequest, {
      id: "-", // will be updated later
      collection,
      category,
      type,
      additionalKey,
      timeKey,
      totalKnownMintAllowancesCount,
      grantedBy: allowance.grantedBy,
      grantedTo: allowance.grantedTo,
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

    expect(getWrites()).toEqual(writesMap(allowance, mintAllowance, mintAllowanceRequest));
  });
});
