import eth from "./eth";
import { getPayloadToSign } from "./getPayloadToSign";

export enum SigningScheme {
  ETH = "ETH",
  ETH_DER = "ETH_DER",
  TON = "TON"
}

export default {
  ...eth,
  getPayloadToSign
} as const;
