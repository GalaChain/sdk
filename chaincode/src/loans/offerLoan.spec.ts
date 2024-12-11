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
  GalaChainResponse,
  Lender,
  Loan,
  LoanOffer,
  LoanOfferResDto,
  LoanStatus,
  OfferLoanDto,
  TokenAllowance,
  TokenInstance,
  asValidUserAlias,
  createValidChainObject,
  createValidSubmitDTO
} from "@gala-chain/api";
import { fixture, nft, users, writesMap } from "@gala-chain/test";
import BigNumber from "bignumber.js";
import { plainToClass as plainToInstance } from "class-transformer";

import GalaChainTokenContract from "../__test__/GalaChainTokenContract";
import { GalaChainContext } from "../types";

describe("OfferLoan", () => {
  test("permits NFT owner to create LoanOffer on chain", async () => {
    // Given
    const nftInstance = await createValidChainObject(TokenInstance, {
      ...nft.tokenInstance1(),
      owner: users.tokenHolder.identityKey
    });
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance((b) => ({
      ...b,
      owner: asValidUserAlias(users.tokenHolder.identityKey)
    }));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.admin, users.tokenHolder)
      .savedState(nftClass, nftInstance, tokenBalance);

    const tokenAllowance = await createValidChainObject(TokenAllowance, {
      ...nft.tokenAllowance(),
      grantedTo: users.admin.identityKey,
      created: ctx.txUnixTime,
      grantedBy: users.tokenHolder.identityKey,
      quantity: new BigNumber(1)
    });

    const offer = await createValidChainObject(LoanOffer, {
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      owner: users.tokenHolder.identityKey,
      created: ctx.txUnixTime,
      id: 0,
      registrar: users.admin.identityKey,
      reward: undefined,
      status: LoanStatus.Open,
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0
    });

    const lender = await createValidChainObject(Lender, {
      ...nftInstanceKey,
      id: users.tokenHolder.identityKey,
      status: LoanStatus.Open,
      offer: offer.getCompositeKey(),
      instance: new BigNumber("1")
    });

    const dto = (
      await createValidSubmitDTO(OfferLoanDto, {
        owner: asValidUserAlias(users.tokenHolder.identityKey),
        registrar: users.admin.identityKey,
        tokens: nftInstanceKey.toQueryKey(),
        uses: new BigNumber("1")
      })
    ).signed(users.tokenHolder.privateKey);

    // When
    const res: GalaChainResponse<LoanOfferResDto[]> = await contract.OfferLoan(ctx, dto);

    // Then
    expect(res).toEqual(GalaChainResponse.Success([plainToInstance(LoanOfferResDto, { offer, lender })]));
    expect(getWrites()).toEqual(writesMap(tokenAllowance, offer, lender));
  });

  test("can be scoped to one or more specific borrowers", async () => {
    // Given
    const nftInstance = await createValidChainObject(TokenInstance, {
      ...nft.tokenInstance1(),
      owner: users.tokenHolder.identityKey
    });
    const nftInstanceKey = nft.tokenInstance1Key();
    const nftClass = nft.tokenClass();

    const tokenBalance = nft.tokenBalance((b) => ({
      ...b,
      owner: asValidUserAlias(users.tokenHolder.identityKey)
    }));

    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.tokenHolder, users.admin, users.testUser1, users.testUser2)
      .savedState(nftClass, nftInstance, tokenBalance);

    const tokenAllowance1 = await createValidChainObject(TokenAllowance, {
      ...nft.tokenAllowance(),
      grantedTo: users.testUser1.identityKey,
      created: ctx.txUnixTime,
      grantedBy: users.tokenHolder.identityKey,
      quantity: new BigNumber(1)
    });

    await tokenAllowance1.validateOrReject();

    const tokenAllowance2 = await createValidChainObject(TokenAllowance, {
      ...nft.tokenAllowance(),
      grantedTo: users.testUser2.identityKey,
      created: ctx.txUnixTime,
      grantedBy: users.tokenHolder.identityKey,
      quantity: new BigNumber(1)
    });

    const offer = await createValidChainObject(LoanOffer, {
      ...nftInstanceKey,
      instance: new BigNumber("1"),
      owner: users.tokenHolder.identityKey,
      created: ctx.txUnixTime,
      id: 0,
      registrar: users.admin.identityKey,
      reward: undefined,
      status: LoanStatus.Open,
      uses: new BigNumber("1"),
      usesSpent: new BigNumber("0"),
      expires: 0
    });

    const multiDto = (
      await createValidSubmitDTO(OfferLoanDto, {
        owner: asValidUserAlias(users.tokenHolder.identityKey),
        tokens: nftInstanceKey.toQueryKey(),
        uses: new BigNumber("1"),
        borrowers: [users.testUser1.identityKey, users.testUser2.identityKey]
      })
    ).signed(users.tokenHolder.privateKey);

    const offer1 = plainToInstance(LoanOffer, {
      ...offer,
      id: 0,
      borrower: users.testUser1.identityKey,
      registrar: Loan.NULL_REGISTRAR_KEY
    });

    await offer1.validateOrReject();

    const offer2 = await createValidChainObject(LoanOffer, {
      ...offer,
      id: 1,
      borrower: users.testUser2.identityKey,
      registrar: Loan.NULL_REGISTRAR_KEY
    });

    await offer2.validateOrReject();

    const lender1 = await createValidChainObject(Lender, {
      id: users.tokenHolder.identityKey,
      status: LoanStatus.Open,
      offer: offer1.getCompositeKey(),
      ...nftInstanceKey,
      instance: new BigNumber("1")
    });

    await lender1.validateOrReject();

    const lender2 = await createValidChainObject(Lender, {
      id: users.tokenHolder.identityKey,
      status: LoanStatus.Open,
      offer: offer2.getCompositeKey(),
      ...nftInstanceKey,
      instance: new BigNumber("1")
    });

    await lender2.validateOrReject();

    // When
    const res: GalaChainResponse<LoanOfferResDto[]> = await contract.OfferLoan(ctx, multiDto);

    // Then
    expect(res).toEqual(
      GalaChainResponse.Success([
        plainToInstance(LoanOfferResDto, {
          offer: offer1,
          lender: lender1
        }),
        plainToInstance(LoanOfferResDto, {
          offer: offer2,
          lender: lender2
        })
      ])
    );

    expect(getWrites()).toEqual(
      writesMap(tokenAllowance1, tokenAllowance2, offer1, lender1, offer2, lender2)
    );
  });
});
