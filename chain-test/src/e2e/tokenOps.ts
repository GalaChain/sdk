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
  FetchBalancesDto,
  GrantAllowanceDto,
  MintTokenDto,
  TokenAllowance,
  TokenBalance,
  TokenClassKey,
  TokenInstance,
  TokenInstanceKey,
  TransferTokenDto,
  createValidDTO
} from "@gala-chain/api";
import { ChainClient, ChainUser, ChainUserAPI } from "@gala-chain/client";
import { expect } from "@jest/globals";
import BigNumber from "bignumber.js";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { nanoid } from "nanoid";

import { transactionSuccess } from "../matchers";

export function randomize(str: string): string {
  return `${str}${nanoid().replace(/[^a-z]/g, "")}`.slice(0, 30);
}

export async function mintTokensToUsers(
  client: ChainClient & ChainUserAPI,
  tokenClassKey: TokenClassKey,
  users: { user: ChainUser; quantity: BigNumber }[],
  isNonFungible = true
) {
  await createTokenClass(client, tokenClassKey, isNonFungible);
  await grantUsersAllowance(client, tokenClassKey, users);
  await usersMintToken(client, tokenClassKey, users, isNonFungible);
}

export async function createTransferDto(
  nftClassKey: TokenClassKey,
  opts: { from: string; to: string; tokenInstance: BigNumber }
): Promise<TransferTokenDto> {
  const tokenInstance = plainToInstance(TokenInstanceKey, {
    ...nftClassKey,
    instance: opts.tokenInstance
  });

  return createValidDTO(TransferTokenDto, {
    from: opts.from,
    to: opts.to,
    tokenInstance,
    quantity: new BigNumber(1)
  });
}

export async function fetchNFTInstances(
  client: ChainClient,
  nftClassKey: TokenClassKey,
  owner: string
): Promise<string[]> {
  const dto = await createValidDTO(FetchBalancesDto, {
    owner,
    ...instanceToPlain(nftClassKey)
  });

  const resp = await client.evaluateTransaction("FetchBalances", dto, TokenBalance);
  expect(resp).toEqual(transactionSuccess([expect.anything()]));

  return (resp.Data ?? [])[0].instanceIds.sort((a, b) => a.comparedTo(b));
}

export async function createTokenClass(
  client: ChainClient & ChainUserAPI,
  tokenClassKey: TokenClassKey,
  isNonFungible = true
) {
  const maximum = isNonFungible ? new BigNumber(10) : new BigNumber(50000000000);
  const galaTokenDto: CreateTokenClassDto = await createValidDTO<CreateTokenClassDto>(CreateTokenClassDto, {
    decimals: 0,
    tokenClass: tokenClassKey,
    name: tokenClassKey.collection,
    symbol: tokenClassKey.collection,
    description: "This is a test description!",
    isNonFungible: isNonFungible,
    image: "https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png",
    maxCapacity: maximum,
    maxSupply: maximum
  });

  await client.submitTransaction<TokenClassKey>(
    "CreateTokenClass",
    galaTokenDto.signed(client.privateKey),
    TokenClassKey
  );
}

export async function grantUsersAllowance(
  client: ChainClient & ChainUserAPI,
  tokenClassKey: TokenClassKey,
  users: { user: ChainUser; quantity: BigNumber }[],
  allowanceType: AllowanceType = AllowanceType.Mint
) {
  const galaAllowanceDto = await createValidDTO<GrantAllowanceDto>(GrantAllowanceDto, {
    tokenInstance: plainToInstance(TokenInstanceKey, {
      ...tokenClassKey,
      instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
    }).toQueryKey(),
    allowanceType: allowanceType,
    quantities: users.map(({ user, quantity }) => ({
      user: user.identityKey,
      quantity
    })),
    uses: new BigNumber(10)
  });

  await client.submitTransaction<TokenAllowance[]>(
    "GrantAllowance",
    galaAllowanceDto.signed(client.privateKey),
    TokenAllowance
  );
}

export async function usersMintToken(
  client: ChainClient,
  tokenClassKey: TokenClassKey,
  users: { user: ChainUser; quantity: BigNumber }[],
  isNonFungible = true
) {
  for await (const { user, quantity } of users) {
    const userMintDto = await createValidDTO<MintTokenDto>(MintTokenDto, {
      owner: user.identityKey,
      tokenClass: tokenClassKey,
      quantity: quantity
    });

    const response = await client.submitTransaction("MintToken", userMintDto.signed(user.privateKey));

    if (isNonFungible) {
      const responseMatchers = Array.from({ length: quantity.toNumber() }).map(() => expect.anything());
      expect(response).toEqual(transactionSuccess(responseMatchers));
    } else {
      // Fungible token won't return individual instances per quantity, so response should be length 1
      expect(response).toEqual(transactionSuccess([expect.anything()]));
    }
  }
}
