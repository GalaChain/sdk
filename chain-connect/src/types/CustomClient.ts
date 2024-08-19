export interface CustomClient {
  getGalachainAddress: string;
  getWalletAddress: string;
  setWalletAddress: string;
  getChaincodeUrl: string;
  connect: () => Promise<string>;
  sign: (dto: object) => Promise<object>;
}
