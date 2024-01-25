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
  TokenAllowance,
  TokenBalance,
  TokenHold,
  TokenLockedError,
  TokenNotInBalanceError,
  TransferTokenDto,
  createValidDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { AllowanceUsersMismatchError, InsufficientAllowanceError } from "../allowances/AllowanceError";
import { InvalidDecimalError } from "../token";
import { SameSenderAndRecipientError } from "./TransferError";

describe("TransferToken", () => {
  test("TransferToken from user's wallet fails for locked token", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const expectedHold = new TokenHold({
      createdBy: users.testUser1Id,
      instanceId: nftInstanceKey.instance,
      quantity: new BigNumber("1"),
      created: 1,
      expires: 0
    });
    const tokenBalance = nft.tokenBalance();
    tokenBalance.ensureCanLockInstance(expectedHold).lock();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser1Id)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto = await createValidDTO(TransferTokenDto, {
      from: users.testUser1Id,
      to: users.testUser2Id,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenLockedError(users.testUser1Id, nftInstance, nftInstance.instance, undefined)
      )
    );
    expect(writes).toEqual({});
  });

  test("TransferToken to self fails, sender and recipient must be different", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const expectedHold = new TokenHold({
      createdBy: users.testUser1Id,
      instanceId: nftInstanceKey.instance,
      quantity: new BigNumber("1"),
      created: 1,
      expires: 0
    });
    const tokenBalance = nft.tokenBalance();
    tokenBalance.ensureCanLockInstance(expectedHold).lock();
    expect(tokenBalance.owner).toEqual(expectedHold.createdBy);

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      // sender can be either the callingUser or the "from" value in the dto, test both.
      .callingUser(users.testUser1Id)
      .savedState(nftClass, nftInstance, tokenBalance);
    const {
      ctx: ctx2,
      contract: contract2,
      writes: writes2
    } = fixture(GalaChainTokenContract)
      // sender can be either the callingUser or the "from" value in the dto, test both.
      .callingUser(users.testAdminId)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto = await createValidDTO(TransferTokenDto, {
      to: users.testUser1Id,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    const dto2 = await createValidDTO(TransferTokenDto, {
      to: users.testUser1Id,
      from: users.testUser1Id,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });

    // When
    const response = await contract.TransferToken(ctx, dto);
    const response2 = await contract2.TransferToken(ctx2, dto2);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new SameSenderAndRecipientError(users.testUser1Id, users.testUser1Id))
    );
    expect(response2).toEqual(
      GalaChainResponse.Error(new SameSenderAndRecipientError(users.testUser1Id, users.testUser1Id))
    );
    expect(writes).toEqual({});
    expect(writes2).toEqual({});
  });

  test("TransferToken fails when provided allowance is issued to another", async () => {
    // A TransferAllowance for an NFT was granted from user1 to user2.
    // An users.attacker is able to access the Operations API either directly or via the platform
    // and send handcrafted DTOs.
    // users.attacker finds the valid Allowance ID on chain and crafts a TransferDto.
    // Option 1: Allowances provided in array

    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenBalance = nft.tokenBalance();

    const transferAllowance = plainToInstance(TokenAllowance, {
      grantedTo: users.testUser2Id,
      ...nftInstanceKey,
      instance: nftInstanceKey.instance,
      allowanceType: AllowanceType.Transfer,
      grantedBy: users.testUser1Id,
      created: 1
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.attacker)
      .savedState(nftClass, nftInstance, tokenBalance, transferAllowance);

    const dto: TransferTokenDto = await createValidDTO(TransferTokenDto, {
      from: users.testUser1Id,
      to: users.attacker,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1"),
      useAllowances: [transferAllowance.getCompositeKey()]
    });

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new AllowanceUsersMismatchError(transferAllowance, users.testUser1Id, users.attacker)
      )
    );
    expect(writes).toEqual({});
  });

  test("TransferToken fails if allowances are neither provided nor found on chain", async () => {
    // Option 2: No Allowances provided, chaincode will attempt lookup on chain
    // a: FetchAllowances() returns error

    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto: TransferTokenDto = await createValidDTO(TransferTokenDto, {
      from: users.testUser1Id,
      to: users.testUser2Id,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new InsufficientAllowanceError(
          users.testUser2Id,
          new BigNumber("0"),
          AllowanceType.Transfer,
          new BigNumber("1"),
          nftInstanceKey,
          users.testUser1Id
        )
      )
    );
    expect(writes).toEqual({});
  });

  test("TransferToken fails when valid allowances are used up", async () => {
    // 2) b: FetchAllowances() does not return an applicable allowance

    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenBalance = nft.tokenBalance();

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto: TransferTokenDto = await createValidDTO(TransferTokenDto, {
      from: users.testUser1Id,
      to: users.testUser2Id,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new InsufficientAllowanceError(
          users.testUser2Id,
          new BigNumber("0"),
          AllowanceType.Transfer,
          new BigNumber("1"),
          nftInstanceKey,
          users.testUser1Id
        )
      )
    );
    expect(writes).toEqual({});
  });

  test("TransferToken fails if user has insufficient balance", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenBalance = nft.tokenBalance();
    tokenBalance.ensureCanRemoveInstance(nftInstance.instance, 1).remove();
    const transferAllowance = plainToInstance(TokenAllowance, {
      grantedTo: users.testUser2Id,
      grantedBy: users.testUser1Id,
      ...nftInstanceKey,
      instance: nftInstance.instance,
      allowanceType: AllowanceType.Transfer,
      created: 1,
      uses: new BigNumber("2"),
      usesSpent: new BigNumber("0"),
      expires: 0,
      quantity: new BigNumber("2"),
      quantitySpent: new BigNumber("0")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.testUser2Id)
      .savedState(nftClass, nftInstance, tokenBalance, transferAllowance);

    const dto: TransferTokenDto = await createValidDTO(TransferTokenDto, {
      from: users.testUser1Id,
      to: users.testUser2Id,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenNotInBalanceError(users.testUser1Id, nftInstance, nftInstance.instance)
      )
    );
    expect(writes).toEqual({});
  });

  test("TransferToken fails for another Fungible Tokens without allowance", async () => {
    // owner has 100,000 GALA. 50,000 were bridged out to ethereum, 50,000 remain in Play.
    // users.attacker finds allowance id granted to bridge by owner... it probably exists on chain.
    // using the bridge's allowance id, users.attacker attempts to transferToken balance of gala to self
    // this might only work if executed in between RequestTokenBridgeOut() and BridgeTokenOut().

    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance((b) => ({ ...b, owner: users.testUser2Id }));

    const transferAllowance = plainToInstance(TokenAllowance, {
      grantedTo: "system-user",
      grantedBy: users.tokenHolder,
      ...currencyInstanceKey,
      instance: currencyInstance.instance,
      allowanceType: AllowanceType.Transfer,
      created: 1,
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0,
      quantity: new BigNumber("50000"),
      quantitySpent: new BigNumber("0")
    });
    const transferAllowanceId = transferAllowance.getCompositeKey();
    const ownerBalance = plainToInstance(TokenBalance, {
      owner: users.tokenHolder,
      ...currencyInstanceKey,
      quantity: new BigNumber("100000")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.attacker)
      .savedState(currencyClass, currencyInstance, tokenBalance, transferAllowance, ownerBalance);

    const dto: TransferTokenDto = await createValidDTO(TransferTokenDto, {
      from: users.tokenHolder,
      to: users.attacker,
      tokenInstance: currencyInstanceKey,
      quantity: new BigNumber("50000"),
      useAllowances: [transferAllowanceId]
    });

    const response = await contract.TransferToken(ctx, dto);

    expect(response).toEqual(
      GalaChainResponse.Error(
        new AllowanceUsersMismatchError(transferAllowance, users.tokenHolder, users.attacker)
      )
    );
    expect(writes).toEqual({});
  });

  test("TransferToken fails for quantity less than decimal limit", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();

    const tokenBalance = currency.tokenBalance((b) => ({ ...b, owner: users.testUser2Id }));

    const transferAllowance = plainToInstance(TokenAllowance, {
      grantedTo: "system-user",
      grantedBy: users.tokenHolder,
      ...currencyInstanceKey,
      instance: currencyInstance.instance,
      allowanceType: AllowanceType.Transfer,
      created: 1,
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0,
      quantity: new BigNumber("50000"),
      quantitySpent: new BigNumber("0")
    });
    const ownerBalance = plainToInstance(TokenBalance, {
      owner: users.tokenHolder,
      ...currencyInstanceKey,
      quantity: new BigNumber("100000")
    });

    const { ctx, contract, writes } = fixture(GalaChainTokenContract)
      .callingUser(users.tokenHolder)
      .savedState(currencyClass, currencyInstance, tokenBalance, transferAllowance, ownerBalance);

    const decimalQuantity = new BigNumber("0.000000000001");
    const transferDto: TransferTokenDto = await createValidDTO(TransferTokenDto, {
      from: users.tokenHolder,
      to: users.testUser2Id,
      tokenInstance: currencyInstanceKey,
      quantity: decimalQuantity
    });

    // When
    const response = await contract.TransferToken(ctx, transferDto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new InvalidDecimalError(decimalQuantity, currencyClass.decimals))
    );
    expect(writes).toEqual({});
  });
});
