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
  GrantAllowanceDto,
  LockTokensDto,
  TokenAllowance,
  TokenBalance,
  TokenClassKey,
  TokenInstanceKey,
  UnlockTokensDto,
  createValidDTO
} from "@gala-chain/api";
import { ChainUser } from "@gala-chain/client";
import {
  AdminChainClients,
  TestClients,
  createTransferDto,
  mintTokensToUsers,
  randomize,
  transactionError,
  transactionErrorKey,
  transactionSuccess
} from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToInstance } from "class-transformer";

jest.setTimeout(30000);

describe("NFT lock scenario", () => {
  let client: AdminChainClients;
  let user1: ChainUser;
  let user2: ChainUser;

  const nftClassKey: TokenClassKey = plainToInstance(TokenClassKey, {
    collection: randomize("NFT").slice(0, 20),
    category: "Weapon",
    type: "Axe",
    additionalKey: "none"
  });

  const token1Key = TokenInstanceKey.nftKey(nftClassKey, 1);

  beforeAll(async () => {
    client = await TestClients.createForAdmin();
    user1 = await client.createRegisteredUser();
    user2 = await client.createRegisteredUser();

    await mintTokensToUsers(client.assets, nftClassKey, [
      { user: user1, quantity: new BigNumber(2) },
      { user: user2, quantity: new BigNumber(1) }
    ]);
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it("User1 should lock own token", async () => {
    // Given
    const lockDto = await createValidDTO<LockTokensDto>(LockTokensDto, {
      lockAuthority: user1.identityKey,
      tokenInstances: [
        {
          tokenInstanceKey: token1Key,
          quantity: new BigNumber(1)
        }
      ]
    });

    // When
    const lockResult = await client.assets.submitTransaction<TokenBalance>(
      "LockTokens",
      lockDto.signed(user1.privateKey),
      TokenBalance
    );

    // Then
    expect(lockResult).toEqual(transactionSuccess());
  });

  it("User1 cannot transfer locked token", async () => {
    // Given
    const transferDto = await createTransferDto(nftClassKey, {
      from: user1.identityKey,
      to: user2.identityKey,
      tokenInstance: new BigNumber(1)
    });

    // When
    const transferResponse = await client.assets.submitTransaction(
      "TransferToken",
      transferDto.signed(user1.privateKey)
    );

    // Then
    expect(transferResponse).toEqual(transactionErrorKey("TOKEN_LOCKED"));
  });

  it("User1 can transfer token after unlock", async () => {
    // Given
    const unlockDto = await createValidDTO<UnlockTokensDto>(UnlockTokensDto, {
      tokenInstances: [
        {
          tokenInstanceKey: TokenInstanceKey.nftKey(nftClassKey, 1),
          quantity: new BigNumber(1)
        }
      ]
    });

    await client.assets.submitTransaction<UnlockTokensDto>(
      "UnlockTokens",
      unlockDto.signed(user1.privateKey),
      UnlockTokensDto
    );

    const transferDto = await createTransferDto(nftClassKey, {
      from: user1.identityKey,
      to: user2.identityKey,
      tokenInstance: new BigNumber(1)
    });

    // When
    const transferResponse = await client.assets.submitTransaction(
      "TransferToken",
      transferDto.signed(user1.privateKey)
    );

    // Then
    expect(transferResponse).toEqual(transactionSuccess());
  });

  // current state: token 1 - locked, quantity = 1
  it("Only lock authority can unlock token", async () => {
    // Given
    const lockDto = await createValidDTO<LockTokensDto>(LockTokensDto, {
      lockAuthority: user1.identityKey,
      tokenInstances: [
        {
          tokenInstanceKey: TokenInstanceKey.nftKey(nftClassKey, 2),
          quantity: new BigNumber(1),
          owner: user1.identityKey
        }
      ]
    });

    const unlockDto = await createValidDTO<UnlockTokensDto>(UnlockTokensDto, {
      tokenInstances: [
        {
          tokenInstanceKey: TokenInstanceKey.nftKey(nftClassKey, 2),
          quantity: new BigNumber(1)
        }
      ]
    });

    const lockResponse = await client.assets.submitTransaction<LockTokensDto>(
      "LockTokens",
      lockDto.signed(user1.privateKey),
      LockTokensDto
    );

    expect(lockResponse).toEqual(transactionSuccess());

    // When
    const unlockResult1 = await client.assets.submitTransaction<UnlockTokensDto>(
      "UnlockTokens",
      unlockDto.signed(user2.privateKey),
      UnlockTokensDto
    );
    const unlockResult2 = await client.assets.submitTransaction<UnlockTokensDto>(
      "UnlockTokens",
      unlockDto.signed(user1.privateKey),
      UnlockTokensDto
    );

    // Then
    expect(unlockResult1).toEqual(transactionError());
    expect(unlockResult2).toEqual(transactionSuccess());
  });
});

describe("lock with allowances", () => {
  let client: AdminChainClients;
  let user1: ChainUser;
  let user2: ChainUser;

  const nftClassKey: TokenClassKey = plainToInstance(TokenClassKey, {
    collection: randomize("NFT").slice(0, 20),
    category: "Weapon",
    type: "Axe",
    additionalKey: "none"
  });

  const token2Key = TokenInstanceKey.nftKey(nftClassKey, 2);

  beforeAll(async () => {
    client = await TestClients.createForAdmin();
    user1 = await client.createRegisteredUser();
    user2 = await client.createRegisteredUser();

    await mintTokensToUsers(client.assets, nftClassKey, [
      { user: user1, quantity: new BigNumber(2) },
      { user: user2, quantity: new BigNumber(1) }
    ]);
  });

  afterAll(async () => {
    await client.disconnect();
  });
  it("User1 grants lock allowance for token to User2", async () => {
    const galaAllowanceDto = await createValidDTO<GrantAllowanceDto>(GrantAllowanceDto, {
      tokenInstance: token2Key.toQueryKey(),
      allowanceType: AllowanceType.Lock,
      quantities: [{ user: user2.identityKey, quantity: new BigNumber(1) }],
      uses: new BigNumber(1)
    });

    const result = await client.assets.submitTransaction<TokenAllowance[]>(
      "GrantAllowance",
      galaAllowanceDto.signed(user1.privateKey),
      TokenAllowance
    );

    expect(instanceToPlain(result)).toEqual(transactionSuccess());
  });

  it("User2 can lock User1 token", async () => {
    const lockDto = await createValidDTO<LockTokensDto>(LockTokensDto, {
      lockAuthority: user1.identityKey,
      tokenInstances: [
        {
          tokenInstanceKey: token2Key,
          quantity: new BigNumber(1),
          owner: user1.identityKey
        }
      ]
    });

    // When
    const lockResult = await client.assets.submitTransaction<TokenBalance>(
      "LockTokens",
      lockDto.signed(user2.privateKey),
      TokenBalance
    );

    // Then
    expect(lockResult).toEqual(transactionSuccess());
  });
});
