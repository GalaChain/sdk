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
import { signatures } from "@gala-chain/api";

import { ChainUser } from "./ChainUser";

describe("ChainUser", () => {
  describe("constructor", () => {
    it("should create a ChainUser with eth prefix when name is not provided", () => {
      // Given
      const { privateKey, publicKey } = signatures.genKeyPair();
      const ethAddress = signatures.getEthAddress(publicKey);

      // When
      const chainUser = new ChainUser({ privateKey });

      // Then
      expect(chainUser).toEqual(
        expect.objectContaining({
          prefix: "eth",
          name: ethAddress,
          alias: `eth|${ethAddress}`,
          ethAddress,
          privateKey,
          publicKey
        })
      );
    });

    it("should create a ChainUser with client prefix when name is provided", () => {
      // Given
      const { privateKey, publicKey } = signatures.genKeyPair();
      const ethAddress = signatures.getEthAddress(publicKey);
      const name = "some-name";

      // When
      const chainUser = new ChainUser({ name, privateKey });

      // Then
      expect(chainUser).toEqual(
        expect.objectContaining({
          prefix: "client",
          name,
          alias: `client|${name}`,
          ethAddress,
          privateKey,
          publicKey
        })
      );
    });
  });

  describe("withRandomKeys", () => {
    it("should create a ChainUser with random keys and eth prefix when name is not provided", () => {
      // When
      const chainUser = ChainUser.withRandomKeys();

      // Then
      expect(chainUser).toEqual(
        expect.objectContaining({
          prefix: "eth",
          name: chainUser.ethAddress,
          alias: `eth|${chainUser.ethAddress}`
        })
      );
    });

    it("should create a ChainUser with random keys and client prefix when name is provided", () => {
      // Given
      const name = "some-name";

      // When
      const chainUser = ChainUser.withRandomKeys(name);

      // Then
      expect(chainUser).toEqual(
        expect.objectContaining({
          prefix: "client",
          name,
          alias: `client|${name}`
        })
      );
    });
  });
});
