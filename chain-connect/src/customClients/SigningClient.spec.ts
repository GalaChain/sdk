import { signatures } from "@gala-chain/api";
import { Wallet } from "ethers";

import { SigningType } from "../types";
import { SigningClient } from "./SigningClient";

describe("SigningClient personal sign", () => {
  it("recovers through the chain verifier and drops typed-data metadata", async () => {
    const privateKey = "0x311e3750b1b698e70a2b37fd08b68fdcb389f955faea163f6ffa5be65cd0c251";
    const client = new SigningClient(privateKey, { signingType: SigningType.PERSONAL_SIGN });

    const signed = await client.sign("TransferToken", {
      quantity: "1",
      domain: { name: "GalaChain" },
      types: { TransferToken: [{ name: "quantity", type: "string" }] }
    });

    expect(signed).not.toHaveProperty("domain");
    expect(signed).not.toHaveProperty("types");
    const recovered = signatures.recoverPublicKey(signed.signature, signed);
    expect("0x" + signatures.getEthAddress(recovered)).toBe(new Wallet(privateKey).address);
  });
});
