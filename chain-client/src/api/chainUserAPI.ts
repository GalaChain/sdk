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
import { configuredDtoOperation } from "@gala-chain/api";

import { ChainClient, ChainUser, UserAlias } from "../generic";

type Signable<T> = {
  signed(privateKey: string, useDer?: boolean): T;
  withOperation(operation: string): T;
  dtoOperation?: string;
};

export interface ChainUserAPI {
  identityKey: UserAlias;
  publicKey: string;
  ethAddress: string;
  sign<T extends { signed(privateKey: string, useDer?: boolean): T }>(dto: T, useDer?: boolean): T;
  signFor<T extends Signable<T>>(method: string, dto: T, useDer?: boolean): T;
  signInPlace<T extends { sign(privateKey: string, useDer?: boolean): void }>(dto: T, useDer?: boolean): T;
}

export function buildChainUserAPI(user: ChainUser): (c: ChainClient) => ChainUserAPI {
  return (client): ChainUserAPI => ({
    identityKey: user.identityKey,
    publicKey: user.publicKey,
    ethAddress: user.ethAddress,
    sign: (dto, useDer) => user.sign(dto, useDer),
    signFor: (method, dto, useDer) => {
      const operation = configuredDtoOperation(client.contractConfig, method);
      if (operation === undefined || (typeof dto.dtoOperation === "string" && dto.dtoOperation.length > 0)) {
        return user.sign(dto, useDer);
      }
      return user.sign(dto.withOperation(operation), useDer);
    },
    signInPlace: (dto, useDer) => user.signInPlace(dto, useDer)
  });
}
