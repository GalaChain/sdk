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
  UserAlias,
  createValidChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { currency, fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { AllowanceUsersMismatchError, InsufficientAllowanceError } from "../allowances";
import { InvalidDecimalError } from "../token";
import { SameSenderAndRecipientError } from "./TransferError";

describe("TransferToken", () => {
  test("TransferToken from user's wallet fails for locked token", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const expectedHold = new TokenHold({
      createdBy: users.testUser1.identityKey,
      instanceId: nftInstanceKey.instance,
      quantity: new BigNumber("1"),
      created: 1,
      expires: 0
    });
    const tokenBalance = nft.tokenBalance();
    tokenBalance.lockInstance(expectedHold, Date.now());

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto = await createValidSubmitDTO(TransferTokenDto, {
      from: users.testUser1.identityKey,
      to: users.testUser2.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    dto.sign(users.testUser1.privateKey);

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenLockedError(users.testUser1.identityKey, nftInstance, nftInstance.instance, undefined)
      )
    );
    expect(getWrites()).toEqual({});
  });

  test("TransferToken to self fails, sender and recipient must be different", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const expectedHold = new TokenHold({
      createdBy: users.testUser1.identityKey,
      instanceId: nftInstanceKey.instance,
      quantity: new BigNumber("1"),
      created: 1,
      expires: 0
    });

    const tokenBalance = nft.tokenBalance();
    tokenBalance.lockInstance(expectedHold, Date.now());
    expect(tokenBalance.owner).toEqual(expectedHold.createdBy);

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(nftClass, nftInstance, tokenBalance);

    // case 1: callingUser is the sender
    const dto1 = await createValidSubmitDTO(TransferTokenDto, {
      to: users.testUser1.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    dto1.sign(users.testUser1.privateKey);

    // case 2: from is the sender
    const dto2 = await createValidSubmitDTO(TransferTokenDto, {
      to: users.testUser2.identityKey,
      from: users.testUser2.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    dto2.sign(users.testUser1.privateKey);

    // When
    const response1 = await contract.TransferToken(ctx, dto1);
    const response2 = await contract.TransferToken(ctx, dto2);

    // Then
    expect(response1).toEqual(
      GalaChainResponse.Error(
        new SameSenderAndRecipientError(users.testUser1.identityKey, users.testUser1.identityKey)
      )
    );
    expect(response2).toEqual(
      GalaChainResponse.Error(
        new SameSenderAndRecipientError(users.testUser2.identityKey, users.testUser2.identityKey)
      )
    );
    expect(getWrites()).toEqual({});
  });

  test("TransferToken succeeds when providing infinite allowance to a user", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();
    const tokenBalance = currency.tokenBalance((b) => ({
      ...b,
      owner: users.testUser2.identityKey,
      quantity: new BigNumber("0")
    }));

    const transferAllowance = plainToInstance(TokenAllowance, {
      grantedTo: users.testUser2.identityKey,
      grantedBy: users.tokenHolder.identityKey,
      ...currencyInstanceKey,
      instance: currencyInstance.instance,
      allowanceType: AllowanceType.Transfer,
      created: 1,
      uses: new BigNumber("1"),
      expires: 0,
      quantity: new BigNumber(Infinity)
    });
    const transferAllowanceId = transferAllowance.getCompositeKey();
    const ownerBalance = currency.tokenBalance((b) => ({
      ...b,
      owner: users.tokenHolder.identityKey,
      quantity: new BigNumber("100000")
    }));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.tokenHolder)
      .savedState(currencyClass, currencyInstance, tokenBalance, transferAllowance, ownerBalance);

    const dto: TransferTokenDto = await createValidSubmitDTO(TransferTokenDto, {
      from: users.tokenHolder.identityKey,
      to: users.testUser2.identityKey,
      tokenInstance: currencyInstanceKey,
      quantity: new BigNumber("50000"),
      useAllowances: [transferAllowanceId]
    }).signed(users.tokenHolder.privateKey);

    const response = await contract.TransferToken(ctx, dto);

    expect(response).toEqual(
      GalaChainResponse.Success([
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          owner: users.tokenHolder.identityKey,
          quantity: new BigNumber("50000")
        }),
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          owner: users.testUser2.identityKey,
          quantity: new BigNumber("50000")
        })
      ])
    );
    expect(getWrites()).toEqual(
      writesMap(
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          owner: users.testUser2.identityKey,
          quantity: new BigNumber("50000")
        }),
        plainToInstance(TokenBalance, {
          ...currency.tokenBalance(),
          owner: users.tokenHolder.identityKey,
          quantity: new BigNumber("50000")
        })
      )
    );
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

    const transferAllowance = await createValidChainObject(TokenAllowance, {
      grantedTo: users.testUser2.identityKey,
      ...nftInstanceKey,
      instance: nftInstanceKey.instance,
      allowanceType: AllowanceType.Transfer,
      grantedBy: users.testUser1.identityKey,
      created: 1,
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0,
      quantity: new BigNumber("1"),
      quantitySpent: new BigNumber("0")
    });

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.attacker)
      .savedState(nftClass, nftInstance, tokenBalance, transferAllowance);

    const dto: TransferTokenDto = await createValidSubmitDTO(TransferTokenDto, {
      from: users.testUser1.identityKey,
      to: users.attacker.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1"),
      useAllowances: [transferAllowance.getCompositeKey()]
    });
    dto.sign(users.attacker.privateKey);

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new AllowanceUsersMismatchError(
          transferAllowance,
          users.testUser1.identityKey,
          users.attacker.identityKey
        )
      )
    );
    expect(getWrites()).toEqual({});
  });

  test("TransferToken fails if allowances are neither provided nor found on chain", async () => {
    // Option 2: No Allowances provided, chaincode will attempt lookup on chain
    // a: FetchAllowances() returns error

    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser2)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto: TransferTokenDto = await createValidSubmitDTO(TransferTokenDto, {
      from: users.testUser1.identityKey,
      to: users.testUser2.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    dto.sign(users.testUser2.privateKey);

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new InsufficientAllowanceError(
          users.testUser2.identityKey,
          new BigNumber("0"),
          AllowanceType.Transfer,
          new BigNumber("1"),
          nftInstanceKey,
          users.testUser1.identityKey
        )
      )
    );
    expect(getWrites()).toEqual({});
  });

  test("TransferToken fails when valid allowances are used up", async () => {
    // 2) b: FetchAllowances() does not return an applicable allowance

    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenBalance = nft.tokenBalance();

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(nftClass, nftInstance, tokenBalance);

    const dto: TransferTokenDto = await createValidSubmitDTO(TransferTokenDto, {
      from: users.testUser1.identityKey,
      to: users.testUser2.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    dto.sign(users.testUser2.privateKey);

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new InsufficientAllowanceError(
          users.testUser2.identityKey,
          new BigNumber("0"),
          AllowanceType.Transfer,
          new BigNumber("1"),
          nftInstanceKey,
          users.testUser1.identityKey
        )
      )
    );
    expect(getWrites()).toEqual({});
  });

  test("TransferToken fails if user has insufficient balance", async () => {
    // Given
    const nftInstance = nft.tokenInstance1();
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();
    const tokenBalance = nft.tokenBalance();
    tokenBalance.removeInstance(nftInstance.instance, 1);
    const transferAllowance = await createValidChainObject(TokenAllowance, {
      grantedTo: users.testUser2.identityKey,
      grantedBy: users.testUser1.identityKey,
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

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1, users.testUser2)
      .savedState(nftClass, nftInstance, tokenBalance, transferAllowance);

    const dto: TransferTokenDto = await createValidSubmitDTO(TransferTokenDto, {
      from: users.testUser1.identityKey,
      to: users.testUser2.identityKey,
      tokenInstance: nftInstanceKey,
      quantity: new BigNumber("1")
    });
    dto.sign(users.testUser2.privateKey);

    // When
    const response = await contract.TransferToken(ctx, dto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(
        new TokenNotInBalanceError(users.testUser1.identityKey, nftInstance, nftInstance.instance)
      )
    );
    expect(getWrites()).toEqual({});
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
    const tokenBalance = currency.tokenBalance((b) => ({ ...b, owner: users.testUser2.identityKey }));

    const transferAllowance = await createValidChainObject(TokenAllowance, {
      grantedTo: "TonBridge" as UserAlias,
      grantedBy: users.tokenHolder.identityKey,
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

    const ownerBalance = new TokenBalance({ owner: users.tokenHolder.identityKey, ...currencyInstanceKey });
    ownerBalance.addQuantity(new BigNumber("50000"));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.tokenHolder, users.attacker)
      .savedState(currencyClass, currencyInstance, tokenBalance, transferAllowance, ownerBalance);

    const dto: TransferTokenDto = await createValidSubmitDTO(TransferTokenDto, {
      from: users.tokenHolder.identityKey,
      to: users.attacker.identityKey,
      tokenInstance: currencyInstanceKey,
      quantity: new BigNumber("50000"),
      useAllowances: [transferAllowanceId]
    });
    dto.sign(users.attacker.privateKey);

    const response = await contract.TransferToken(ctx, dto);

    expect(response).toEqual(
      GalaChainResponse.Error(
        new AllowanceUsersMismatchError(
          transferAllowance,
          users.tokenHolder.identityKey,
          users.attacker.identityKey
        )
      )
    );
    expect(getWrites()).toEqual({});
  });

  test("TransferToken fails for quantity less than decimal limit", async () => {
    // Given
    const currencyInstance = currency.tokenInstance();
    const currencyInstanceKey = currency.tokenInstanceKey();
    const currencyClass = currency.tokenClass();

    const tokenBalance = currency.tokenBalance((b) => ({ ...b, owner: users.testUser2.identityKey }));

    const transferAllowance = await createValidChainObject(TokenAllowance, {
      grantedTo: "EthereumBridge" as UserAlias,
      grantedBy: users.tokenHolder.identityKey,
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

    const ownerBalance = new TokenBalance({ owner: users.tokenHolder.identityKey, ...currencyInstanceKey });
    ownerBalance.addQuantity(new BigNumber("100000"));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.tokenHolder)
      .savedState(currencyClass, currencyInstance, tokenBalance, transferAllowance, ownerBalance);

    const decimalQuantity = new BigNumber("0.000000000001");
    const transferDto: TransferTokenDto = await createValidSubmitDTO(TransferTokenDto, {
      from: users.tokenHolder.identityKey,
      to: users.testUser2.identityKey,
      tokenInstance: currencyInstanceKey,
      quantity: decimalQuantity
    });
    transferDto.sign(users.tokenHolder.privateKey);

    // When
    const response = await contract.TransferToken(ctx, transferDto);

    // Then
    expect(response).toEqual(
      GalaChainResponse.Error(new InvalidDecimalError(decimalQuantity, currencyClass.decimals))
    );
    expect(getWrites()).toEqual({});
  });
});
