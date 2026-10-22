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
import FabricCAServices from "fabric-ca-client";
import { Wallet, Wallets } from "fabric-network";
import { Identity } from "fabric-network/lib/impl/wallet/identity";
import fs from "fs";

export class CAClient {
  public readonly orgMsp: string;
  public readonly caHostName: string;
  public readonly asLocalhost: boolean;
  public readonly affiliation: string;
  public readonly wallet: Promise<Wallet>;
  public readonly adminId: string;
  private readonly adminSecret: string;
  private readonly caClient: FabricCAServices;
  private adminEnrollment: Promise<Identity> | undefined;

  constructor(
    orgMsp: string,
    adminId: string,
    adminSecret: string,
    connectionProfile: Record<string, unknown>
  ) {
    this.orgMsp = orgMsp;
    this.caHostName = getCAHostName(connectionProfile, orgMsp);
    this.caClient = buildCAClient(connectionProfile, this.caHostName);
    this.wallet = getGlobalWallet(this.orgMsp, connectionProfile);
    this.adminId = adminId;
    this.adminSecret = adminSecret;
  }

  public get enrolledAdmin(): Promise<Identity> {
    if (this.adminEnrollment) {
      return this.adminEnrollment;
    }

    const pending = this.wallet
      .then((wallet) => enrollUser(this.caClient, wallet, this.orgMsp, this.adminId, this.adminSecret))
      .then((identity) => {
        if (identity === undefined) {
          throw new Error(`Failed to enroll admin user (${this.adminId})`);
        }
        return identity;
      })
      .catch((error: unknown) => {
        if (this.adminEnrollment === pending) {
          this.adminEnrollment = undefined;
        }
        throw error;
      });

    this.adminEnrollment = pending;
    return pending;
  }

  public async isReady(): Promise<boolean> {
    await this.enrolledAdmin;
    return true;
  }

  async getIdentityOrRegisterUser(userId: string): Promise<Identity> {
    const key = onboardingKey(this.orgMsp, this.caHostName, userId);
    const current = userProvisioning.get(key);
    if (current) {
      return current;
    }

    const pending = this.provisionUser(userId).finally(() => {
      if (userProvisioning.get(key) === pending) {
        userProvisioning.delete(key);
      }
    });
    userProvisioning.set(key, pending);
    return pending;
  }

  private async provisionUser(userId: string): Promise<Identity> {
    await this.isReady();

    const wallet = await this.wallet;
    const identity = await wallet.get(userId);
    if (identity !== undefined) {
      return identity;
    }

    const key = onboardingKey(this.orgMsp, this.caHostName, userId);
    let userSecret = registrationSecrets.get(key);
    if (userSecret === undefined) {
      userSecret = await registerUser(this.caClient, this.adminId, wallet, userId, this.affiliation);
      registrationSecrets.set(key, userSecret);
    }

    const enrolled = await enrollUser(this.caClient, wallet, this.orgMsp, userId, userSecret);
    registrationSecrets.delete(key);
    return enrolled;
  }
}

const userProvisioning = new Map<string, Promise<Identity>>();
const registrationSecrets = new Map<string, string>();

function onboardingKey(orgMsp: string, caHostName: string, userId: string): string {
  return JSON.stringify([orgMsp, caHostName, userId]);
}

function getCAHostName(connectionProfile: Record<string, unknown>, orgMsp: string): string {
  const caHostName = connectionProfile?.organizations?.[orgMsp]?.certificateAuthorities?.[0];
  if (caHostName === undefined) {
    const msg = `CA host name not found in connection profile file at .organizations.${orgMsp}.certificateAuthorities[0]`;
    throw new Error(msg);
  }
  return caHostName;
}

function buildCAClient(ccp: Record<string, unknown>, caHostName: string): FabricCAServices {
  const caInfo = ccp.certificateAuthorities?.[caHostName];
  if (caInfo === undefined) {
    const msg = `CA config not found in connection profile file at .certificateAuthorities.${caHostName}`;
    throw new Error(msg);
  }

  const caUrl = caInfo.url;
  if (caUrl === undefined) {
    const msg = `CA url not found in connection profile file at .certificateAuthorities.${caHostName}.url`;
    throw new Error(msg);
  }

  const tlsCACerts = caInfo.tlsCACerts as unknown as { pem?: string; path?: string };
  const caTLSCACerts = readTlsTrustedRoot(tlsCACerts);
  const tlsConfig = caTLSCACerts
    ? { trustedRoots: [caTLSCACerts], verify: caInfo?.httpOptions?.verify }
    : undefined;

  const caName = caInfo.caName;
  if (caName === undefined) {
    const msg = `CA name not found in connection profile file at .certificateAuthorities.${caHostName}.caName`;
    throw new Error(msg);
  }

  return new FabricCAServices(caUrl, tlsConfig, caName);
}

const pendingEnrollments = new Map<string, true>();

export async function enrollUser(
  caClient: FabricCAServices,
  wallet: Wallet,
  orgMspId: string,
  userId: string,
  userSecret: string
): Promise<Identity> {
  // Check to see if we've already enrolled the admin user.
  const identity = await wallet.get(userId);

  if (identity !== undefined) {
    return identity;
  }

  // Verify if the enrollment is already in progress - too many simultaneous
  // enrollments will cause the CA to fail with a timeout
  if (pendingEnrollments.has(userId)) {
    // Try again after a short delay
    return new Promise((res) => {
      setTimeout(() => res(undefined), 200);
    }).then(() => enrollUser(caClient, wallet, orgMspId, userId, userSecret));
  }

  pendingEnrollments.set(userId, true);

  try {
    // Enroll the user, and import the new identity into the wallet.
    const enrollment = await caClient.enroll({
      enrollmentID: userId,
      enrollmentSecret: userSecret
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: orgMspId,
      type: "X.509"
    };
    await wallet.put(userId, x509Identity);

    return x509Identity;
  } finally {
    // Always clear the pending flag, even on error, to prevent infinite retry loops
    pendingEnrollments.delete(userId);
  }
}

async function registerUser(
  caClient: FabricCAServices,
  adminId: string,
  wallet: Wallet,
  userId: string,
  affiliation: string
): Promise<string> {
  const adminIdentity = await wallet.get(adminId);

  if (!adminIdentity) {
    throw new Error("An identity for the admin user does not exist in the wallet");
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, adminId);

  return await caClient.register(
    {
      affiliation: affiliation,
      enrollmentID: userId,
      role: "client",
      maxEnrollments: 0
    },
    adminUser
  );
}

const globalWallets = new Map<string, Promise<Wallet>>();

function walletCacheKey(orgMsp: string, connectionProfile: Record<string, unknown>): string {
  const caHostName = getCAHostName(connectionProfile, orgMsp);
  const authorities = connectionProfile.certificateAuthorities as Record<string, unknown> | undefined;
  return JSON.stringify([orgMsp, caHostName, authorities?.[caHostName] ?? null]);
}

function getGlobalWallet(orgMsp: string, connectionProfile: Record<string, unknown>): Promise<Wallet> {
  const key = walletCacheKey(orgMsp, connectionProfile);
  const existing = globalWallets.get(key);
  if (existing) {
    return existing;
  }

  const wallet = Wallets.newInMemoryWallet();
  globalWallets.set(key, wallet);
  return wallet;
}

function readTlsTrustedRoot(tlsCACerts: { pem?: string; path?: string } | undefined): string | undefined {
  if (typeof tlsCACerts?.pem === "string") {
    return tlsCACerts.pem;
  }

  if (typeof tlsCACerts?.path === "string") {
    return fs.readFileSync(tlsCACerts.path, "utf8");
  }

  return undefined;
}
