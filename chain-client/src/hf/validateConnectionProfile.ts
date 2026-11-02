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

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function fail(message: string): never {
  throw new Error(`Invalid connection profile: ${message}`);
}

function validateTlsConfig(entry: Obj, entryPath: string): void {
  const tlsCACerts = entry.tlsCACerts;
  if (tlsCACerts === undefined) {
    return;
  }
  if (!isObject(tlsCACerts)) {
    fail(`${entryPath}.tlsCACerts must be an object`);
  }
  const { pem, path } = tlsCACerts;
  if (pem === undefined && path === undefined) {
    fail(`${entryPath}.tlsCACerts must provide pem or path`);
  }
  if (pem !== undefined && !isNonEmptyString(pem)) {
    fail(`${entryPath}.tlsCACerts.pem must be a non-empty string`);
  }
  if (path !== undefined && !isNonEmptyString(path)) {
    fail(`${entryPath}.tlsCACerts.path must be a non-empty string`);
  }
}

/**
 * Checks the parts of a Fabric connection profile the client relies on, so that
 * a broken profile fails early with a message pointing at the bad entry.
 */
export function validateConnectionProfile(profile: unknown, orgMsp: string): void {
  if (!isObject(profile)) {
    fail("expected an object");
  }

  const organizations = profile.organizations;
  if (!isObject(organizations)) {
    fail("missing .organizations");
  }

  const org = organizations[orgMsp];
  if (!isObject(org)) {
    fail(`missing organization .organizations.${orgMsp}`);
  }
  if (org.mspid !== orgMsp) {
    fail(`.organizations.${orgMsp}.mspid must equal ${orgMsp}`);
  }

  const orgCAs = org.certificateAuthorities;
  if (!Array.isArray(orgCAs) || orgCAs.length === 0 || !orgCAs.every(isNonEmptyString)) {
    fail(`.organizations.${orgMsp}.certificateAuthorities must be a non-empty array of names`);
  }
  const orgPeers = org.peers;
  if (!Array.isArray(orgPeers) || orgPeers.length === 0 || !orgPeers.every(isNonEmptyString)) {
    fail(`.organizations.${orgMsp}.peers must be a non-empty array of names`);
  }

  const peers = profile.peers;
  if (!isObject(peers) || Object.keys(peers).length === 0) {
    fail("missing .peers");
  }
  for (const [name, peer] of Object.entries(peers)) {
    if (!isObject(peer) || !isNonEmptyString(peer.url)) {
      fail(`.peers.${name}.url must be a non-empty string`);
    }
    validateTlsConfig(peer, `.peers.${name}`);
  }
  for (const name of orgPeers) {
    if (!(name in peers)) {
      fail(`.organizations.${orgMsp}.peers references unknown peer ${name}`);
    }
  }

  const certificateAuthorities = profile.certificateAuthorities;
  if (!isObject(certificateAuthorities)) {
    fail("missing .certificateAuthorities");
  }
  for (const [name, ca] of Object.entries(certificateAuthorities)) {
    if (!isObject(ca) || !isNonEmptyString(ca.url)) {
      fail(`.certificateAuthorities.${name}.url must be a non-empty string`);
    }
    if (!isNonEmptyString(ca.caName)) {
      fail(`.certificateAuthorities.${name}.caName must be a non-empty string`);
    }
    validateTlsConfig(ca, `.certificateAuthorities.${name}`);
    if (ca.httpOptions !== undefined) {
      if (!isObject(ca.httpOptions)) {
        fail(`.certificateAuthorities.${name}.httpOptions must be an object`);
      }
      if (ca.httpOptions.verify !== undefined && typeof ca.httpOptions.verify !== "boolean") {
        fail(`.certificateAuthorities.${name}.httpOptions.verify must be a boolean`);
      }
    }
  }
  for (const name of orgCAs) {
    if (!(name in certificateAuthorities)) {
      fail(`.organizations.${orgMsp}.certificateAuthorities references unknown CA ${name}`);
    }
  }

  const orderers = profile.orderers;
  if (orderers !== undefined) {
    if (!isObject(orderers)) {
      fail(".orderers must be an object");
    }
    for (const [name, orderer] of Object.entries(orderers)) {
      if (!isObject(orderer) || !isNonEmptyString(orderer.url)) {
        fail(`.orderers.${name}.url must be a non-empty string`);
      }
      validateTlsConfig(orderer, `.orderers.${name}`);
    }
  }

  const channels = profile.channels;
  if (channels === undefined) {
    return;
  }
  if (!isObject(channels)) {
    fail(".channels must be an object");
  }
  for (const [name, channel] of Object.entries(channels)) {
    if (!isObject(channel)) {
      fail(`.channels.${name} must be an object`);
    }
    if (channel.peers !== undefined) {
      if (!isObject(channel.peers)) {
        fail(`.channels.${name}.peers must be an object`);
      }
      for (const [peerName, peerConfig] of Object.entries(channel.peers)) {
        if (!(peerName in peers)) {
          fail(`.channels.${name}.peers references unknown peer ${peerName}`);
        }
        if (!isObject(peerConfig)) {
          fail(`.channels.${name}.peers.${peerName} must be an object`);
        }
      }
    }
  }
}
