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
import { HFClientBuilder } from "./HFClientBuilder";
import { validateConnectionProfile } from "./validateConnectionProfile";

const orgMsp = "CuratorOrg";

// loosely typed so that tests can break arbitrary parts of the profile
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Profile = Record<string, any>;

function sampleProfile(): Profile {
  return {
    organizations: {
      CuratorOrg: {
        mspid: "CuratorOrg",
        peers: ["peer0.curator.local"],
        certificateAuthorities: ["ca.curator.local"]
      }
    },
    peers: {
      "peer0.curator.local": { url: "grpc://localhost:7041" }
    },
    certificateAuthorities: {
      "ca.curator.local": { url: "http://localhost:7040", caName: "ca.curator.local" }
    },
    channels: {
      "product-channel": { peers: { "peer0.curator.local": { endorsingPeer: true } } }
    }
  };
}

describe("validateConnectionProfile", () => {
  it("should accept a valid profile", () => {
    // When & Then
    expect(() => validateConnectionProfile(sampleProfile(), orgMsp)).not.toThrow();
  });

  it("should accept a profile without channels", () => {
    // Given
    const profile = sampleProfile();
    delete profile.channels;

    // When & Then
    expect(() => validateConnectionProfile(profile, orgMsp)).not.toThrow();
  });

  it.each<[string, (p: Profile) => void, string]>([
    ["missing organizations", (p) => delete p.organizations, "missing .organizations"],
    [
      "missing org",
      (p) => delete p.organizations.CuratorOrg,
      "missing organization .organizations.CuratorOrg"
    ],
    [
      "org without CAs",
      (p) => (p.organizations.CuratorOrg.certificateAuthorities = []),
      ".organizations.CuratorOrg.certificateAuthorities must be a non-empty array of names"
    ],
    ["missing peers", (p) => delete p.peers, "missing .peers"],
    ["empty peers", (p) => (p.peers = {}), "missing .peers"],
    [
      "peer without url",
      (p) => (p.peers["peer0.curator.local"] = {}),
      ".peers.peer0.curator.local.url must be a non-empty string"
    ],
    [
      "peer with non-string url",
      (p) => (p.peers["peer0.curator.local"].url = 7041),
      ".peers.peer0.curator.local.url must be a non-empty string"
    ],
    [
      "missing certificateAuthorities",
      (p) => delete p.certificateAuthorities,
      "missing .certificateAuthorities"
    ],
    [
      "CA without url",
      (p) => delete p.certificateAuthorities["ca.curator.local"].url,
      ".certificateAuthorities.ca.curator.local.url must be a non-empty string"
    ],
    [
      "org referencing unknown CA",
      (p) => (p.organizations.CuratorOrg.certificateAuthorities = ["ca.other"]),
      ".organizations.CuratorOrg.certificateAuthorities references unknown CA ca.other"
    ],
    ["channels not an object", (p) => (p.channels = []), ".channels must be an object"],
    [
      "channel not an object",
      (p) => (p.channels["product-channel"] = "x"),
      ".channels.product-channel must be an object"
    ],
    [
      "channel referencing unknown peer",
      (p) => (p.channels["product-channel"].peers = { "peer9.local": {} }),
      ".channels.product-channel.peers references unknown peer peer9.local"
    ]
  ])("should reject profile with %s", (_, mutate, message) => {
    // Given
    const profile = sampleProfile();
    mutate(profile);

    // When & Then
    expect(() => validateConnectionProfile(profile, orgMsp)).toThrow(
      `Invalid connection profile: ${message}`
    );
  });
});

describe("HFClientBuilder", () => {
  it("should fail with a configuration error when a peer has no url", () => {
    // Given
    const profile = sampleProfile();
    delete profile.peers["peer0.curator.local"].url;

    // When
    const build = () => new HFClientBuilder(orgMsp, "admin", "adminpw", profile);

    // Then
    expect(build).toThrow(
      "Invalid connection profile: .peers.peer0.curator.local.url must be a non-empty string"
    );
  });

  it("should detect localhost peers", () => {
    // When
    const builder = new HFClientBuilder(orgMsp, "admin", "adminpw", sampleProfile());

    // Then
    expect(builder.asLocalhost).toBe(true);
  });
});
