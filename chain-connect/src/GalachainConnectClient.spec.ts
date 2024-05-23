import { GalachainConnectClient } from "./GalachainConnectClient";

global.fetch = jest.fn((url: string, options?: Record<string, unknown>) =>
  Promise.resolve({
    json: () => Promise.resolve({ Request: { url, options } }),
    headers: {
      get: () => {
        status: 1;
      }
    }
  })
) as jest.Mock;

window.ethereum = {
  // @ts-ignore
  getSigner() {
    return {
      provider: {
        send(method: string) {
          if (method == "personal_sign") {
            return "sampleSignature";
          } else {
            throw new Error(`Method for signer not mocked: ${method}`);
          }
        }
      }
    };
  },
  // @ts-ignore
  send(method: string) {
    if ((method = "eth_requestAccounts")) {
      return ["sampleAddress"];
    } else {
      throw new Error(`Method not mocked: ${method}`);
    }
  }
};

describe("GalachainConnectClient", () => {
  it("test full flow", async () => {
    const dto = {
      quantity: "1",
      to: "client|63580d94c574ad78b121c267",
      tokenInstance: {
        additionalKey: "none",
        category: "Unit",
        collection: "GALA",
        instance: "0",
        type: "none"
      },
      uniqueKey: "26d4122e-34c8-4639-baa6-4382b398e68e"
    };

    // call connect
    const client = new GalachainConnectClient();
    await client.connectToMetaMask();

    // send dto payload in sendTransaction
    const response = await client.sendTransaction("https://example.com", "TransferToken", dto);

    expect(response).toEqual({
      Request: {
        options: {
          body: '{"prefix":"\\u0019Ethereum Signed Message:\\n261","quantity":"1","signature":"sampleSignature","to":"client|63580d94c574ad78b121c267","tokenInstance":{"additionalKey":"none","category":"Unit","collection":"GALA","instance":"0","type":"none"},"uniqueKey":"26d4122e-34c8-4639-baa6-4382b398e68e"}',
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        },
        url: "https://example.com/TransferToken"
      }
    });
  });
});
