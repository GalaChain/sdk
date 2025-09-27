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
import { ForbiddenError, UnauthorizedError, UserRole } from "@gala-chain/api";

import { GalaChainContext } from "../types";

export class MissingRoleError extends UnauthorizedError {
  constructor(callingUser: string, callingUserRoles: string[] | undefined, allowedRoles: string[]) {
    const message =
      `User ${callingUser} does not have one of required roles: ` +
      `${allowedRoles.join(", ")} (has: ${callingUserRoles?.join(", ") || "no roles"})`;
    super(message, { callingUser, callingUserRoles, allowedRoles });
  }
}

export class OrganizationNotAllowedError extends ForbiddenError {
  constructor(userMsp: string, allowedOrgsMSPs: string[]) {
    const message =
      `Members of organization ${userMsp} do not have sufficient permissions.` +
      ` Required one of [${allowedOrgsMSPs?.join(", ")}].`;
    super(message, { userMsp, allowedOrgsMSPs });
  }
}

export class ChaincodeNotAllowedError extends ForbiddenError {
  constructor(chaincode: string, allowedChaincodes: string[]) {
    const message =
      `Chaincode ${chaincode} is not allowed to access this method. ` +
      `Required one of [${allowedChaincodes.join(", ")}].`;
    super(message, { chaincode, allowedChaincodes });
  }
}

export const useRoleBasedAuth = process.env.USE_RBAC === "true";

export const curatorOrgMsp = process.env.CURATOR_ORG_MSP?.trim() ?? "CuratorOrg";

const registarOrgsFromEnv = process.env.REGISTRAR_ORG_MSPS?.split(",").map((o) => o.trim());
export const registrarOrgMsps = registarOrgsFromEnv ?? [curatorOrgMsp];

export const requireCuratorAuth = useRoleBasedAuth
  ? { allowedRoles: [UserRole.CURATOR] }
  : { allowedOrgs: [curatorOrgMsp] };

export const requireRegistrarAuth = useRoleBasedAuth
  ? { allowedRoles: [UserRole.REGISTRAR] }
  : { allowedOrgs: registrarOrgMsps };

export function ensureOrganizationIsAllowed(ctx: GalaChainContext, allowedOrgsMSPs: string[] | undefined) {
  const userMsp: string = ctx.clientIdentity.getMSPID();
  const isAllowed = (allowedOrgsMSPs || []).some((o) => o === userMsp);

  if (!isAllowed) {
    throw new OrganizationNotAllowedError(userMsp, allowedOrgsMSPs ?? []);
  }
}

export async function ensureRoleIsAllowed(ctx: GalaChainContext, allowedRoles: string[]) {
  const hasRole = allowedRoles.some((role) => ctx.callingUserRoles?.includes(role));
  if (!hasRole) {
    const callingUser = await (async () => ctx.callingUser)().catch(() => "anonymous");
    throw new MissingRoleError(callingUser, ctx.callingUserRoles, allowedRoles);
  }
}

export function ensureChaincodeIsAllowed(chaincode: string, allowedChaincodes: string[]) {
  if (!allowedChaincodes.includes(chaincode)) {
    throw new ChaincodeNotAllowedError(chaincode, allowedChaincodes);
  }
}

export interface AuthorizeOptions {
  allowedOrgs?: string[];
  allowedRoles?: string[];
  allowedOriginChaincodes?: string[];
  quorum?: number;
}

export interface QuorumInfo {
  signedByKeys: string[];
  pubKeyCount: number;
}

export async function authorize(ctx: GalaChainContext, options: AuthorizeOptions, quorum?: QuorumInfo) {
  if (options.allowedOriginChaincodes && ctx.callingUser.startsWith("service|")) {
    const callingChaincode = ctx.callingUser.slice(8);
    ensureChaincodeIsAllowed(callingChaincode, options.allowedOriginChaincodes);
    return;
  }

  if (quorum) {
    const user = ctx.callingUserProfile;
    const requiredSignatures = Math.max(user.requiredSignatures ?? 1, options.quorum ?? 1);
    if (quorum.signedByKeys.length < requiredSignatures) {
      throw new UnauthorizedError(
        `Insufficient signatures: got ${quorum.signedByKeys.length}, required ${requiredSignatures}.`,
        {
          requiredSignatures,
          providedSignatures: quorum.signedByKeys.length,
          pubKeyCount: quorum.pubKeyCount
        }
      );
    }
  }

  if (options.allowedOrgs) {
    ensureOrganizationIsAllowed(ctx, options.allowedOrgs);
  }

  if (options.allowedRoles) {
    await ensureRoleIsAllowed(ctx, options.allowedRoles);
  }
}
