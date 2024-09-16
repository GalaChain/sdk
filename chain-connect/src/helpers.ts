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
import { Eip1193Provider } from "ethers";

export interface ExtendedEip1193Provider extends Eip1193Provider {
  on(event: "accountsChanged", handler: (accounts: string[]) => void): void;
  providers?: Array<any>;
  isTrust?: boolean;
}

export interface MetaMaskEvents {
  accountChanged: string | null;
  accountsChanged: string[] | null;
}

type Listener<T> = (data: T) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class CustomEventEmitter<Events extends Record<string, any>> {
  private listeners: { [K in keyof Events]?: Listener<Events[K]>[] } = {};

  public on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(listener);
    return this;
  }

  public off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event]?.filter((l) => l !== listener);
    return this;
  }

  public emit<K extends keyof Events>(event: K, data: Events[K]): boolean {
    if (!this.listeners[event]) return false;
    this.listeners[event]?.forEach((listener) => listener(data));
    return true;
  }
}
