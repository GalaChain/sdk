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
import { ClassConstructor } from "../types";

/**
 * Constructors used by nft/currency class factories.
 * Bind these from the consumer's type package so instances share that module identity.
 */
export interface TokenFixtureClasses {
  TokenClassKey: ClassConstructor<unknown>;
  TokenClass: ClassConstructor<unknown>;
  TokenAllowance: ClassConstructor<unknown>;
  TokenInstanceKey: ClassConstructor<unknown>;
  TokenInstance: ClassConstructor<unknown>;
  TokenInstanceMetadata: ClassConstructor<unknown>;
  NftCollectionAuthorization: ClassConstructor<unknown>;
  TokenBalance: ClassConstructor<unknown>;
  TokenBurn: ClassConstructor<unknown>;
}

let bound: TokenFixtureClasses | undefined;

/**
 * Registers token class constructors for `nft.tokenClass()` / `currency.tokenBalance()` factories.
 * Call once from the consuming project's Jest setup.
 *
 * Plain factories (`nft.tokenClassPlain()`, …) do not need this.
 */
export function bindTokenFixtureClasses(classes: TokenFixtureClasses): void {
  bound = classes;
}

export function tokenFixtureClass(name: keyof TokenFixtureClasses): ClassConstructor<unknown> {
  if (bound === undefined) {
    throw new Error(
      `bindTokenFixtureClasses() must be called before using ${name} factories. ` +
        `Use the *Plain factories, or bind constructors in Jest setup.`
    );
  }

  return bound[name];
}
