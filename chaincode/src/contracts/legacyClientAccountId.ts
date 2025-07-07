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
import { Context } from "fabric-contract-api";

const ID_SUB_SPLIT_CHAR = "|";

/**
 * Get the client's account ID
 * @deprecated
 */
export function legacyClientAccountId(ctx: Context): string {
  const clientAccountID = ctx.clientIdentity.getID();

  const CNPrefix = "/CN=";
  const CNSuffix = ":";

  if (!clientAccountID.includes(CNPrefix) || !clientAccountID.includes(CNSuffix)) {
    throw new Error(`Invalid client account ID format: ${clientAccountID}`);
  }

  // Extract the name from CN
  const nameStartIndex = clientAccountID.indexOf(CNPrefix) + CNPrefix.length;
  const nameEndIndex = clientAccountID.indexOf(CNSuffix, nameStartIndex);
  const name = clientAccountID.slice(nameStartIndex, nameEndIndex);

  // Validate that name is not empty
  if (!name) {
    throw new Error(`Invalid client account ID format: ${clientAccountID}`);
  }

  // Try to extract organization from OU= first (legacy format), then fall back to O=
  let org = "";

  // Check for /OU= format first (legacy format)
  const OUPrefix = "::/OU=";
  const OUSuffix = "/";
  if (clientAccountID.includes(OUPrefix) && clientAccountID.includes(OUSuffix)) {
    const orgStartIndex = clientAccountID.indexOf(OUPrefix) + OUPrefix.length;
    const orgEndIndex = clientAccountID.indexOf(OUSuffix, orgStartIndex);
    org = clientAccountID.slice(orgStartIndex, orgEndIndex);
  }

  // If no /OU= found or it's empty, try /O= format
  if (!org) {
    const OPrefix = "/O=";
    if (clientAccountID.includes(OPrefix)) {
      const orgStartIndex = clientAccountID.indexOf(OPrefix) + OPrefix.length;
      const orgEndIndex = clientAccountID.indexOf("/", orgStartIndex);
      if (orgEndIndex !== -1) {
        org = clientAccountID.slice(orgStartIndex, orgEndIndex);
      }
    }
  }

  if (!org) {
    throw new Error(`Invalid client account ID format - could not extract organization: ${clientAccountID}`);
  }

  return `${org}${ID_SUB_SPLIT_CHAR}${name}`;
}
