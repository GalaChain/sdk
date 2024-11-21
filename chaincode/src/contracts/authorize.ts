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
import { ForbiddenError, UnauthorizedError } from "@gala-chain/api";

import { GalaChainContext } from "../types";

class MissingRoleError extends UnauthorizedError {
  constructor(callingUser: string, callingUserRoles: string[] | undefined, allowedRoles: string[]) {
    const message =
      `User ${callingUser} does not have one of required roles: ` +
      `${allowedRoles.join(", ")} (has: ${callingUserRoles?.join(", ") || "no roles"})`;
    super(message, { callingUser, callingUserRoles, allowedRoles });
  }
}

export class OrganizationNotAllowedError extends ForbiddenError {}

export function ensureOrganizationIsAllowed(ctx: GalaChainContext, allowedOrgsMSPs: string[] | undefined) {
  const userMsp: string = ctx.clientIdentity.getMSPID();
  const isAllowed = (allowedOrgsMSPs || []).some((o) => o === userMsp);

  if (!isAllowed) {
    const message =
      `Members of organization ${userMsp} do not have sufficient permissions.` +
      ` Required one of [${allowedOrgsMSPs?.join(", ")}].`;
    throw new OrganizationNotAllowedError(message, { userMsp });
  }
}

export async function ensureRoleIsAllowed(ctx: GalaChainContext, allowedRoles: string[]) {
  const hasRole = allowedRoles.some((role) => ctx.callingUserRoles?.includes(role));
  if (!hasRole) {
    const callingUser = await (async () => ctx.callingUser)().catch(() => "anonymous");
    throw new MissingRoleError(callingUser, ctx.callingUserRoles, allowedRoles);
  }
}

export async function authorize(
  ctx: GalaChainContext,
  options: { allowedOrgs?: string[]; allowedRoles?: string[]; quorum?: number } = {}
) {
  if (options.allowedOrgs) {
    ensureOrganizationIsAllowed(ctx, options.allowedOrgs);
  }

  if (options.allowedRoles) {
    await ensureRoleIsAllowed(ctx, options.allowedRoles);
  }
}
