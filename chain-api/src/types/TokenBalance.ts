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
import { BigNumber } from "bignumber.js";
import { Exclude, Type } from "class-transformer";
import {
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
  validate
} from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ChainKey, ValidationFailedError } from "../utils";
import {
  BigNumberArrayProperty,
  BigNumberIsNotNegative,
  BigNumberIsPositive,
  BigNumberProperty,
  IsUserAlias
} from "../validators";
import { ChainObject, ObjectValidationFailedError } from "./ChainObject";
import { TokenClassKey, TokenClassKeyProperties } from "./TokenClass";
import { TokenInstance, TokenInstanceKey } from "./TokenInstance";
import { UserAlias } from "./UserAlias";

export class TokenNotInBalanceError extends ValidationFailedError {
  constructor(owner: string, tokenClass: TokenClassKeyProperties, instanceId: BigNumber) {
    const tokenInstanceKey = TokenInstanceKey.nftKey(tokenClass, instanceId).toStringKey();
    super(`Token instance ${tokenInstanceKey} not found in balance of ${owner}`, { owner, tokenInstanceKey });
  }
}

export class TokenLockedError extends ValidationFailedError {
  constructor(
    owner: string,
    tokenClass: TokenClassKeyProperties,
    instanceId: BigNumber,
    name: string | undefined
  ) {
    const tokenInstanceKey = TokenInstanceKey.nftKey(tokenClass, instanceId).toStringKey();
    const lockNameInfo = name === undefined ? "" : `, lock name: ${name}`;
    const message = `Token instance ${tokenInstanceKey} is locked${lockNameInfo}.`;
    super(message, { owner, tokenInstanceKey, name });
  }
}

export class TokenNotLockedError extends ValidationFailedError {
  constructor(owner: string, tokenClass: TokenClassKeyProperties, instanceId: BigNumber) {
    const tokenInstanceKey = TokenInstanceKey.nftKey(tokenClass, instanceId).toStringKey();
    super(`Token instance ${tokenInstanceKey} is not locked`, { owner, tokenInstanceKey });
  }
}

export class TokenQuantityNotUnlockedError extends ValidationFailedError {
  constructor(
    owner: string,
    tokenClass: TokenClassKeyProperties,
    quantity: BigNumber,
    name: string | undefined
  ) {
    const tokenClassKey = TokenClassKey.toStringKey(tokenClass);
    super(
      `Failed to unlock quantity ${quantity} of Fungible token ${tokenClassKey} for TokenHold.name = ${name}.`,
      { owner, tokenClassKey }
    );
  }
}

export class TokenInUseError extends ValidationFailedError {
  constructor(owner: string, tokenClass: TokenClassKeyProperties, instanceId: BigNumber) {
    const tokenInstanceKey = TokenInstanceKey.nftKey(tokenClass, instanceId).toStringKey();
    super(`Token instance ${tokenInstanceKey} is in use`, { owner, tokenInstanceKey });
  }
}

export class TokenNotInUseError extends ValidationFailedError {
  constructor(owner: string, tokenClass: TokenClassKeyProperties, instanceId: BigNumber) {
    const tokenInstanceKey = TokenInstanceKey.nftKey(tokenClass, instanceId).toStringKey();
    super(`Token instance ${tokenInstanceKey} is not in use`, { owner, tokenInstanceKey });
  }
}

export class TokenBalance extends ChainObject {
  @Exclude()
  public static readonly INDEX_KEY = "GCTB";

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public readonly owner: UserAlias;

  @ChainKey({ position: 1 })
  @IsNotEmpty()
  public readonly collection: string;

  @ChainKey({ position: 2 })
  @IsNotEmpty()
  public readonly category: string;

  @ChainKey({ position: 3 })
  @IsNotEmpty()
  public readonly type: string;

  @ChainKey({ position: 4 })
  @IsDefined()
  public readonly additionalKey: string;

  constructor(params?: {
    owner: UserAlias;
    collection: string;
    category: string;
    type: string;
    additionalKey: string;
  }) {
    super();
    if (params) {
      this.owner = params.owner;
      this.collection = params.collection;
      this.category = params.category;
      this.type = params.type;
      this.additionalKey = params.additionalKey;
      this.quantity = new BigNumber(0);
      this.instanceIds = [];
      this.lockedHolds = [];
      this.inUseHolds = [];
    }
  }

  /**
   * Token instance IDs for NFTs. It is also used to determine if the balance is
   * for fungible or non-fungible tokens. If the array is undefined, then the
   * balance is for fungible tokens.
   */
  @IsOptional()
  @BigNumberArrayProperty()
  private instanceIds?: Array<BigNumber>;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TokenHold)
  private lockedHolds?: Array<TokenHold>;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TokenHold)
  private inUseHolds?: Array<TokenHold>;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  private quantity: BigNumber;

  @JSONSchema({
    description:
      "vestingPeriodStart timestamp. For Vesting Locks, this specifies the beginning of the vesting period."
  })
  @Min(0)
  @IsInt()
  @IsOptional()
  public vestingPeriodStart?: number | undefined;

  //
  // NFT
  //

  public getNftInstanceCount(): number {
    return this.getNftInstanceIds().length;
  }

  public getUnexpiredLockedHolds(currentTime: number): TokenHold[] {
    return (this.lockedHolds ?? []).filter((h) => !h.isExpired(currentTime));
  }

  public getUnexpiredLockedHoldsSortedByAscendingExpiration(currentTime: number): TokenHold[] {
    const unexpiredHolds = this.getUnexpiredLockedHolds(currentTime);

    return unexpiredHolds.sort(TokenHold.sortByAscendingExpiration);
  }

  public getUnexpiredInUseHolds(currentTime: number): TokenHold[] {
    return (this.inUseHolds ?? []).filter((h) => !h.isExpired(currentTime));
  }

  public addInstance(instanceId: BigNumber): void {
    this.ensureInstanceIsNft(instanceId);

    if (this.containsInstance(instanceId)) {
      throw new ValidationFailedError(`Token instance ${instanceId} already exists in balance`, {
        balanceKey: TokenClassKey.toStringKey(this),
        instanceId: instanceId.toString()
      });
    }

    if (this.instanceIds === undefined) {
      this.instanceIds = [];
    }

    // add instance ID to array
    this.instanceIds.push(instanceId);
    this.instanceIds.sort((i) => i.comparedTo(i));

    // update quantity
    this.quantity = new BigNumber(this.instanceIds.length);
  }

  public removeInstance(instanceId: BigNumber, currentTime: number) {
    this.ensureInstanceIsNft(instanceId);
    this.ensureInstanceIsInBalance(instanceId);
    this.ensureInstanceIsNotLocked(instanceId, currentTime);
    this.ensureInstanceIsNotUsed(instanceId, currentTime);

    // remove instance ID from array
    this.instanceIds = (this.instanceIds ?? []).filter((id) => !id.eq(instanceId));

    // update quantity
    this.quantity = new BigNumber(this.instanceIds.length);
  }

  public lockInstance(hold: TokenHold, currentTime: number): void {
    this.ensureInstanceIsNft(hold.instanceId);
    this.ensureInstanceIsInBalance(hold.instanceId);
    this.ensureInstanceIsNotLockedWithTheSameName(hold.instanceId, hold.name, currentTime);
    this.ensureInstanceIsNotUsed(hold.instanceId, currentTime);

    this.lockedHolds = [...this.getUnexpiredLockedHolds(currentTime), hold];
  }

  public unlockInstance(instanceId: BigNumber, name: string | undefined, currentTime: number): void {
    const unexpiredLockedHolds = this.getUnexpiredLockedHolds(currentTime);
    const updated = unexpiredLockedHolds.filter((h) => !h.matches(instanceId, name));

    if (unexpiredLockedHolds.length === updated.length) {
      throw new TokenNotLockedError(this.owner, this, instanceId);
    }

    this.lockedHolds = updated;
  }

  public useInstance(hold: TokenHold, currentTime: number): void {
    this.ensureInstanceIsNft(hold.instanceId);
    this.ensureInstanceIsInBalance(hold.instanceId);
    this.ensureInstanceIsNotLocked(hold.instanceId, currentTime);
    this.ensureInstanceIsNotUsed(hold.instanceId, currentTime);

    this.inUseHolds = [...this.getUnexpiredInUseHolds(currentTime), hold];
  }

  public releaseInstance(instanceId: BigNumber, name: string | undefined, currentTime: number): void {
    const unexpiredInUseHolds = this.getUnexpiredInUseHolds(currentTime);
    const updated = unexpiredInUseHolds.filter((h) => !h.matches(instanceId, name));

    if (unexpiredInUseHolds.length === updated.length) {
      throw new TokenNotInUseError(this.owner, this, instanceId);
    }

    this.inUseHolds = updated;
  }

  public clearHolds(instanceId: BigNumber, currentTime: number): void {
    this.ensureInstanceIsNft(instanceId);

    this.lockedHolds = this.getUnexpiredLockedHolds(currentTime).filter(
      (h) => !h.instanceId.isEqualTo(instanceId)
    );
    this.inUseHolds = this.getUnexpiredInUseHolds(currentTime).filter(
      (h) => !h.instanceId.isEqualTo(instanceId)
    );
  }

  public findLockedHold(
    instanceId: BigNumber,
    name: string | undefined,
    currentTime: number
  ): TokenHold | undefined {
    this.ensureInstanceIsNft(instanceId);
    return this.getUnexpiredLockedHolds(currentTime).find((h) => h.matches(instanceId, name));
  }

  public findInUseHold(instanceId: BigNumber, currentTime: number): TokenHold | undefined {
    this.ensureInstanceIsNft(instanceId);
    return this.getUnexpiredInUseHolds(currentTime).find((h) => h.matches(instanceId, undefined));
  }

  public containsAnyNftInstanceId(): boolean {
    return this.getNftInstanceIds().length > 0;
  }

  public isInstanceSpendable(instanceId: BigNumber, currentTime: number): boolean {
    return (
      this.containsInstance(instanceId) &&
      !this.isInstanceLocked(instanceId, currentTime) &&
      !this.isInstanceInUse(instanceId, currentTime)
    );
  }

  public getNftInstanceIds(): BigNumber[] {
    return this.instanceIds?.filter((id) => !TokenInstance.isFungible(id)) ?? [];
  }

  public cleanupExpiredHolds(currentTime: number): TokenBalance {
    this.lockedHolds = this.getUnexpiredLockedHolds(currentTime);
    this.inUseHolds = this.getUnexpiredInUseHolds(currentTime);
    return this;
  }

  private containsInstance(instanceId: BigNumber): boolean {
    return this.instanceIds?.some((id) => id.isEqualTo(instanceId)) ?? false;
  }

  private isInstanceLocked(instanceId: BigNumber, currentTime: number): boolean {
    return this.getUnexpiredLockedHolds(currentTime).some((h) => h.instanceId.isEqualTo(instanceId));
  }

  private isInstanceInUse(instanceId: BigNumber, currentTime: number): boolean {
    return this.getUnexpiredInUseHolds(currentTime).some((h) => h.instanceId.isEqualTo(instanceId));
  }

  private ensureInstanceIsNft(instanceId: BigNumber): void {
    if (instanceId.isNegative() || instanceId.isZero() || !instanceId.isInteger()) {
      const message = `Instance ID must be positive integer, but got ${instanceId.toFixed()}`;
      throw new ValidationFailedError(message, { instanceId: instanceId.toFixed() });
    }
  }

  private ensureInstanceIsInBalance(instanceId: BigNumber): void {
    if (!this.containsInstance(instanceId)) {
      throw new TokenNotInBalanceError(this.owner, this, instanceId);
    }
  }

  private ensureInstanceIsNotLockedWithTheSameName(
    instanceId: BigNumber,
    name: string | undefined,
    currentTime: number
  ): void {
    const hold = this.findLockedHold(instanceId, name, currentTime);
    if (hold !== undefined) {
      throw new TokenLockedError(this.owner, this, instanceId, name);
    }
  }

  private ensureInstanceIsNotLocked(instanceId: BigNumber, currentTime: number): void {
    const hold = this.getUnexpiredLockedHolds(currentTime).find((h) => h.instanceId.isEqualTo(instanceId));
    if (hold !== undefined) {
      throw new TokenLockedError(this.owner, this, instanceId, hold?.name);
    }
  }

  private ensureInstanceIsNotUsed(instanceId: BigNumber, currentTime: number): void {
    if (this.isInstanceInUse(instanceId, currentTime)) {
      throw new TokenInUseError(this.owner, this, instanceId);
    }
  }

  //
  // Fungible API
  //

  public getQuantityTotal(): BigNumber {
    this.ensureContainsNoNftInstances();
    return this.quantity;
  }

  public getSpendableQuantityTotal(currentTime: number): BigNumber {
    this.ensureContainsNoNftInstances();
    const lockedQuantity = this.getCurrentLockedQuantity(currentTime);
    return this.quantity.minus(lockedQuantity);
  }

  public getLockedQuantityTotal(currentTime: number): BigNumber {
    this.ensureContainsNoNftInstances();
    const lockedQuantity = this.getCurrentLockedQuantity(currentTime);
    return lockedQuantity;
  }

  public addQuantity(quantity: BigNumber): void {
    this.ensureContainsNoNftInstances();
    this.ensureIsValidQuantityForFungible(quantity);

    this.quantity = this.quantity.plus(quantity);
  }

  public subtractQuantity(quantity: BigNumber, currentTime: number): void {
    this.ensureContainsNoNftInstances();
    this.ensureIsValidQuantityForFungible(quantity);
    this.ensureQuantityIsSpendable(quantity, currentTime);

    this.quantity = this.quantity.minus(quantity);
  }

  private ensureQuantityIsSpendable(quantity: BigNumber, currentTime: number): void {
    // in use not supported for fungibles
    const lockedQuantity = this.getCurrentLockedQuantity(currentTime);
    const spendableQuantity = this.quantity.minus(lockedQuantity);

    if (spendableQuantity.isLessThan(quantity)) {
      throw new ValidationFailedError("Insufficient balance", {
        balanceKey: this.getCompositeKey(),
        total: this.quantity.toFixed(),
        lockedQuantity: lockedQuantity.toFixed()
      });
    }
  }

  private ensureTokenQuantityHoldIsFungible(hold: TokenHold) {
    if (!hold.instanceId.isEqualTo(TokenInstance.FUNGIBLE_TOKEN_INSTANCE)) {
      const message = `Attempted to perform FT-specific operation on balance containing NFT instances`;
      throw new ValidationFailedError(message, {
        balanceKey: this.getCompositeKey(),
        tokenHold: hold
      });
    }
  }

  public lockQuantity(hold: TokenHold): void {
    this.ensureTokenQuantityHoldIsFungible(hold);
    this.ensureQuantityIsSpendable(hold.quantity, hold.created);

    this.lockedHolds = [...this.getUnexpiredLockedHolds(hold.created), hold];
  }

  private isCallingUserAuthorized(
    hold: TokenHold,
    name?: string,
    callingUser?: UserAlias,
    isTokenAuthority?: boolean
  ): boolean {
    return (
      hold.name === name &&
      (isTokenAuthority ||
        callingUser === hold.lockAuthority ||
        (hold.lockAuthority === undefined && callingUser === this.owner) ||
        (hold.lockAuthority === undefined && callingUser === hold.createdBy))
    );
  }

  public unlockQuantity(
    quantity: BigNumber,
    currentTime: number,
    name?: string,
    callingUser?: UserAlias,
    isTokenAuthority?: boolean
  ): void {
    const unexpiredLockedHolds = this.getUnexpiredLockedHoldsSortedByAscendingExpiration(currentTime);

    const updated: TokenHold[] = [];
    let remainingQuantityToUnlock = quantity;

    for (const hold of unexpiredLockedHolds) {
      // don't try to unlock vesting holds
      if (hold.isVestingHold()) {
        updated.push(hold);
        continue;
      }

      // if neither the authority nor the name match, just leave this hold alone
      if (!this.isCallingUserAuthorized(hold, name, callingUser, isTokenAuthority)) {
        updated.push(hold);
        continue;
      }

      if (hold.quantity.isLessThanOrEqualTo(remainingQuantityToUnlock)) {
        remainingQuantityToUnlock = remainingQuantityToUnlock.minus(hold.quantity);
        // this hold's full quantity can be unlocked, drop it from updated array
        continue;
      } else {
        const remainingHoldQuantity = hold.quantity.minus(remainingQuantityToUnlock);
        remainingQuantityToUnlock = new BigNumber(0);

        const partialQuantityHold = new TokenHold({
          createdBy: hold.createdBy,
          created: hold.created,
          instanceId: hold.instanceId,
          expires: hold.expires,
          name: hold.name,
          lockAuthority: hold.lockAuthority,
          quantity: remainingHoldQuantity
        });

        updated.push(partialQuantityHold);
      }
    }

    if (remainingQuantityToUnlock.isGreaterThan("0")) {
      throw new TokenQuantityNotUnlockedError(this.owner, this, quantity, name);
    }

    this.lockedHolds = updated;
  }

  private getCurrentLockedQuantity(currentTime: number): BigNumber {
    return this.getUnexpiredLockedHolds(currentTime).reduce((sum, h) => {
      const toAdd = h.isVestingHold() ? h.getLockedVestingQuantity(currentTime) : h.quantity;
      return sum.plus(toAdd);
    }, new BigNumber(0));
  }

  private ensureContainsNoNftInstances(): void {
    if (this.containsAnyNftInstanceId()) {
      const message = `Attempted to perform FT-specific operation on balance containing NFT instances`;
      throw new ValidationFailedError(message, {
        currentInstanceIds: this.instanceIds,
        tokenClassKey: TokenClassKey.toStringKey(this)
      });
    }
  }

  private ensureIsValidQuantityForFungible(quantity: BigNumber): void {
    if (quantity.isNegative()) {
      throw new ValidationFailedError(`FT quantity must be positive`, {
        balanceKey: this.getCompositeKey(),
        quantity: quantity.toString()
      });
    }
  }
}

export class TokenHold {
  public static readonly DEFAULT_EXPIRES = 0;

  @IsUserAlias()
  public readonly createdBy: UserAlias;

  @IsNotEmpty()
  @BigNumberIsPositive()
  @BigNumberProperty()
  public readonly instanceId: BigNumber;

  @BigNumberIsNotNegative()
  @BigNumberProperty()
  public readonly quantity: BigNumber;

  @IsPositive()
  @IsInt()
  public readonly created: number;

  @Min(0)
  @IsInt()
  public readonly expires: number;

  @IsString()
  @IsOptional()
  public readonly name?: string;

  @JSONSchema({
    description:
      "User who will be able to unlock token. " +
      "If the value is missing, then token owner and lock creator can unlock " +
      "in all cases token authority can unlock token."
  })
  @IsOptional()
  @IsUserAlias()
  lockAuthority?: UserAlias;

  @Min(0)
  @IsInt()
  @IsOptional()
  public readonly vestingPeriodStart?: number | undefined;

  public constructor(params?: {
    createdBy: UserAlias;
    instanceId: BigNumber;
    quantity: BigNumber;
    created: number;
    expires?: number;
    name?: string;
    lockAuthority?: UserAlias;
    vestingPeriodStart?: number | undefined;
  }) {
    if (params) {
      this.createdBy = params.createdBy;
      this.instanceId = params.instanceId;
      this.quantity = params.quantity;
      this.created = params.created;
      this.expires = params.expires ?? TokenHold.DEFAULT_EXPIRES;
      if (params.name) {
        this.name = params.name;
      }
      if (params.lockAuthority) {
        this.lockAuthority = params.lockAuthority;
      }
      if (params.vestingPeriodStart) {
        this.vestingPeriodStart = params.vestingPeriodStart;
      }
    }
  }

  public static async createValid(params: {
    createdBy: UserAlias;
    instanceId: BigNumber;
    quantity: BigNumber;
    created: number;
    expires: number | undefined;
    name: string | undefined;
    lockAuthority: UserAlias | undefined;
    vestingPeriodStart: number | undefined;
  }): Promise<TokenHold> {
    const hold = new TokenHold({ ...params });

    const errors = await validate(hold);
    if (errors.length > 0) {
      throw new ObjectValidationFailedError(errors);
    }

    return hold;
  }

  public matches(instanceId: BigNumber, name: string | undefined): boolean {
    return this.instanceId.isEqualTo(instanceId) && this.name === name;
  }

  public isExpired(currentTime: number): boolean {
    return this.expires !== 0 && currentTime > this.expires;
  }
  public isVestingHold(): boolean {
    return this.vestingPeriodStart !== undefined;
  }

  public isVestingStarted(currentTime: number): boolean {
    return this.isVestingHold() && currentTime >= this.vestingPeriodStart!;
  }

  public timeSinceStart(currentTime: number): number {
    return this.isVestingHold() ? currentTime - this.vestingPeriodStart! : 0;
  }

  public totalTimeOfVestingPeriod(): number {
    return this.isVestingHold() ? this.expires - this.vestingPeriodStart! : 0;
  }

  // For vesting holds, this returns the quantity that is currently locked by vesting
  public getLockedVestingQuantity(currentTime: number): BigNumber {
    if (!this.isVestingHold()) {
      return new BigNumber(0);
    }

    // if the current time is before the vesting vestingPeriodStart, the full quantity is locked (cliff)
    const timeSinceStart = this.timeSinceStart(currentTime);
    if (timeSinceStart < 0) {
      return this.quantity;
    }

    // if the current time is after the vesting expires, the full quantity is unlocked
    if (currentTime > this.expires) {
      return new BigNumber(0);
    }

    // if the current time is between the vesting vestingPeriodStart and expires, the quantity is partially unlocked
    const perPeriodQuantity = this.quantity.div(this.totalTimeOfVestingPeriod());
    const vestedQuantity = perPeriodQuantity.times(timeSinceStart);
    return this.quantity.minus(vestedQuantity);
  }

  // sort holds in order of ascending expiration, 0 = no expiration date
  public static sortByAscendingExpiration(a: TokenHold, b: TokenHold) {
    if (b.expires === 0 && a.expires === 0) {
      return 0;
    } else if (b.expires === 0) {
      return -1;
    } else if (a.expires === 0 || a.expires > b.expires) {
      return 1;
    } else {
      return -1;
    }
  }
}
