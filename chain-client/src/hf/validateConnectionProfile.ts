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

  const orgCAs = org.certificateAuthorities;
  if (!Array.isArray(orgCAs) || orgCAs.length === 0 || !orgCAs.every(isNonEmptyString)) {
    fail(`.organizations.${orgMsp}.certificateAuthorities must be a non-empty array of names`);
  }

  const peers = profile.peers;
  if (!isObject(peers) || Object.keys(peers).length === 0) {
    fail("missing .peers");
  }
  for (const [name, peer] of Object.entries(peers)) {
    if (!isObject(peer) || !isNonEmptyString(peer.url)) {
      fail(`.peers.${name}.url must be a non-empty string`);
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
  }
  for (const name of orgCAs) {
    if (!(name in certificateAuthorities)) {
      fail(`.organizations.${orgMsp}.certificateAuthorities references unknown CA ${name}`);
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
      for (const peerName of Object.keys(channel.peers)) {
        if (!(peerName in peers)) {
          fail(`.channels.${name}.peers references unknown peer ${peerName}`);
        }
      }
    }
  }
}
