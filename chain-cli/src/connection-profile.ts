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
import * as path from "path";

export interface CaConfig {
  domain: string;
  caHost: string;
  caPort: number;
}

export interface PeerConfig {
  domain: string;
  peerHost: string;
  peerPort: number;
}

export interface OrgConfig extends CaConfig, PeerConfig {}

const curatorCfg: OrgConfig = {
  domain: "curator.local",
  caHost: "ca.curator.local",
  caPort: 7040,
  peerHost: "peer0.curator.local",
  peerPort: 7041
};

const partnerCfg: OrgConfig = {
  domain: "partner1.local",
  caHost: "ca.partner1.local",
  caPort: 7060,
  peerHost: "peer0.partner1.local",
  peerPort: 7061
};

const usersConfig: CaConfig = {
  domain: "users1.local",
  caHost: "ca.users1.local",
  caPort: 7080
};

function caConfig(
  cfg: CaConfig,
  cryptoConfigRoot: string,
  localhostName: string,
  useTls: boolean,
  asLocalhost: boolean
) {
  const host = cfg.caHost;
  const port = asLocalhost ? cfg.caPort : 7054;
  const orgDomain = cfg.domain;
  const caName = cfg.caHost;

  const url = `${useTls ? "https" : "http"}://${asLocalhost ? localhostName : host}:${port}`;
  const tlsCACerts = !useTls
    ? {}
    : {
        tlsCACerts: {
          path: path.resolve(cryptoConfigRoot, "peerOrganizations", orgDomain, "peers", host, "tls/ca.crt")
        }
      };
  const httpOptions = {
    httpOptions: {
      verify: false
    }
  };
  return {
    [host]: { url, caName, ...tlsCACerts, ...httpOptions }
  };
}

function peerConfig(
  cfg: PeerConfig,
  cryptoConfigRoot: string,
  localhostName: string,
  useTls: boolean,
  asLocalhost: boolean
) {
  const host = cfg.peerHost;
  const port = cfg.peerPort;
  const orgDomain = cfg.domain;

  const url = `${useTls ? "grpcs" : "grpc"}://${asLocalhost ? localhostName : host}:${port}`;
  const tlsCACerts = !useTls
    ? {}
    : {
        tlsCACerts: {
          path: path.resolve(cryptoConfigRoot, "peerOrganizations", orgDomain, "peers", host, "tls/ca.crt")
        }
      };
  const grpcOptions = !useTls
    ? {}
    : {
        grpcOptions: { "ssl-target-name-override": host }
      };
  return {
    [host]: { url, ...tlsCACerts, ...grpcOptions }
  };
}

function ordererConfig(
  cryptoConfigRoot: string,
  localhostName: string,
  useTls: boolean,
  asLocalhost: boolean
) {
  const host = "orderer0.group1.orderer.local";
  const port = 7030;
  const url = `${useTls ? "grpcs" : "grpc"}://${asLocalhost ? localhostName : host}:${port}`;
  const orgDomain = "orderer.local";

  const tlsCACerts = !useTls
    ? {}
    : {
        tlsCACerts: {
          path: path.resolve(cryptoConfigRoot, "peerOrganizations", orgDomain, "peers", host, "tls/ca.crt")
        }
      };
  const grpcOptions = !useTls
    ? {}
    : {
        grpcOptions: { "ssl-target-name-override": host }
      };
  return {
    [host]: { url, ...tlsCACerts, ...grpcOptions }
  };
}

function channelConfig(channelName: string) {
  return {
    [channelName]: {
      orderers: ["orderer0.group1.orderer.local"],
      peers: {
        [curatorCfg.peerHost]: {
          endorsingPeer: true,
          chaincodeQuery: true,
          ledgerQuery: true,
          eventSource: true
        },
        [partnerCfg.peerHost]: {
          endorsingPeer: true,
          chaincodeQuery: true,
          ledgerQuery: true,
          eventSource: true
        }
      }
    }
  };
}

function ordererAndChannelConfig(
  cryptoConfigRoot: string,
  channelNames: string[],
  localhostName: string,
  useTls: boolean,
  asLocalhost: boolean
) {
  return {
    orderers: {
      ...ordererConfig(cryptoConfigRoot, localhostName, useTls, asLocalhost)
    },
    channels: {
      ...channelConfigs(channelNames)
    }
  };
}

function channelConfigs(channelNames: string[]) {
  return channelNames.reduce((cfg, ch) => ({ ...cfg, ...channelConfig(ch) }), {});
}

export function cppForCurator(
  cryptoConfigRoot: string,
  channelNames: string[],
  localhostName: string,
  useTls: boolean,
  asLocalhost: boolean,
  useServiceDiscovery: boolean
) {
  return {
    name: "test-network-CuratorOrg",
    version: "1.0.0",
    client: {
      organization: "CuratorOrg"
    },
    organizations: {
      CuratorOrg: {
        mspid: "CuratorOrg",
        peers: [curatorCfg.peerHost],
        certificateAuthorities: [curatorCfg.caHost]
      }
    },
    peers: {
      ...peerConfig(curatorCfg, cryptoConfigRoot, localhostName, useTls, asLocalhost),
      ...(useServiceDiscovery
        ? {}
        : peerConfig(partnerCfg, cryptoConfigRoot, localhostName, useTls, asLocalhost))
    },
    certificateAuthorities: {
      ...caConfig(curatorCfg, cryptoConfigRoot, localhostName, useTls, asLocalhost)
    },
    ...(useServiceDiscovery
      ? {}
      : ordererAndChannelConfig(cryptoConfigRoot, channelNames, localhostName, useTls, asLocalhost))
  };
}

export function cppForPartner(
  cryptoConfigRoot: string,
  channelNames: string[],
  localhostName: string,
  useTls: boolean,
  asLocalhost: boolean,
  useServiceDiscovery: boolean
) {
  return {
    name: "test-network-PartnerOrg1",
    version: "1.0.0",
    client: {
      organization: "PartnerOrg1"
    },
    organizations: {
      PartnerOrg1: {
        mspid: "PartnerOrg1",
        peers: [partnerCfg.peerHost],
        certificateAuthorities: [partnerCfg.caHost]
      }
    },
    peers: {
      ...(useServiceDiscovery
        ? {}
        : peerConfig(curatorCfg, cryptoConfigRoot, localhostName, useTls, asLocalhost)),
      ...peerConfig(partnerCfg, cryptoConfigRoot, localhostName, useTls, asLocalhost)
    },
    certificateAuthorities: {
      ...caConfig(partnerCfg, cryptoConfigRoot, localhostName, useTls, asLocalhost)
    },
    ...(useServiceDiscovery
      ? {}
      : ordererAndChannelConfig(cryptoConfigRoot, channelNames, localhostName, useTls, asLocalhost))
  };
}

export function cppForUsers(
  cryptoConfigRoot: string,
  channelNames: string[],
  localhostName: string,
  useTls: boolean,
  asLocalhost: boolean,
  useServiceDiscovery: boolean
) {
  return {
    name: "test-network-UsersOrg1",
    version: "1.0.0",
    client: {
      organization: "UsersOrg1"
    },
    organizations: {
      CuratorOrg: {
        mspid: "CuratorOrg",
        peers: [curatorCfg.peerHost]
      },
      PartnerOrg1: {
        mspid: "PartnerOrg1",
        peers: [partnerCfg.peerHost]
      },
      UsersOrg1: {
        mspid: "UsersOrg1",
        certificateAuthorities: [usersConfig.caHost]
      }
    },
    peers: {
      ...peerConfig(curatorCfg, cryptoConfigRoot, localhostName, useTls, asLocalhost),
      ...peerConfig(partnerCfg, cryptoConfigRoot, localhostName, useTls, asLocalhost)
    },
    certificateAuthorities: {
      ...caConfig(usersConfig, cryptoConfigRoot, localhostName, useTls, asLocalhost)
    },
    ...(useServiceDiscovery
      ? {}
      : ordererAndChannelConfig(cryptoConfigRoot, channelNames, localhostName, useTls, asLocalhost))
  };
}

export function getCPPs(
  cryptoConfigRoot: string,
  channelNames: string[],
  localhostName: string,
  useTls: boolean,
  asLocalhost: boolean,
  useServiceDiscovery: boolean
) {
  return {
    curator: cppForCurator(
      cryptoConfigRoot,
      channelNames,
      localhostName,
      useTls,
      asLocalhost,
      useServiceDiscovery
    ),
    partner: cppForPartner(
      cryptoConfigRoot,
      channelNames,
      localhostName,
      useTls,
      asLocalhost,
      useServiceDiscovery
    ),
    users: cppForUsers(
      cryptoConfigRoot,
      channelNames,
      localhostName,
      useTls,
      asLocalhost,
      useServiceDiscovery
    )
  };
}
