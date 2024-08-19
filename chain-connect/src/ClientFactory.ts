import { GalachainClient } from "./GalachainClient";
import { GalachainConnectTrustClient, MetamaskConnectClient } from "./customClients";

export class ClientFactory {
  public metamaskClient(chaincodeUrl: string): GalachainClient {
    const instance = new MetamaskConnectClient(chaincodeUrl);
    return new GalachainClient(instance);
  }

  public trustClient(chaincodeUrl: string): GalachainClient {
    const instance = new GalachainConnectTrustClient(chaincodeUrl);
    return new GalachainClient(instance);
  }
}
