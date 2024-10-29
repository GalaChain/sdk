import {
  UserAlias,
  UserRefValidationResult,
  ValidationFailedError,
  signatures,
  validateUserRef
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { PublicKeyService } from "./PublicKeyService";

export async function resolveUserAlias(ctx: GalaChainContext, userRef: string): Promise<UserAlias> {
  const res = validateUserRef(userRef);

  if (res === UserRefValidationResult.VALID_USER_ALIAS || res === UserRefValidationResult.VALID_SYSTEM_USER) {
    return userRef as UserAlias; // this is the only function that can safely cast to UserAlias
  }

  if (res === UserRefValidationResult.VALID_ETH_ADDRESS) {
    const ethAddress = signatures.normalizeEthAddress(userRef);
    const userProfile = await PublicKeyService.getUserProfile(ctx, ethAddress);
    const actualAlias = userProfile?.alias ?? `eth|${ethAddress}`;
    return actualAlias as UserAlias; // this is the only function that can safely cast to UserAlias
  }

  throw new ValidationFailedError(`Invalid user reference: ${userRef}`, { userRef });
}
