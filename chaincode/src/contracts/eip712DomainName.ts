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
import { ChainCallDTO, UnauthorizedError } from "@gala-chain/api";

const MAINNET_DOMAIN_NAME = "GalaChain";
const STAGING_DOMAIN_NAME = "GalaChainStage";
const DEV_DOMAIN_NAME = "GalaChainDev";

export function expectedEip712DomainName(): string {
  const network = process.env.GC_NETWORK?.trim();
  if (network === "MNT") {
    return MAINNET_DOMAIN_NAME;
  }
  if (network === "STG") {
    return STAGING_DOMAIN_NAME;
  }
  return DEV_DOMAIN_NAME;
}

function isEip712(dto: ChainCallDTO): boolean {
  return (
    dto.domain !== undefined &&
    dto.domain !== null &&
    typeof dto.domain === "object" &&
    !Array.isArray(dto.domain) &&
    dto.types !== undefined &&
    dto.types !== null &&
    typeof dto.types === "object" &&
    !Array.isArray(dto.types)
  );
}

/**
 * An EIP-712 signature must use this deployment's domain name.
 * domain.chainId stays the Ethereum network the wallet is connected to.
 */
export function assertEip712DomainName(dto: ChainCallDTO): void {
  if (!isEip712(dto)) {
    return;
  }

  const name = (dto.domain as Record<string, unknown>).name;
  const expected = expectedEip712DomainName();
  if (name !== expected) {
    const received = typeof name === "string" && name.length > 0 ? name : "none";
    throw new UnauthorizedError(
      `EIP-712 domain name must be ${expected} for this deployment. Received ${received}.`,
      { expected, received }
    );
  }
}
