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
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";
import { JSONSchema } from "class-validator-jsonschema";

import { ValidationFailedError } from "../utils";
import { IsUserAlias } from "../validators";
import { TokenBalanceLimit } from "./TokenBalanceLimit";
import { TokenClassKey, TokenClassKeyProperties } from "./TokenClass";
import { UserAlias } from "./UserAlias";

export type TokenBalanceSpendTarget = UserAlias | "burn";

export class TokenBalanceTargetNotAllowedError extends ValidationFailedError {
  constructor(
    owner: string,
    tokenClass: TokenClassKeyProperties,
    target: TokenBalanceSpendTarget,
    allowed: UserAlias[]
  ) {
    const tokenClassKey = TokenClassKey.toStringKey(tokenClass);
    const allowedLabel = allowed.length === 0 ? "none" : allowed.join(", ");
    super(
      `Target ${target} is not allowed for token ${tokenClassKey} of ${owner} (allowed: ${allowedLabel})`,
      {
        owner,
        tokenClassKey,
        target,
        allowedTargets: allowed
      }
    );
  }
}

export class TokenBalanceTargetsEmptyError extends ValidationFailedError {
  constructor() {
    super("Targets list must be non-empty");
  }
}

export class TokenBalanceTargets {
  public static readonly CHANGE_DELAY_MS = TokenBalanceLimit.INCREASE_DELAY_MS;

  @JSONSchema({
    description:
      "Allowed transfer destinations. undefined = no restriction. Empty array = frozen (no destinations). " +
      "Non-empty = only those user aliases. Burn is not a destination; empty list allows it as an edge case."
  })
  @IsOptional()
  @IsUserAlias({ each: true })
  public allowed?: UserAlias[];

  @JSONSchema({
    description: "Pending allowed list. Applied at pendingAppliesAt."
  })
  @IsOptional()
  @IsUserAlias({ each: true })
  public pendingAllowed?: UserAlias[];

  @JSONSchema({
    description: "When true, pending change clears allowed (no restriction) at pendingAppliesAt."
  })
  @IsOptional()
  @IsBoolean()
  public pendingAllowAll?: boolean;

  @JSONSchema({
    description: "Unix epoch timestamp in milliseconds (ms) when the pending target change becomes effective."
  })
  @Min(0)
  @IsInt()
  @IsOptional()
  public pendingAppliesAt?: number;

  /**
   * Restrict destinations to the given non-empty alias list.
   * Takes effect after TokenBalanceTargets.CHANGE_DELAY_MS.
   * A later restrict or allow-all while one is pending replaces it and restarts the delay.
   */
  public restrict(targets: UserAlias[], currentTime: number): void {
    if (targets.length === 0) {
      throw new TokenBalanceTargetsEmptyError();
    }
    this.promoteDue(currentTime);
    this.pendingAllowed = [...targets];
    delete this.pendingAllowAll;
    this.pendingAppliesAt = currentTime + TokenBalanceTargets.CHANGE_DELAY_MS;
  }

  /**
   * Clear destination restrictions (allowed becomes undefined).
   * Takes effect after TokenBalanceTargets.CHANGE_DELAY_MS.
   */
  public allowAll(currentTime: number): void {
    this.promoteDue(currentTime);
    delete this.pendingAllowed;
    this.pendingAllowAll = true;
    this.pendingAppliesAt = currentTime + TokenBalanceTargets.CHANGE_DELAY_MS;
  }

  /**
   * Freeze: no allowed transfer destinations.
   * Takes effect immediately and clears any pending target change.
   */
  public freeze(): void {
    this.allowed = [];
    this.clearPending();
  }

  public allows(target: TokenBalanceSpendTarget, currentTime: number): boolean {
    this.promoteDue(currentTime);
    const allowed = this.allowed;
    if (allowed === undefined) {
      return true;
    }
    if (allowed.length === 0) {
      return target === "burn";
    }
    return target !== "burn" && allowed.includes(target);
  }

  public promoteDue(currentTime: number): void {
    const hasAppliesAt = this.pendingAppliesAt !== undefined;
    const hasPendingList = this.pendingAllowed !== undefined;
    const hasPendingAllowAll = this.pendingAllowAll === true;
    const pendingKindCount = (hasPendingList ? 1 : 0) + (hasPendingAllowAll ? 1 : 0);

    if (hasAppliesAt !== (pendingKindCount === 1)) {
      this.clearPending();
      return;
    }
    if (this.pendingAppliesAt === undefined || currentTime < this.pendingAppliesAt) {
      return;
    }
    if (hasPendingAllowAll) {
      delete this.allowed;
    } else {
      this.allowed = this.pendingAllowed;
    }
    this.clearPending();
  }

  private clearPending(): void {
    delete this.pendingAllowed;
    delete this.pendingAllowAll;
    delete this.pendingAppliesAt;
  }
}
