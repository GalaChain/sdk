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
import BigNumber from "bignumber.js";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { ChainId } from "./ChainId";
import { TokenInstance, TokenInstanceKey } from "./TokenInstance";
import { RequestTokenBridgeOutDto } from "./bridge";

describe("RequestTokenBridgeOutDto", () => {
  describe("recipient validation", () => {
    it("should accept valid Ethereum address", async () => {
      // Given
      const input = {
        destinationChainId: ChainId.Ethereum,
        tokenInstance: {
          collection: "COLLECTION",
          category: "CATEGORY",
          type: "TYPE",
          additionalKey: "KEY",
          instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
        } as TokenInstanceKey,
        quantity: new BigNumber("100"),
        recipient: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
      };

      // When
      const instance = plainToInstance(RequestTokenBridgeOutDto, input);
      const errors = await validate(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance.recipient).toBe("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
    });

    it("should accept valid Solana address", async () => {
      // Given
      const input = {
        destinationChainId: ChainId.Solana,
        tokenInstance: {
          collection: "COLLECTION",
          category: "CATEGORY",
          type: "TYPE",
          additionalKey: "KEY",
          instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
        } as TokenInstanceKey,
        quantity: new BigNumber("100"),
        recipient: "11111111111111111111111111111111"
      };

      // When
      const instance = plainToInstance(RequestTokenBridgeOutDto, input);
      const errors = await validate(instance);

      // Then
      expect(errors).toHaveLength(0);
      expect(instance.recipient).toBe("11111111111111111111111111111111");
    });

    it("should reject invalid address", async () => {
      // Given
      const input = {
        destinationChainId: ChainId.Ethereum,
        tokenInstance: {
          collection: "COLLECTION",
          category: "CATEGORY",
          type: "TYPE",
          additionalKey: "KEY",
          instance: TokenInstance.FUNGIBLE_TOKEN_INSTANCE
        } as TokenInstanceKey,
        quantity: new BigNumber("100"),
        recipient: "invalid-address"
      };

      // When
      const instance = plainToInstance(RequestTokenBridgeOutDto, input);
      const errors = await validate(instance);

      // Then
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("recipient");
      expect(errors[0].constraints).toBeDefined();
    });
  });
});
