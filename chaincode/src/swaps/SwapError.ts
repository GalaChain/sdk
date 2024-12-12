import { DefaultError, ValidationFailedError } from "@gala-chain/api";
import { TokenHold } from "@gala-chain/api";
import { BigNumber } from "bignumber.js";

export class InvalidDecimalError extends ValidationFailedError {
  constructor(quantity: BigNumber, decimals: number) {
    super(`Quantity: ${quantity} has more than ${decimals} decimal places.`, { quantity, decimals });
  }
}

export class SwapDtoValidationError extends ValidationFailedError {
  constructor(dtoName: string, errors: string[]) {
    super(`${dtoName} validation failed: ${errors.join(". ")}`, {
      dtoName,
      errors
    });
  }
}

export class TransferLockedTokenError extends ValidationFailedError {
  constructor(lockedHolds: TokenHold[] | undefined) {
    super(`Unable to transfer locked token, fromPersonLockedHolds: ${JSON.stringify(lockedHolds)}`, {
      lockedHolds
    });
  }
}

export class SwapTokenFailedError extends DefaultError {
  constructor(message: string, payload: Record<string, unknown> | undefined) {
    super(`SwapToken failed: ${message}$`, payload);
  }
}
