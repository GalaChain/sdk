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
import { ChainClientBuilder, ContractConfig } from "../generic";
import { CAClient } from "./CAClient";
import { HFClient } from "./HFClient";

export class HFClientBuilder extends ChainClientBuilder {
  public readonly useServiceDiscovery: boolean;
  public readonly asLocalhost: boolean;
  private readonly caClient: CAClient;

  constructor(
    public readonly orgMsp: string,
    adminId: string,
    adminSecret: string,
    private readonly connectionProfile: Record<string, unknown>
  ) {
    super();

    this.caClient = new CAClient(orgMsp, adminId, adminSecret, connectionProfile);

    // if there are both orderers and channels in the connection profile, then we don't need to use service discovery
    this.useServiceDiscovery = !(
      isNonEmptyObject(connectionProfile.orderers) && isNonEmptyObject(connectionProfile.channels)
    );

    if (!isNonEmptyObject(connectionProfile.peers)) {
      throw new Error("No peers found in connection profile");
    }

    // if peer urls contain localhost, then asLocalhost = true
    const peerUrls = Object.values(connectionProfile.peers ?? {}).map((peer) => peer?.url);
    const localhostUrls = peerUrls.filter((url) => url.includes("//localhost:"));

    if (localhostUrls.length > 0 && localhostUrls.length !== peerUrls.length) {
      throw new Error("Cannot mix localhost and non-localhost peer urls");
    }

    this.asLocalhost = localhostUrls.length > 0;
  }

  public forContract(cfg: ContractConfig): HFClient {
    const createContractPromise = async (userId: string) => {
      const gateway = await this.buildConnectedGateway(userId);
      const network = await gateway.getNetwork(cfg.channelName);
      const contract = network.getContract(cfg.chaincodeName, cfg.contractName);

      return { contract: contract, gateway: gateway, network: network };
    };

    return new HFClient(this, this.caClient.adminId, cfg, createContractPromise);
  }

  private async buildConnectedGateway(userId: string) {
    const { Gateway } = await import("fabric-network");

    const gateway = new Gateway();

    const wallet = await this.caClient.wallet;
    const identity = await this.caClient.getIdentityOrRegisterUser(userId);
    const useServiceDiscovery = this.useServiceDiscovery;
    const asLocalhost = this.asLocalhost;

    const gatewayOpts = {
      wallet,
      identity,
      discovery: { enabled: useServiceDiscovery, asLocalhost: asLocalhost }
    };

    await gateway.connect(this.connectionProfile, gatewayOpts);

    return gateway;
  }
}

function isNonEmptyObject(obj: unknown): boolean {
  return typeof obj === "object" && obj !== null && Object.keys(obj).length > 0;
}
