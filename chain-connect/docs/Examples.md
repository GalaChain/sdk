# GalaChain Connect Examples

This document provides examples of how to use GalaChain Connect in your application, covering both client-side and server-side interactions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Client-Side Usage](#client-side-usage)
  - [Connecting to a Web3 Wallet](#connecting-to-a-web3-wallet)
  - [Creating a Token Class](#creating-a-token-class)
  - [Generating Wallets](#generating-wallets)
- [Server-Side Signing](#server-side-signing)
  - [Server-Side Example](#server-side-example)
- [Notes](#notes)

## Prerequisites

- Ensure you have installed GalaChain Connect and its dependencies.
- You have a supported Web3 wallet installed and set up in your browser.
- Your application is set up to use a frontend framework like Vue.js or React.
- For server-side examples, ensure you have Node.js installed.

## Client-Side Usage

### Connecting to a Web3 Wallet

First, you need to create a client and connect to a web3 wallet, the below shows a connection:

```typescript
import { BrowserConnectClient } from "@gala-chain/connect";

const web3Wallet = new BrowserConnectClient();

export async function connectToWeb3Wallet() {
    try {
        const connectionResult = await web3Wallet.connect();
        console.log(`User connected with wallet: ${connectionResult}`)

        // Listening to account changes
        web3Wallet.on("accountChanged", (account: string[] | string | null) => {
            if (Array.isArray(account)) {
                //For simplicity of the example,we'll just grab the first connected wallet
                if (account.length > 0) {
                    connectedUser.value = account[0];
                }
            } else {
                console.log(`Account changed: ${account}`);
            }
        });
    } catch (error) {
        message.value = "Failed to connect!";
        console.error(error);
    }
}

export function isConnected() {
    if (Array.isArray(connectedUser.value)) {
        return connectedUser.value.length > 0;
    }
    return connectedUser.value !== null;
}
```

### Creating a Token Class

Once connected to a web3 wallet, you can create a token class using the `TokenApi`:

```typescript
import { TokenApi } from "@gala-chain/connect";

const tokenClient = new TokenApi("https://your-galachain-api-url/asset/token-contract", web3Wallet);

const arbitraryTokenData = {
  tokenClass: {
    additionalKey: "fakeTokenKey",
    category: "fakeCategory",
    collection: "fakeCollection",
    type: "fakeType"
  },
  description: "This is a description",
  image: "foo.png",
  name: "Foo",
  symbol: "FOO",
  maxSupply: "100000"
};

export async function createTokenClass() {
  try {
    const result = await tokenClient.CreateTokenClass(arbitraryTokenData);
    console.log("Token class created:", result);
  } catch (error) {
    console.error("Failed to create token class:", error);
  }
}
```


### Generating Wallets

You can generate new wallets using the `WalletUtils` utility provided by GalaChain Connect.

#### Creating a Random Wallet

```typescript
import { WalletUtils } from "@gala-chain/connect";

// Generate a random wallet
const randomWallet = WalletUtils.createRandom();

console.log("GalaChain Address:", randomWallet.galachainAddress);
console.log("Private Key:", randomWallet.privateKey);
console.log("Public Key:", randomWallet.publicKey);
console.log("Ethereum Address:", randomWallet.ethAddress);
console.log("Mnemonic:", randomWallet.mnemonic?.phrase);
```

The `createRandom()` method returns an object containing:

- `galachainAddress`: The GalaChain address of the wallet.
- `privateKey`: The private key of the wallet.
- `publicKey`: The public key of the wallet.
- `ethAddress`: The Ethereum address of the wallet.
- `mnemonic`: The mnemonic phrase used to generate the wallet (may be `null`).

#### Creating and Registering a Random Wallet

To create a random wallet and register it with a GalaChain service, use `createAndRegisterRandomWallet`:

```typescript
import { WalletUtils } from "@gala-chain/connect";

// Replace with your registration endpoint, or use this to test stage
const registrationEndpoint = "https://stage-galaswap.gala.com/v1/CreateHeadlessWallet";

async function createAndRegisterWallet() {
  try {
    const randomWallet = await WalletUtils.createAndRegisterRandomWallet(registrationEndpoint);

    console.log("Private Key:", randomWallet.privateKey);
  } catch (error) {
    console.error("Failed to create and register wallet:", error);
  }
}

createAndRegisterWallet();
```

The `createAndRegisterRandomWallet()` function returns an object containing:

- `galachainAddress`: The GalaChain address of the wallet.
- `privateKey`: The private key of the wallet.
- `publicKey`: The public key of the wallet.
- `ethAddress`: The Ethereum address of the wallet.
- `mnemonic`: The mnemonic phrase used to generate the wallet (may be `null`).

**Example Usage in an Application:**

```typescript
import { WalletUtils } from "@gala-chain/connect";

export async function generateWallet() {
  try {
    const wallet = await WalletUtils.createAndRegisterRandomWallet(
      "https://stage-galaswap.gala.com/v1/CreateHeadlessWallet"
    );
    console.log(`Wallet generated and registered. Address: ${wallet.ethAddress}`);
    createdUser.value = wallet.ethAddress;

    //This is unsafe, please don't use in production
    console.log("Private Key:", wallet.privateKey);
  } catch (error) {
    console.log("Failed to generate wallet!");
    console.error(error);
  }
}
```

## Server-Side Signing

GalaChain Connect supports server-side signing using a private key. This is useful for backend services that need to interact with GalaChain without user interaction.

### Server-Side Example

```typescript
import { PublicKeyApi, SigningClient } from "@gala-chain/connect";

const privateKey = "your-private-key-here";
const connection = new SigningClient(privateKey);

// The below URI is an example; you can use any URI that supports this
const uri =
  "https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com/api/asset/public-key-contract";

const publicKeyClient = new PublicKeyApi(uri, connection);

async function getProfile() {
  try {
    const profile = await publicKeyClient.GetMyProfile();
    if ("alias" in profile) {
      console.log(`Your alias: ${profile.alias}, ETH address, if any: ${profile.ethAddress}`);
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
}

getProfile();
```

### Server-Side Token Class Creation

You can also create a token class on the server side:

```typescript
import { SigningClient, TokenApi } from "@gala-chain/connect";

const privateKey = "your-private-key-here";
const connection = new SigningClient(privateKey);

const tokenClient = new TokenApi("https://your-galachain-api-url/asset/token-contract", connection);

const arbitraryTokenData = {
  tokenClass: {
    additionalKey: "serverTokenKey",
    category: "serverCategory",
    collection: "serverCollection",
    type: "serverType"
  },
  description: "Server-side token class",
  image: "server.png",
  name: "ServerToken",
  symbol: "STKN",
  maxSupply: "500000"
};

async function createTokenClass() {
  try {
    const result = await tokenClient.CreateTokenClass(arbitraryTokenData);
    console.log("Server-side token class created:", result);
  } catch (error) {
    console.error("Failed to create server-side token class:", error);
  }
}

createTokenClass();
```

## Notes

- **Token Data**: Adjust `arbitraryTokenData` to match the specific token class details you wish to create.
- **Image Field**: The `image` field in `arbitraryTokenData` should point to a valid image URL

---
