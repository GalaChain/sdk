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
  asValidUserRef,
  createValidDTO,
  createValidSubmitDTO
} from "@gala-chain/api";
import { ChainClient, ChainUser, ChainUserAPI } from "@gala-chain/client";
import { expect } from "@jest/globals";
import BigNumber from "bignumber.js";
import { instanceToPlain } from "class-transformer";
import { nanoid } from "nanoid";

import { transactionSuccess } from "../matchers";

export function randomize(str: string): string {
  return `${str}${nanoid().replace(/[^a-z]/g, "")}`.slice(0, 30);
}

export async function mintTokensToUsers(
  client: ChainClient & ChainUserAPI,
  nftClassKey: TokenClassKey,
  users: { user: ChainUser; quantity: BigNumber }[]
) {
  await createGalaNFT(client, nftClassKey);
  await grantUsersMintingAllowance(client, nftClassKey, users);
  await usersMintNFT(client, nftClassKey, users);
}

export async function createTransferDto(
  nftClassKey: TokenClassKey,
  opts: { from: string; to: string; tokenInstance: BigNumber }
): Promise<TransferTokenDto> {
  const tokenInstance = await createValidDTO(TokenInstanceKey, {
    ...nftClassKey,
    instance: opts.tokenInstance
  });

  return createValidSubmitDTO(TransferTokenDto, {
    from: asValidUserRef(opts.from),
    to: asValidUserRef(opts.to),
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
    ...instanceToPlain(nftClassKey),
    owner: asValidUserRef(owner)
  });

  const resp = await client.evaluateTransaction("FetchBalances", dto, TokenBalance);
  expect(resp).toEqual(transactionSuccess([expect.anything()]));

  return (resp.Data ?? [])[0].instanceIds.sort((a, b) => a.comparedTo(b));
}

async function createGalaNFT(client: ChainClient & ChainUserAPI, nftClassKey: TokenClassKey) {
  const galaTokenDto: CreateTokenClassDto = await createValidSubmitDTO(CreateTokenClassDto, {
    decimals: 0,
    tokenClass: nftClassKey,
    name: nftClassKey.collection,
    symbol: nftClassKey.collection,
    description: "This is a test description!",
    isNonFungible: true,
    image: "https://app.gala.games/_nuxt/img/gala-logo_horizontal_white.8b0409c.png",
    maxSupply: new BigNumber(10)
  });

  await client.submitTransaction<TokenClassKey>(
    "CreateTokenClass",
    galaTokenDto.signed(client.privateKey),
    TokenClassKey
  );
}

async function grantUsersMintingAllowance(
  client: ChainClient & ChainUserAPI,
  nftClassKey: TokenClassKey,
  users: { user: ChainUser; quantity: BigNumber }[]
) {
  const galaAllowanceDto = await createValidSubmitDTO(GrantAllowanceDto, {
    tokenInstance: (
      await createValidDTO(TokenInstanceKey, {
        ...nftClassKey,
        instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
      })
    ).toQueryKey(),
    allowanceType: AllowanceType.Mint,
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

async function usersMintNFT(
  client: ChainClient,
  nftClassKey: TokenClassKey,
  users: { user: ChainUser; quantity: BigNumber }[]
) {
  for await (const { user, quantity } of users) {
    const userMintDto = await createValidSubmitDTO<MintTokenDto>(MintTokenDto, {
      owner: user.identityKey,
      tokenClass: nftClassKey,
      quantity: quantity
    });

    const response = await client.submitTransaction("MintToken", userMintDto.signed(user.privateKey));

    const responseMatchers = Array.from({ length: quantity.toNumber() }).map(() => expect.anything());
    expect(response).toEqual(transactionSuccess(responseMatchers));
  }
}
