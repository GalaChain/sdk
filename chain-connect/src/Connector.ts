import { ChainCallDTO, ConstructorArgs, serialize, signatures } from "@gala-chain/api";
import { BrowserProvider, getAddress } from "ethers";

import { GalachainMetamaskConnectClient } from "./GalachainMetamaskConnectClient";
import { CustomEventEmitter, ExtendedEip1193Provider, MetaMaskEvents } from "./helpers";
import { CustomClient, GalachainClient } from "./types/GalachainClient";

// class ConnectorInstance implements GalachainClient {
//   constructor(private readonly fn: CustomConnectorFeatures) {}

//   async submit(method: string, dto: object): Promise<object> {
//     await this.fn.connect();
//     const signed = this.fn.sign(dto);
//     // do the actuall submit call
//     return new Promise({});
//   }
// }

const trustConnectorFeatures = {
  connect: async () => {
    // connect to Trust
  },
  sign: async (dto: object) => {
    // sign the dto
    return dto;
  },
  initializeListeners: async () => {}
};

const metamaskConnectorFeatures = {
  connect: async () => {
    // connect to Ethereum
  },
  sign: async (dto: object) => {
    // sign the dto
    return dto;
  },
  initializeListeners: async () => {}
};

const metamaskConnector = new ConnectorInstance(metamaskConnectorFeatures);

const trustConnector = new ConnectorInstance(trustConnectorFeatures);

class ClientFactory {
  #instance: GalachainClient | undefined;

  public instantiate(type: "ethereum" | "trust", chainCodeUrl: string): GalachainClient {
    if (!this.#instance) {
      switch (type) {
        case "ethereum":
          GalachainMetamaskConnectClient.prototype.submit = this.submit;
          const instance: GalachainMetamaskConnectClient = new GalachainMetamaskConnectClient(chainCodeUrl);
          const injectedInstance: GalachainClient = { ...instance, submit: this.submit };
          this.#instance = new GalachainMetamaskConnectClient(chainCodeUrl);
          break;
        case "trust":
          this.#instance = new ConnectorInstance(trustConnectorFeatures);
          break;
      }
    }
    return Connector.instance;
  }

  async submit(method: string, dto: object): Promise<object> {
    await this.fn.connect();
    const signed = this.fn.sign(dto);
    // do the actuall submit call
    return new Promise({});
  }
}
