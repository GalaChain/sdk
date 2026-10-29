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
 * Domain name for an EIP-712 signature.
 * An explicit name wins. Otherwise STG and DEV select the deployment name, and anything else stays GalaChain.
 * chainId is not part of this domain.
 */
export function eip712DomainName(options?: { domainName?: string; network?: string }): string {
  const explicit = options?.domainName?.trim();
  if (explicit) {
    return explicit;
  }
  if (options?.network === "STG") {
    return "GalaChainStage";
  }
  if (options?.network === "DEV") {
    return "GalaChainDev";
  }
  return "GalaChain";
}
