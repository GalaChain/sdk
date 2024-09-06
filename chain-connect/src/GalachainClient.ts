import { ChainCallDTO, ConstructorArgs, serialize, signatures } from "@gala-chain/api";
import { BrowserProvider, SigningKey, computeAddress, getAddress, getBytes, hashMessage } from "ethers";

import { CustomEventEmitter, MetaMaskEvents } from "./helpers";

export abstract class CustomClient extends CustomEventEmitter<MetaMaskEvents> {
  abstract connect(): Promise<string>;
  abstract sign(method: string, dto: any): Promise<any>;

  protected address: string;
  protected provider: BrowserProvider | undefined;

  set setWalletAddress(val: string) {
    this.address = getAddress(`0x${val.replace(/0x|eth\|/, "")}`);
  }

  get getGalachainAddress() {
    return this.address.replace("0x", "eth|");
  }

  get getWalletAddress(): string {
    return this.address;
  }

  async getPublicKey() {
    const message = "Sign this to retrieve your public key";

    const signature = await this.signMessage(message);

    const messageHash = hashMessage(message);

    const publicKey = SigningKey.recoverPublicKey(getBytes(messageHash), signature);

    const recoveredAddress = computeAddress(publicKey);

    return { publicKey, recoveredAddress };
  }

  async submit<T, U extends ConstructorArgs<ChainCallDTO>>({
    url,
    method,
    payload,
    sign = false,
    headers = {}
  }: {
    url: string;
    method: string;
    payload: U;
    sign?: boolean;
    headers?: object;
  }): Promise<T | { status: number }> {
    let newPayload = payload;

    if (sign === true) {
      try {
        newPayload = await this.sign(method, payload);
      } catch (error: unknown) {
        throw new Error((error as Error).message);
      }
    }

    if (newPayload instanceof ChainCallDTO) {
      await newPayload.validateOrReject();
    }

    const fullUrl = `${url}/${method}`;
    const response = await fetch(fullUrl, {
      method: "POST",
      body: serialize(newPayload),
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    });

    const id = response.headers.get("x-transaction-id");

    // Check if the content-length is not zero and try to parse JSON
    if (response.headers.get("content-length") !== "0") {
      try {
        const data = await response.json();
        if (data.error) {
          return Promise.reject(data.error);
        }
        return Promise.resolve(id ? { Hash: id, ...data } : data);
      } catch (error) {
        return Promise.reject("Invalid JSON response");
      }
    }
    return Promise.resolve(id ? { Hash: id, status: response.status } : { status: response.status });
  }

  public calculatePersonalSignPrefix(payload: object): string {
    const payloadLength = signatures.getPayloadToSign(payload).length;
    const prefix = "\u0019Ethereum Signed Message:\n" + payloadLength;

    const newPayload = { ...payload, prefix };
    const newPayloadLength = signatures.getPayloadToSign(newPayload).length;

    if (payloadLength === newPayloadLength) {
      return prefix;
    }
    return this.calculatePersonalSignPrefix(newPayload);
  }

  public async signMessage(message: string) {
    if (!this.provider) {
      throw new Error("Ethereum provider not found");
    }
    if (!this.address) {
      throw new Error("No account connected");
    }
    try {
      const signer = await this.provider.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error: unknown) {
      throw new Error((error as Error).message);
    }
  }
}
