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
import path from "path";

import { getCPPs } from "./connection-profile";

describe("getCPPs", () => {
  it("uses the orderer organization TLS CA when TLS and an explicit orderer are set", () => {
    const cryptoConfigRoot = "/crypto-config";
    const ordererHost = "orderer0.group1.orderer.local";
    const expected = path.resolve(
      cryptoConfigRoot,
      "ordererOrganizations",
      "orderer.local",
      "orderers",
      ordererHost,
      "tls/ca.crt"
    );

    const profiles = getCPPs(cryptoConfigRoot, ["product-channel"], "localhost", true, true, false);

    expect(profiles.curator.orderers?.[ordererHost].tlsCACerts?.path).toEqual(expected);
    expect(profiles.partner.orderers?.[ordererHost].tlsCACerts?.path).toEqual(expected);
    expect(profiles.users.orderers?.[ordererHost].tlsCACerts?.path).toEqual(expected);
    expect(profiles.curator.peers["peer0.curator.local"].tlsCACerts?.path).toEqual(
      path.resolve(
        cryptoConfigRoot,
        "peerOrganizations",
        "curator.local",
        "peers",
        "peer0.curator.local",
        "tls/ca.crt"
      )
    );
    expect(profiles.partner.certificateAuthorities?.["ca.partner1.local"].tlsCACerts?.path).toEqual(
      path.resolve(
        cryptoConfigRoot,
        "peerOrganizations",
        "partner1.local",
        "ca",
        "ca.partner1.local-cert.pem"
      )
    );
  });
});
