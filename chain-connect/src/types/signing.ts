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
/**
 * Enumeration of available signing methods for GalaChain transactions.
 */
export enum SigningType {
  /** Personal message signing (eth_sign/personal_sign) */
  PERSONAL_SIGN = "personalSign",
  /** Structured data signing (EIP-712 signTypedData) */
  SIGN_TYPED_DATA = "signTypedData"
}
