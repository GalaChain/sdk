import { keccak256 } from "js-sha3";

import { getAddress } from "../address";
import { SigningKey } from "../crypto/signing-key";
import { SignatureLike } from "../signature";
import { BytesLike } from "../utils/data";

/**
 *  Returns the address for the %%key%%.
 *
 *  The key may be any standard form of public key or a private key.
 */
export function computeAddress(key: string | SigningKey): string {
  let pubkey: string;
  if (typeof key === "string") {
    pubkey = SigningKey.computePublicKey(key, false);
  } else {
    pubkey = key.publicKey;
  }
  return getAddress(keccak256("0x" + pubkey.substring(4)).substring(26));
}

/**
 *  Returns the recovered address for the private key that was
 *  used to sign %%digest%% that resulted in %%signature%%.
 */
export function recoverAddress(digest: BytesLike, signature: SignatureLike): string {
  return computeAddress(SigningKey.recoverPublicKey(digest, signature));
}
