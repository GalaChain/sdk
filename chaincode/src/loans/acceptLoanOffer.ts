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
  ExpiredOfferError,
  InvalidTokenKeyError,
  Loan,
  LoanAgreement,
  LoanClosedBy,
  LoanOffer,
  LoanStatus,
  OfferBorrowerMismatchError,
  OfferUnavailableError,
  TokenInstanceKey,
  UserAlias,
  UserMustBeRegistrarError,
  asValidUserAlias
} from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

import { lockToken } from "../locks";
import { GalaChainContext } from "../types";
import { getObjectByKey, putChainObject } from "../utils";

interface AcceptLoanOfferParams {
  offerKey: string;
  borrower: string;
  token: TokenInstanceKey;
}

export async function acceptLoanOffer(
  ctx: GalaChainContext,
  { offerKey, borrower, token }: AcceptLoanOfferParams
): Promise<Loan> {
  const offer: LoanOffer = await getObjectByKey(ctx, LoanOffer, offerKey);

  const validToken = offer.verifyTokenKey(token);

  if (!validToken) {
    throw new InvalidTokenKeyError(offer.tokenKey(), borrower).logError(ctx.logger);
  }

  if (offer.registrar && ctx.callingUser !== offer.registrar) {
    throw new UserMustBeRegistrarError(offer.registrar, ctx.callingUser, offer.tokenKey(), borrower).logError(
      ctx.logger
    );
  }

  if (offer.borrower && offer.borrower !== borrower && ctx.callingUser !== offer.borrower) {
    throw new OfferBorrowerMismatchError(borrower, offer.borrower, offer.tokenKey()).logError(ctx.logger);
  }

  if (offer.status !== LoanStatus.Open) {
    throw new OfferUnavailableError(offer.status, offer.tokenKey(), borrower).logError(ctx.logger);
  }

  const acceptanceTime = ctx.txUnixTime;

  if (offer.expires !== 0 && offer.expires < acceptanceTime) {
    throw new ExpiredOfferError(offer.expires, acceptanceTime, offer.tokenKey(), borrower).logError(
      ctx.logger
    );
  }

  const registrarAlias: UserAlias | undefined = asValidUserAlias(offer.registrar);
  const ownerAlias: UserAlias = asValidUserAlias(offer.owner);

  await lockToken(ctx, {
    tokenInstanceKey: token,
    lockAuthority: registrarAlias,
    owner: ownerAlias,
    quantity: new BigNumber("1"),
    allowancesToUse: [],
    expires: 0,
    name: undefined,
    verifyAuthorizedOnBehalf: async () => undefined
  });

  const loan = new Loan();
  loan.registrar = offer.registrar ?? Loan.NULL_REGISTRAR_KEY;
  loan.collection = offer.collection;
  loan.category = offer.category;
  loan.type = offer.type;
  loan.additionalKey = offer.additionalKey;
  loan.instance = offer.instance;
  loan.start = acceptanceTime;
  loan.end = 0;
  loan.owner = offer.owner;
  loan.borrower = borrower;
  loan.status = LoanStatus.Contracted;
  loan.closedBy = LoanClosedBy.Unspecified;

  const agreement = new LoanAgreement();
  agreement.owner = offer.owner;
  agreement.offer = offerKey;
  agreement.loan = loan.getCompositeKey();
  agreement.borrower = borrower;
  agreement.created = acceptanceTime;

  offer.usesSpent = offer.usesSpent.plus(1);

  if (offer.usesSpent.isGreaterThanOrEqualTo(offer.uses)) {
    offer.status = LoanStatus.Fulfilled;
  }

  await putChainObject(ctx, offer);
  await putChainObject(ctx, loan);
  await putChainObject(ctx, agreement);

  return loan;
}
