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
import { PublicKeyService } from "./PublicKeyService";

it(`should normalize secp256k1 public key`, async () => {
  // Given
  // source: https://privatekeys.pw/key/e0b739030ad0edaf7dcda1bf6675da9519dc994edf48a827904e7fc947a16543#public
  const inputBase64Compressed = "Arcbr1zlt/HN/ILijy/v2mJ2whRs0Zfl+hD6/h9+ravH";
  const inputBase64 =
    "BLcbr1zlt/HN/ILijy/v2mJ2whRs0Zfl+hD6/h9+ravHeN8bcGXUC5ndxTtKogYk+b1TElMCu+2VlC2BujwT1qY=";

  const inputHexCompressed = "02b71baf5ce5b7f1cdfc82e28f2fefda6276c2146cd197e5fa10fafe1f7eadabc7";
  const inputHex =
    "04b71baf5ce5b7f1cdfc82e28f2fefda6276c2146cd197e5fa10fafe1f7eadabc778df1b7065d40b99ddc53b4aa20624f9bd53125302bbed95942d81ba3c13d6a6";

  const inputHex0xCompressed = `0x${inputHexCompressed}`;
  const inputHex0x = `0x${inputHex}`;

  const inputInvalid1 = inputBase64 + "a"; // invalid length
  const inputInvalid2 = inputHex.replace("0", "1");

  // When
  const keyFromBase64C = PublicKeyService.normalizePublicKey(inputBase64Compressed);
  const keyFromBase64 = PublicKeyService.normalizePublicKey(inputBase64);
  const keyFromHexC = PublicKeyService.normalizePublicKey(inputHexCompressed);
  const keyFromHex = PublicKeyService.normalizePublicKey(inputHex);
  const keyFromHex0xC = PublicKeyService.normalizePublicKey(inputHex0xCompressed);
  const keyFromHex0x = PublicKeyService.normalizePublicKey(inputHex0x);
  const fails1 = new Promise((res) => res(PublicKeyService.normalizePublicKey(inputInvalid1)));
  const fails2 = new Promise((res) => res(PublicKeyService.normalizePublicKey(inputInvalid2)));

  // Then
  expect(keyFromBase64C).toEqual(inputBase64Compressed);
  expect(keyFromBase64).toEqual(inputBase64Compressed);
  expect(keyFromHexC).toEqual(inputBase64Compressed);
  expect(keyFromHex).toEqual(inputBase64Compressed);
  expect(keyFromHex0xC).toEqual(inputBase64Compressed);
  expect(keyFromHex0x).toEqual(inputBase64Compressed);
  expect(await fails1.catch((e) => e.message)).toEqual(expect.stringContaining("Cannot normalize secp256k1"));
  expect(await fails2.catch((e) => e.message)).toEqual(expect.stringContaining("Invalid public key"));
});
