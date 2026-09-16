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
import { genKeyPair, getEthAddress, getPublicKey } from "./keys";
import { UserAlias } from "./types";

export class ChainUser {
  public readonly prefix: string;
  public readonly name: string;
  public readonly identityKey: UserAlias;
  public readonly ethAddress: string;
  public readonly privateKey: string;
  public readonly publicKey: string;

  constructor(config: { name?: string; privateKey: string }) {
    this.privateKey = config.privateKey;
    this.publicKey = getPublicKey(config.privateKey);
    this.ethAddress = getEthAddress(this.publicKey);

    if (config.name === undefined) {
      this.prefix = "eth";
      this.name = this.ethAddress;
    } else {
      this.prefix = "client";
      this.name = config.name.replace("client|", "");
    }

    this.identityKey = `${this.prefix}|${this.name}` as UserAlias;
  }

  public static withRandomKeys(name?: string): ChainUser {
    return new ChainUser({ ...genKeyPair(), name });
  }
}
