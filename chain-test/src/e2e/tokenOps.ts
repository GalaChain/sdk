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
  ChainClient,
  ChainUser,
  ChainUserAPI,
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
import { expect } from "@jest/globals";
import BigNumber from "bignumber.js";
import { instanceToPlain } from "class-transformer";
import { nanoid } from "nanoid";

import { transactionSuccess } from "../matchers";

/**
 * Generates a randomized string by appending a random suffix to the input.
 *
 * @param str - Base string to randomize
 * @returns Randomized string with the base string and random characters, limited to 30 characters
 *
 * @example
 * ```typescript
 * const randomCollection = randomize("MyNFT"); // "MyNFTabc123xyz"
 * const randomUser = randomize("testuser"); // "testuserdef456uvw"
 * ```
 */
export function randomize(str: string): string {
  return `${str}${nanoid().replace(/[^a-z]/g, "")}`.slice(0, 30);
}

/**
 * Complete workflow to mint tokens to multiple users.
 *
 * Performs the full token minting process: creates token class, grants minting allowances,
 * and mints tokens to each specified user.
 *
 * @param client - Chain client with user API capabilities
 * @param nftClassKey - Token class identifier
 * @param users - Array of users and quantities to mint
 *
 * @example
 * ```typescript
 * await mintTokensToUsers(client, nftClassKey, [
 *   { user: user1, quantity: new BigNumber(1) },
 *   { user: user2, quantity: new BigNumber(2) }
 * ]);
 * ```
 */
export async function mintTokensToUsers(
  client: ChainClient & ChainUserAPI,
  nftClassKey: TokenClassKey,
  users: { user: ChainUser; quantity: BigNumber }[]
) {
  await createGalaNFT(client, nftClassKey);
  await grantUsersMintingAllowance(client, nftClassKey, users);
  await usersMintNFT(client, nftClassKey, users);
}

/**
 * Creates a properly formatted TransferTokenDto for token transfers.
 *
 * @param nftClassKey - Token class identifier
 * @param opts - Transfer options including from/to addresses and token instance
 * @param opts.from - Source user identity key
 * @param opts.to - Destination user identity key
 * @param opts.tokenInstance - Specific token instance ID to transfer
 * @returns Promise resolving to a valid TransferTokenDto
 *
 * @example
 * ```typescript
 * const transferDto = await createTransferDto(nftClassKey, {
 *   from: user1.identityKey,
 *   to: user2.identityKey,
 *   tokenInstance: new BigNumber(1)
 * });
 * ```
 */
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

/**
 * Fetches all NFT instance IDs owned by a specific user.
 *
 * @param client - Chain client for blockchain queries
 * @param nftClassKey - Token class identifier
 * @param owner - User identity key to query balances for
 * @returns Promise resolving to array of token instance IDs sorted numerically
 *
 * @example
 * ```typescript
 * const instances = await fetchNFTInstances(client, nftClassKey, user.identityKey);
 * console.log(instances); // ["1", "3", "7"]
 * ```
 */
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

/**
 * Creates a new NFT token class on the blockchain.
 *
 * @param client - Chain client with user API capabilities
 * @param nftClassKey - Token class identifier
 * @internal
 */
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

/**
 * Grants minting allowances to multiple users for a token class.
 *
 * @param client - Chain client with user API capabilities
 * @param nftClassKey - Token class identifier
 * @param users - Array of users and quantities to grant allowances for
 * @internal
 */
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

/**
 * Executes minting operations for multiple users.
 *
 * @param client - Chain client for blockchain transactions
 * @param nftClassKey - Token class identifier
 * @param users - Array of users and quantities to mint
 * @internal
 */
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
