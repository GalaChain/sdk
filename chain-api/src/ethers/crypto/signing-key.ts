/**
 *  Add details about signing here.
 *
 *  @_subsection: api/crypto:Signing  [about-signing]
 */

/*
 I changed this to save us a bit of space rather than import another keccak lib  
//import { secp256k1 } from "@noble/curves/secp256k1";
*/
//I used to use this:
import { ec as EC, ec } from "elliptic";

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
  ecSecp256k1: ec;

  /**
   *  Creates a new **SigningKey** for %%privateKey%%.
   */
  constructor(privateKey: BytesLike) {
    assertArgument(dataLength(privateKey) === 32, "invalid private key", "privateKey", "[REDACTED]");
    this.#privateKey = hexlify(privateKey);
    this.ecSecp256k1 = new EC("secp256k1");
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

    const keyPair = this.ecSecp256k1.keyFromPrivate(this.#privateKey.substring(2));
    const sig = keyPair.sign(getBytesCopy(digest), { canonical: true });

    return Signature.from({
      r: toBeHex(sig.r, 32),
      s: toBeHex(sig.s, 32),
      v: sig.recoveryParam ? 0x1c : 0x1b
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
  computeSharedSecret(other: BytesLike): string {
    const pubKey = SigningKey.computePublicKey(other);
    const keyPair = this.ecSecp256k1.keyFromPrivate(this.#privateKey.substring(2));
    const sharedSecret = keyPair.derive(
      this.ecSecp256k1.keyFromPublic(getBytes(pubKey).slice(1)).getPublic()
    );

    const sharedSecretArray = sharedSecret.toArray("be", 32); // Get array of bytes in big-endian order
    return hexlify(new Uint8Array(sharedSecretArray));
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
      const ec = new EC("secp256k1");
      const keyPair = ec.keyFromPrivate(bytes);
      const pubKey = keyPair.getPublic(compressed, "hex");
      return "0x" + pubKey;
    }

    // raw public key; use uncompressed key with 0x04 prefix
    if (bytes.length === 64) {
      const pub = new Uint8Array(65);
      pub[0] = 0x04;
      pub.set(bytes, 1);
      bytes = pub;
    }

    const ec = new EC("secp256k1");
    const point = ec.keyFromPublic(bytes).getPublic();
    return "0x" + point.encode("hex", compressed);
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

    const ec = new EC("secp256k1");
    const recoveredKey = ec.recoverPubKey(
      getBytesCopy(digest),
      {
        r: sig.r.substring(2),
        s: sig.s.substring(2),
        recoveryParam: sig.yParity
      },
      recoveryParam
    );

    return "0x" + recoveredKey.encode("hex", false);
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
  static addPoints(p0: BytesLike, p1: BytesLike, compressed = false): string {
    const ec = new EC("secp256k1");
    const pub0 = ec.keyFromPublic(SigningKey.computePublicKey(p0).substring(2), "hex").getPublic();
    const pub1 = ec.keyFromPublic(SigningKey.computePublicKey(p1).substring(2), "hex").getPublic();
    const sum = pub0.add(pub1);

    return "0x" + sum.encode("hex", compressed);
  }
}
