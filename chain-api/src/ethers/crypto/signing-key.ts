/**
 *  Add details about signing here.
 *
 *  @_subsection: api/crypto:Signing  [about-signing]
 */
import * as secp256k1 from "secp256k1";

import { assertArgument } from "../errors";
import { Signature, SignatureLike } from "../signature";
import { BytesLike, dataLength, getBytes, getBytesCopy, hexlify } from "../utils/data";
import { toBeHex } from "../utils/maths";

/**
 *  A **SigningKey** provides high-level access to the elliptic curve
 *  cryptography (ECC) operations and key management.
 */
export class SigningKey {
  #privateKey: string;
  #privateKeyBuffer: Uint8Array;

  /**
   *  Creates a new **SigningKey** for %%privateKey%%.
   */
  constructor(privateKey: BytesLike) {
    assertArgument(dataLength(privateKey) === 32, "invalid private key", "privateKey", "[REDACTED]");
    this.#privateKey = hexlify(privateKey);
    const keyBytes = getBytes(privateKey);
    assertArgument(secp256k1.privateKeyVerify(keyBytes), "invalid private key", "privateKey", "[REDACTED]");
    this.#privateKeyBuffer = keyBytes;
  }

  /**
   *  The private key.
   */
  get privateKey(): string {
    return this.#privateKey;
  }

  /**
   *  The uncompressed public key.
   *
   * This will always begin with the prefix ``0x04`` and be 132
   * characters long (the ``0x`` prefix and 130 hexadecimal nibbles).
   */
  get publicKey(): string {
    return SigningKey.computePublicKey(this.#privateKey);
  }

  /**
   *  The compressed public key.
   *
   *  This will always begin with either the prefix ``0x02`` or ``0x03``
   *  and be 68 characters long (the ``0x`` prefix and 33 hexadecimal
   *  nibbles)
   */
  get compressedPublicKey(): string {
    return SigningKey.computePublicKey(this.#privateKey, true);
  }

  /**
   *  Return the signature of the signed %%digest%%.
   */
  sign(digest: BytesLike): Signature {
    assertArgument(dataLength(digest) === 32, "invalid digest length", "digest", digest);

    const digestBytes = getBytesCopy(digest);
    const sigObj = secp256k1.ecdsaSign(digestBytes, this.#privateKeyBuffer);

    // Extract r and s from 64-byte signature
    const r = sigObj.signature.slice(0, 32);
    const s = sigObj.signature.slice(32, 64);
    const recoveryParam = sigObj.recid;

    return Signature.from({
      r: toBeHex(r, 32),
      s: toBeHex(s, 32),
      v: recoveryParam === 1 ? 0x1c : 0x1b
    });
  }

  /**
   *  Returns the [[link-wiki-ecdh]] shared secret between this
   *  private key and the %%other%% key.
   *
   *  The %%other%% key may be any type of key, a raw public key,
   *  a compressed/uncompressed pubic key or aprivate key.
   *
   *  Best practice is usually to use a cryptographic hash on the
   *  returned value before using it as a symetric secret.
   *
   *  @example:
   *    sign1 = new SigningKey(id("some-secret-1"))
   *    sign2 = new SigningKey(id("some-secret-2"))
   *
   *    // Notice that privA.computeSharedSecret(pubB)...
   *    sign1.computeSharedSecret(sign2.publicKey)
   *    //_result:
   *
   *    // ...is equal to privB.computeSharedSecret(pubA).
   *    sign2.computeSharedSecret(sign1.publicKey)
   *    //_result:
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  computeSharedSecret(_other: BytesLike): string {
    // ECDH is not directly supported by secp256k1 library
    // This would require point multiplication which is not exposed
    // For now, throw an error indicating this needs elliptic or manual implementation
    throw new Error(
      "ECDH shared secret computation requires elliptic library or manual point multiplication implementation"
    );
  }

  /**
   *  Compute the public key for %%key%%, optionally %%compressed%%.
   *
   *  The %%key%% may be any type of key, a raw public key, a
   *  compressed/uncompressed public key or private key.
   *
   *  @example:
   *    sign = new SigningKey(id("some-secret"));
   *
   *    // Compute the uncompressed public key for a private key
   *    SigningKey.computePublicKey(sign.privateKey)
   *    //_result:
   *
   *    // Compute the compressed public key for a private key
   *    SigningKey.computePublicKey(sign.privateKey, true)
   *    //_result:
   *
   *    // Compute the uncompressed public key
   *    SigningKey.computePublicKey(sign.publicKey, false);
   *    //_result:
   *
   *    // Compute the Compressed a public key
   *    SigningKey.computePublicKey(sign.publicKey, true);
   *    //_result:
   */
  /**
   *  Compute the public key for %%key%%, optionally %%compressed%%.
   *
   *  The %%key%% may be any type of key, a raw public key, a
   *  compressed/uncompressed public key or private key.
   */
  static computePublicKey(key: BytesLike, compressed = false): string {
    let bytes = getBytes(key, "key");

    // private key
    if (bytes.length === 32) {
      const pubKey = secp256k1.publicKeyCreate(bytes, compressed);
      return "0x" + Buffer.from(pubKey).toString("hex");
    }

    // raw public key; use uncompressed key with 0x04 prefix
    if (bytes.length === 64) {
      const pub = new Uint8Array(65);
      pub[0] = 0x04;
      pub.set(bytes, 1);
      bytes = pub;
    }

    // Validate and convert public key format
    if (bytes.length === 65 || bytes.length === 33) {
      // Convert to desired compression format
      const converted = secp256k1.publicKeyConvert(bytes, compressed);
      return "0x" + Buffer.from(converted).toString("hex");
    }

    throw new Error(`Invalid key length: ${bytes.length}`);
  }

  /**
   *  Returns the public key for the private key which produced the
   *  %%signature%% for the given %%digest%%.
   *
   *  @example:
   *    key = new SigningKey(id("some-secret"))
   *    digest = id("hello world")
   *    sig = key.sign(digest)
   *
   *    // Notice the signer public key...
   *    key.publicKey
   *    //_result:
   *
   *    // ...is equal to the recovered public key
   *    SigningKey.recoverPublicKey(digest, sig)
   *    //_result:
   *
   */
  static recoverPublicKey(digest: BytesLike, signature: SignatureLike): string {
    assertArgument(dataLength(digest) === 32, "invalid digest length", "digest", digest);

    const sig = Signature.from(signature);
    const recoveryParam = sig.yParity === 1 ? 1 : 0;

    // Convert r and s to 64-byte signature buffer
    const signatureBuffer = new Uint8Array(64);
    const rBytes = getBytes(sig.r);
    const sBytes = getBytes(sig.s);
    signatureBuffer.set(rBytes.slice(-32), 0); // Take last 32 bytes in case of padding
    signatureBuffer.set(sBytes.slice(-32), 32);

    const digestBytes = getBytesCopy(digest);
    const recoveredKey = secp256k1.ecdsaRecover(signatureBuffer, recoveryParam, digestBytes, false);

    return "0x" + Buffer.from(recoveredKey).toString("hex");
  }

  /**
   *  Returns the point resulting from adding the ellipic curve points
   *  %%p0%% and %%p1%%.
   *
   *  This is not a common function most developers should require, but
   *  can be useful for certain privacy-specific techniques.
   *
   *  For example, it is used by [[HDNodeWallet]] to compute child
   *  addresses from parent public keys and chain codes.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static addPoints(_p0: BytesLike, _p1: BytesLike, _compressed = false): string {
    // Point addition is not directly supported by secp256k1 library
    // This would require elliptic curve point arithmetic which is not exposed
    // For now, throw an error indicating this needs elliptic or manual implementation
    throw new Error(
      "Point addition requires elliptic library or manual elliptic curve point arithmetic implementation"
    );
  }
}
