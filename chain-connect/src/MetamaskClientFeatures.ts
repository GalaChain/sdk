import { ChainCallDTO, ConstructorArgs, serialize, signatures } from "@gala-chain/api";
import { BrowserProvider, getAddress } from "ethers";

import { CustomEventEmitter, ExtendedEip1193Provider, MetaMaskEvents } from "./helpers";

export default {
  connect: async () => {
    // connect to Ethereum
  },
  sign: async (dto: object) => {
    // sign the dto
    return dto;
  },
  initializeListeners: async () => {
    if (!window.ethereum) {
      return;
    }
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        this.ethAddress = getAddress(accounts[0]);
        this.emit("accountChanged", this.galachainAddress);
        this.emit("accountsChanged", accounts);
      } else {
        this.ethAddress = "";
        this.emit("accountChanged", null);
        this.emit("accountsChanged", null);
      }
    });
  }
};
