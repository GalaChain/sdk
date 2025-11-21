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
import { signatures } from "../utils";
import { UpdatePublicKeyDto, createValidSubmitDTO } from "./dtos";

it("should allow to sign and verify public key with different signing schemes", async () => {
  // Given
  const pk1 = signatures.genKeyPair();
  const pk2 = signatures.genKeyPair();
  const dto = (await createValidSubmitDTO(UpdatePublicKeyDto, { publicKey: pk2.publicKey }))
    .withPublicKeySignedBy(pk2.privateKey)
    .signed(pk1.privateKey);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { publicKeySignature, ...dtoWithoutPublicKeySignature } = dto;

  // When
  const regularSignatureValid = dto.isSignatureValid(pk1.publicKey);
  const publicKeySignatureValid = signatures.isValidSignature(
    dto.publicKeySignature ?? "",
    dtoWithoutPublicKeySignature,
    pk2.publicKey
  );

  // Then
  expect(regularSignatureValid).toBe(true);
  expect(publicKeySignatureValid).toBe(true);
});
