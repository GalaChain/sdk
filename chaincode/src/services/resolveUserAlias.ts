import {
  HasUserAlias,
  UserRefValidationResult,
  ValidationFailedError,
  signatures,
  validateUserRef
} from "@gala-chain/api";

import { GalaChainContext } from "../types";
import { PublicKeyService } from "./PublicKeyService";

export async function resolveUserAlias(ctx: GalaChainContext, userRef: string): Promise<HasUserAlias> {
  const res = validateUserRef(userRef);

  if (res === UserRefValidationResult.VALID_USER_ALIAS || res === UserRefValidationResult.VALID_SYSTEM_USER) {
    return { alias: userRef };
  }

  if (res === UserRefValidationResult.VALID_ETH_ADDRESS) {
    const ethAddress = signatures.normalizeEthAddress(userRef);
    const userProfile = await PublicKeyService.getUserProfile(ctx, ethAddress);
    return { alias: userProfile?.alias ?? `eth|${ethAddress}` };
  }

  throw new ValidationFailedError(`Invalid user reference: ${userRef}`, { userRef });
}
