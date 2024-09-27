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
import { ref } from "vue";

const web3Wallet = new BrowserConnectClient();
export const message = ref("");
export const connectedUser = ref<string | null>(null);

export async function connectToWeb3Wallet() {
    try {
        const connectionResult = await web3Wallet.connect();
        message.value = `Connected! User: ${connectionResult}`;
        connectedUser.value = connectionResult;

        // Listening to account changes
        web3Wallet.on("accountChanged", (account: string[] | string | null) => {
            if (Array.isArray(account)) {
                //For simplicity of the example,we'll just grab the first connected wallet
                if (account.length > 0) {
                    connectedUser.value = account[0];
                }
            } else {
                console.log(`Account changed: ${account}`);
                message.value = `Account Changed! User: ${account}`;
                connectedUser.value = account;
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

### Template

In your Vue component, you can add a simple template with a connect button and a button to create a token class:

```html
<template>
    <div>
        <button @click="connectToWeb3Wallet">Connect to Web3 Wallet</button>
        <button @click="createTokenClass" :disabled="!isConnected">Create Token Class</button>
        <p v-if="connectedUser">
            Connected Account(s):
            <span> {{ connectedUser }}</span>
        </p>
    </div>
</template>

<script>
import { connectToWeb3Wallet, createTokenClass, connectedUser, isConnected } from './your-code-from-above';

export default {
    setup() {
        return {
            connectToWeb3Wallet,
            createTokenClass,
            connectedUser,
            isConnected,
        };
    },
};
</script>
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
import { ref } from "vue";

export const message = ref("");
export const createdUser = ref<string | null>(null);

export async function generateWallet() {
  try {
    const wallet = await WalletUtils.createAndRegisterRandomWallet(
      "https://stage-galaswap.gala.com/v1/CreateHeadlessWallet"
    );
    message.value = `Wallet generated and registered. Address: ${wallet.ethAddress}`;
    createdUser.value = wallet.ethAddress;

    //This is unsafe, please don't use in production
    console.log("Private Key:", wallet.privateKey);
  } catch (error) {
    message.value = "Failed to generate wallet!";
    console.error(error);
  }
}
```

### Template Integration

In your Vue component, you can add a button to generate a wallet:

```html
<template>
  <div>
    <button @click="generateWallet">Generate Wallet</button>
  </div>
</template>

<script>
  import { generateWallet } from "./your-code-from-above";

  export default {
    setup() {
      return {
        generateWallet,
      };
    }
  };
</script>
```

### Using an Arbitrary Provider

GalaChain Connect allows you to use any EIP-1193 compliant provider to interact with GalaChain. This is useful when you want to support multiple wallet providers beyond MetaMask, such as WalletConnect, Coinbase Wallet, or any other provider supported by libraries like Web3Modal.

#### Example with Web3Modal

In this example, we'll use Web3Modal to connect to various wallet providers and use the connected provider with GalaChain Connect.

##### Setup

First, install Web3Modal and any required dependencies:

```bash
npm install @web3modal/ethers ethers @web3modal/html
```

##### Code Example

```typescript
import { BrowserConnectClient, TokenApi } from '@gala-chain/connect';
import { createWeb3Modal } from '@web3modal/ethers';
import {type Eip1193Provider } from 'ethers';

// Web3Modal configuration options
const web3Modal = createWeb3Modal({
  projectId: 'YOUR_PROJECT_ID', // Replace with your Web3Modal project ID
  walletConnectVersion: 2,
  wallets: [
    // List of wallets you want to support
  ],
});

async function connectWallet() {
  try {
    const provider = await web3Modal.getProvider();

    if (provider) {
      const browserConnectClient = new BrowserConnectClient(provider as Eip1193Provider);
      const tokenClient = new TokenApi('https://your-galachain-api-url/asset/token-contract', browserConnectClient);

      // Now you can use tokenClient to interact with GalaChain
      // For example, create a token class
      const arbitraryTokenData = {
        tokenClass: {
          additionalKey: 'arbitraryKey',
          category: 'arbitraryCategory',
          collection: 'arbitraryCollection',
          type: 'arbitraryType',
        },
        description: 'An arbitrary token class created using an arbitrary provider',
        image: 'image.png',
        name: 'ArbitraryToken',
        symbol: 'ARB',
        maxSupply: '1000000',
      };

      const result = await tokenClient.CreateTokenClass(arbitraryTokenData);
      console.log('Token class created:', result);
    } else {
      console.error('No provider found');
    }
  } catch (error) {
    console.error('Error connecting to wallet:', error);
  }
}

connectWallet();
```


## Server-Side Signing

GalaChain Connect supports server-side signing using a private key. This is useful for backend services that need to interact with GalaChain without user interaction.

### Server-Side Example

```typescript
import { PublicKeyApi, ServerSigningClient } from "@gala-chain/connect";

const privateKey = "your-private-key-here";
const connection = new ServerSigningClient(privateKey);

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
import { ServerSigningClient, TokenApi } from "@gala-chain/connect";

const privateKey = "your-private-key-here";
const connection = new ServerSigningClient(privateKey);

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
