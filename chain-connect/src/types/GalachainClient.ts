import { ChainCallDTO, ConstructorArgs, serialize, signatures } from "@gala-chain/api";
import { BrowserProvider, getAddress } from "ethers";

import { CustomEventEmitter, ExtendedEip1193Provider, MetaMaskEvents } from "./helpers";

export interface CustomClient {
  getGalachainAddress: string;
  getWalletAddress: string;
  setWalletAddress: string;
  getChaincodeUrl: string;
  connect: () => Promise<string>;
  sign: (dto: object) => Promise<object>;
}

export interface GalachainClient extends CustomClient {
  //   instance: CustomClient;
  submit: (method: string, dto: object) => Promise<object>;
}
