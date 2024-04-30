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

  const OUPrefix = "::/OU=";
  const OUSuffix = "/";
  const CNPrefix = "/CN=";
  const CNSuffix = ":";

  if (
    !clientAccountID.includes(OUPrefix) ||
    !clientAccountID.includes(OUSuffix) ||
    !clientAccountID.includes(CNPrefix) ||
    !clientAccountID.includes(CNSuffix)
  ) {
    throw new Error("Invalid client account ID format");
  }

  // eslint-disable-next-line
  const clientAccountIDRegex = /^x509::\/OU\=(.+)\/CN=(.+)\:/;
  if (!clientAccountIDRegex.test(clientAccountID)) {
    throw new Error("Invalid client account ID format");
  }

  const orgStartIndex = clientAccountID.indexOf(OUPrefix) + OUPrefix.length;
  const orgEndIndex = clientAccountID.indexOf(OUSuffix, orgStartIndex);

  const nameStartIndex = clientAccountID.indexOf(CNPrefix) + CNPrefix.length;
  const nameEndIndex = clientAccountID.indexOf(CNSuffix, nameStartIndex);

  const org = clientAccountID.slice(orgStartIndex, orgEndIndex);
  const name = clientAccountID.slice(nameStartIndex, nameEndIndex);

  return `${org}${ID_SUB_SPLIT_CHAR}${name}`;
}
