/**
 *  Cryptographic hashing functions
 *
 *  @_subsection: api/crypto:Hash Functions [about-crypto-hashing]
 */

/*
 I changed this to save us a bit of space rather than import another keccak lib  
 import { keccak_256 } from "@noble/hashes/sha3";
*/
import { keccak256 as keccak256_js_sha3 } from "js-sha3";

import { BytesLike, getBytes, hexlify } from "../utils/data";

let locked = false;

const _keccak256 = function (data: Uint8Array): Uint8Array {
  return new Uint8Array(keccak256_js_sha3.arrayBuffer(data));
};

let __keccak256: (data: Uint8Array) => BytesLike = _keccak256;

/**
 *  Compute the cryptographic KECCAK256 hash of %%data%%.
 *
 *  The %%data%% **m
 * ust** be a data representation, to compute the
 *  hash of UTF-8 data use the [[id]] function.
 *
 *  @returns DataHexstring
 *  @example:
 *    keccak256("0x")
 *    //_result:
 *
 *    keccak256("0x1337")
 *    //_result:
 *
 *    keccak256(new Uint8Array([ 0x13, 0x37 ]))
 *    //_result:
 *
 *    // Strings are assumed to be DataHexString, otherwise it will
 *    // throw. To hash UTF-8 data, see the note above.
 *    keccak256("Hello World")
 *    //_error:
 */
export function keccak256(_data: BytesLike): string {
  const data = getBytes(_data, "data");
  return hexlify(__keccak256(data));
}
keccak256._ = _keccak256;
keccak256.lock = function (): void {
  locked = true;
};
keccak256.register = function (func: (data: Uint8Array) => BytesLike) {
  if (locked) {
    throw new TypeError("keccak256 is locked");
  }
  __keccak256 = func;
};
Object.freeze(keccak256);
