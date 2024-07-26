import { Address, beginCell } from "@ton/core";
import { getSecureRandomBytes, keyPairFromSeed, sign, signVerify } from "@ton/crypto";
import { safeSign, safeSignVerify } from "@ton/ton";

import { getPayloadToSign } from "./getPayloadToSign";

// Keys and nacl signature are generated at: https://tweetnacl.js.org/#/sign)
const key = {
  secret: "wa50qZmPeW5qyETdnYPSRLzdOD6Fv3R/drWgPYkcy6aRiZKhoZ29Lc2MtqJkRVTjR7gDJgXR0qGaPbMFNszGPw==",
  public: "kYmSoaGdvS3NjLaiZEVU40e4AyYF0dKhmj2zBTbMxj8="
};

const keyBuff = {
  secret: Buffer.from(key.secret, "base64"),
  public: Buffer.from(key.public, "base64")
};

const payload = { ton: "Hello world" };
const message = getPayloadToSign(payload);
expect(message).toBe('{"ton":"Hello world"}');

it("should showcase Ed25519 signatures", async () => {
  // Given
  // const keyBuff = {
  //   secret: Buffer.from("Tac7PksqKNOlVDcqlbRGoiokDu5/xYT/pE6z4QZOMdD0NNu61d/Fsc+O2Z+4VuWV4q7T/mLsNdLMQk5LfSqVVw==", "base64"),
  //   public: Buffer.from("9DTbutXfxbHPjtmfuFblleKu0/5i7DXSzEJOS30qlVc=", "base64")
  // }
  //
  const messageBuff = Buffer.from(message);
  const expectedSignature =
    "DMPJyZr5GW4dakldYyDBkcR9a5YI8Mp/83o1+4BUpGnDOgm08ho/efA8Np6J5nzz8omtIQcTf4DZ6GERjKkOCA==";
  // const expectedSignature = "4hrlMzf5ugmUZi/sTU0Ic2wEjH7dh4xVGGVRkr3HlQS+s5tM/fP8teVfys6sT4D1ESLKmO+hQgXJ9+ZdAgTQDA==";

  // When
  const signature = sign(messageBuff, keyBuff.secret);

  // Then
  expect(signature.toString("base64")).toBe(expectedSignature);

  // When
  const isValid = signVerify(messageBuff, signature, keyBuff.public);

  // Then
  expect(isValid).toBeTruthy();
});

// TON uses Ed25519 signatures, but with a different payload
// signature = Ed25519Sign(privkey, sha256(0xffff ++ utf8_encode("my-ton-app") ++ sha256(message)))
// see: https://github.com/ton-connect/demo-dapp-with-react-ui/blob/master/src/server/services/ton-proof-service.ts
//
// To achieve it, we need to use safeSign and safeSignVerify functions instead of sign and signVerify.
// They transform the payload accordingly.
//
it("should showcase TON signatures", async () => {
  // Given
  const messageCell = beginCell().storeBuffer(Buffer.from(message)).endCell();
  const seed = "my-ton-app";

  const expectedSignature =
    "ZnJrUk+G1oiAe6IgetS6pbWsbFn+kH5eQsUwIQ1ZK5ZbJn+rG/KSQjWsDK4PWFVtBH4NbeGV7u4BvTwBhf2XDg==";

  // When
  const signature = safeSign(messageCell, keyBuff.secret, seed);

  // Then
  expect(signature.toString("base64")).toBe(expectedSignature);
  expect(getSignature(payload, keyBuff.secret, seed).toString("base64")).toBe(expectedSignature);

  // When
  const isValid = safeSignVerify(messageCell, signature, keyBuff.public, seed);

  // Then
  expect(isValid).toBeTruthy();
});

it("should generate sample key", async () => {
  // Given
  const pair = await genKeyPair();
  const dto = { ton: "Hello world" };
  const seed = "my-ton-app";

  // When
  const signature = getSignature(dto, pair.secret, seed);
  const isValid = isValidSignature(signature, dto, pair.public, seed);

  // Then
  expect(isValid).toBeTruthy();
});

async function genKeyPair() {
  const secret = await getSecureRandomBytes(32);
  const pair = keyPairFromSeed(secret);

  console.log("secret", secret.toString("base64"));
  console.log("public", pair.publicKey.toString("base64"));

  const cell = beginCell().storeBuffer(Buffer.from(pair.publicKey)).endCell();

  const hash = cell.hash();
  const address = new Address(0, hash);

  console.log("address", address.toString());

  return { secret: pair.secretKey, public: pair.publicKey, address };
}

function getSignature(obj: object, privateKey: Buffer, seed: string) {
  const data = getPayloadToSign(obj);
  const cell = beginCell().storeBuffer(Buffer.from(data)).endCell();

  return safeSign(cell, privateKey, seed);
}

function isValidSignature(signature: Buffer, obj: object, publicKey: Buffer, seed: string) {
  const data = getPayloadToSign(obj);
  const cell = beginCell().storeBuffer(Buffer.from(data)).endCell();

  return safeSignVerify(cell, signature, publicKey, seed);
}
