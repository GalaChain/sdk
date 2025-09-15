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
import { Eip1193Provider } from "ethers";

/**
 * Calculates the personal sign prefix for Ethereum message signing.
 * Iteratively calculates the correct prefix length to account for variable payload sizes.
 * @param payload - The payload object to calculate prefix for
 * @returns The calculated prefix string
 */
export function calculatePersonalSignPrefix(payload: object): string {
  let payloadLength = signatures.getPayloadToSign(payload).length;
  let prefix = "\u0019Ethereum Signed Message:\n" + payloadLength;
  let previousLength = -1;

  while (payloadLength !== previousLength) {
    previousLength = payloadLength;
    prefix = "\u0019Ethereum Signed Message:\n" + payloadLength;
    const newPayload = { ...payload, prefix };
    payloadLength = signatures.getPayloadToSign(newPayload).length;
  }

  return prefix;
}

/**
 * Extended EIP-1193 provider interface with additional wallet-specific properties.
 * Adds support for event handling and wallet detection.
 */
export interface ExtendedEip1193Provider extends Eip1193Provider {
  /** Adds a listener for account change events */
  on(event: "accountsChanged", handler: Listener<string[]>): void;
  /** Removes a listener for account change events */
  removeListener(event: "accountsChanged", handler: Listener<string[]>): void;
  /** Array of available providers (for multi-wallet scenarios) */
  providers?: Eip1193Provider[];
  /** Flag indicating if this is a Trust Wallet provider */
  isTrust?: boolean;
}

/**
 * Event types emitted by MetaMask and compatible wallets.
 */
export interface MetaMaskEvents {
  /** Fired when the active account changes */
  accountChanged: string | null;
  /** Fired when the list of accounts changes */
  accountsChanged: string[] | null;
}

/**
 * Generic event listener function type.
 * @template T - The type of data passed to the listener
 */
export type Listener<T> = (data: T) => void;

/**
 * Simple event emitter implementation for handling wallet events.
 * @template Events - Record type defining available events and their data types
 */
export class EventEmitter<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Listener<Events[K]>[] } = {};

  /**
   * Adds an event listener for the specified event.
   * @param event - The event name to listen for
   * @param listener - The callback function to execute when the event is emitted
   * @returns This instance for method chaining
   */
  public on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(listener);
    return this;
  }

  /**
   * Removes an event listener for the specified event.
   * @param event - The event name to stop listening for
   * @param listener - The callback function to remove
   * @returns This instance for method chaining
   */
  public off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event]?.filter((l) => l !== listener);
    return this;
  }

  /**
   * Emits an event to all registered listeners.
   * @param event - The event name to emit
   * @param data - The data to pass to the listeners
   * @returns True if the event had listeners, false otherwise
   */
  public emit<K extends keyof Events>(event: K, data: Events[K]): boolean {
    if (!this.listeners[event]) return false;
    this.listeners[event]?.forEach((listener) => listener(data));
    return true;
  }
}
