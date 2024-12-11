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
  ExclusiveRegistrarBorrowersError,
  GrantAllowanceQuantity,
  Lender,
  Loan,
  LoanOffer,
  LoanOfferResDto,
  LoanStatus,
  MissingInstanceBalanceError,
  MultipleTokenBalancesError,
  OfferLoanFungibleTokenNotImplementedError,
  OfferLoanOwnerCallerMismatchError,
  TokenInstance,
  TokenInstanceKey,
  TokenInstanceQuantity,
  TokenInstanceQueryKey,
  asValidUserAlias
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";
import { instanceToInstance, plainToInstance } from "class-transformer";

import { grantAllowance } from "../allowances";
import { fetchBalances } from "../balances";
import { GalaChainContext } from "../types";
import { putChainObject } from "../utils";

interface OfferLoanParams {
  owner: string;
  registrar?: string;
  borrowers?: Array<string>;
  tokenQueryKey: TokenInstanceQueryKey;
  rewards?: TokenInstanceQuantity[];
  uses: BigNumber;
  expires: number;
}

export async function offerLoan(
  ctx: GalaChainContext,
  { owner, registrar, borrowers, tokenQueryKey, rewards, uses, expires }: OfferLoanParams
): Promise<LoanOfferResDto[]> {
  if (ctx.callingUser !== owner) {
    throw new OfferLoanOwnerCallerMismatchError(ctx.callingUser, owner).logError(ctx.logger);
  }

  if (registrar && Array.isArray(borrowers) && borrowers.length >= 1) {
    throw new ExclusiveRegistrarBorrowersError(registrar, borrowers).logError(ctx.logger);
  }

  // checking isBigNumber() because even though isCompleteKey() establishes that an instance exists,
  // the TypeScript compilier needs a simpler assertion.
  if (
    tokenQueryKey.isCompleteKey() &&
    BigNumber.isBigNumber(tokenQueryKey.instance) &&
    tokenQueryKey.instance.isEqualTo(TokenInstance.FUNGIBLE_TOKEN_INSTANCE)
  ) {
    // todo: implement fungible token support
    // this ancient code was written before locking fungible tokens was supported
    // should be a straightforward addition as of Fall 2024
    throw new OfferLoanFungibleTokenNotImplementedError(tokenQueryKey.serialize()).logError(ctx.logger);
  }

  const balancesData = { owner: asValidUserAlias(owner) };

  // partialCompositeKey values, in order, with no gaps. break as soon as one is undefined.
  for (const property of tokenQueryKey.publicKeyProperties()) {
    if (typeof tokenQueryKey[property] === "undefined") {
      break;
    }
    balancesData[property] = tokenQueryKey[property];
  }

  const balances = await fetchBalances(ctx, balancesData);

  let offers: LoanOffer[] = [];

  if (tokenQueryKey.isCompleteKey()) {
    const completeKey: TokenInstanceKey = tokenQueryKey.toCompleteKey();
    // complete key, including specific instance. single NFT to loan
    if (balances.length > 1) {
      throw new MultipleTokenBalancesError(owner, completeKey.serialize()).logError(ctx.logger);
    }

    const balance = balances[0];
    // verify the instance is actually on the owner's balance sheet.
    const owned = balance.getNftInstanceIds().find((i) => {
      return BigNumber.isBigNumber(tokenQueryKey.instance) && completeKey.instance.isEqualTo(i);
    });

    if (!owned) {
      throw new MissingInstanceBalanceError(owner, completeKey.serialize()).logError(ctx.logger);
    }

    const offer = new LoanOffer();
    offer.collection = completeKey.collection;
    offer.category = completeKey.category;
    offer.type = completeKey.type;
    offer.additionalKey = completeKey.additionalKey;
    offer.instance = completeKey.instance;
    offer.owner = owner;
    offer.created = ctx.txUnixTime;
    offer.id = 0;
    offer.status = LoanStatus.Open;
    offer.reward = rewards;
    offer.uses = uses;
    offer.usesSpent = new BigNumber("0");
    offer.expires = expires;

    offers.push(offer);
  } else {
    // partial key provided;
    // OfferLoan on all matching NFTs (e.g. all my tanks, or all my weapons, etc).
    for (let i = 0; i < balances.length; i++) {
      const batch = balances[i].getNftInstanceIds().map((id) => {
        const offer = new LoanOffer();
        offer.collection = balances[i].collection;
        offer.category = balances[i].category;
        offer.type = balances[i].type;
        offer.additionalKey = balances[i].additionalKey;
        offer.instance = id;
        offer.owner = owner;
        offer.created = ctx.txUnixTime;
        offer.id = i;
        offer.status = LoanStatus.Open;
        offer.reward = rewards;
        offer.uses = uses;
        offer.usesSpent = new BigNumber("0");
        offer.expires = expires;

        return offer;
      });

      offers = offers.concat(batch ?? []);
    }
  }

  const writes: Array<[LoanOffer, Lender]> = [];

  let toUsers: string[] = [];

  if (registrar) {
    // todo: lookup / validate registrar here
    toUsers.push(registrar);

    for (let i = 0; i < offers.length; i++) {
      const write: LoanOffer = offers[i];
      write.registrar = registrar;

      const lender: Lender = write.Lender();

      writes.push([write, lender]);
    }
  } else if (Array.isArray(borrowers)) {
    // owner specifices specific borrower list;
    // dto handles max length validation to avoid denial-of-service attempts.
    toUsers = toUsers.concat(borrowers);

    for (const offer of offers) {
      for (let i = 0; i < borrowers.length; i++) {
        const write: LoanOffer = instanceToInstance(offer);
        write.id = i;
        write.registrar = Loan.NULL_REGISTRAR_KEY;
        write.borrower = borrowers[i];

        const lender: Lender = write.Lender();

        writes.push([write, lender]);
      }
    }
  }

  const quantities = toUsers.map((elem) => {
    return plainToInstance(GrantAllowanceQuantity, {
      user: elem,
      quantity: new BigNumber("1")
    });
  });

  await grantAllowance(ctx, {
    tokenInstance: tokenQueryKey,
    allowanceType: AllowanceType.Lock,
    quantities,
    uses,
    expires
  });

  const puts: Promise<void>[] = [];
  const res: LoanOfferResDto[] = [];

  for (let i = 0; i < writes.length; i++) {
    const [offer, lender] = writes[i];

    puts.push(putChainObject(ctx, offer));
    puts.push(putChainObject(ctx, lender));

    const resDto = new LoanOfferResDto();

    resDto.offer = offer;
    resDto.lender = lender;

    res.push(resDto);
  }

  await Promise.all(writes); // TODO writes are not promises

  return res;
}
