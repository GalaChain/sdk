# GalaChain Connect Examples

This document provides examples of how to use GalaChain Connect in your application, covering both client-side and server-side interactions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Client-Side Usage](#client-side-usage)
  - [Connecting to a Web3 Wallet](connecting-to-a-web3-wallet)
  - [Creating a Token Class](#creating-a-token-class)
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

First, you need to create a client and connect to a web3 wallet, the below shows Metamask:

```typescript
import { ref } from 'vue';
import { MetamaskConnectClient } from '@gala-chain/connect';

const metamaskClient = new MetamaskConnectClient();
export const message = ref('');
export const connectedUser = ref<string | null>(null);

export async function connectToMetaMask() {
    try {
        const connectionResult = await metamaskClient.connect();
        message.value = `Connected! User: ${connectionResult}`;
        connectedUser.value = connectionResult;

        // Listening to account changes
        metamaskClient.on('accountChanged', (account: string | null) => {
            console.log(`Account changed: ${account}`);
            message.value = `Account Changed! User: ${account}`;
            connectedUser.value = account;
        });
    } catch (error) {
        message.value = 'Failed to connect!';
        console.error(error);
    }
}

export function isConnected() {
    return connectedUser.value !== null;
}
```

### Creating a Token Class

Once connected to a web3 wallet, you can create a token class using the `TokenApi`:

```typescript
import { TokenApi } from '@gala-chain/connect';

const tokenClient = new TokenApi('https://your-galachain-api-url/asset/token-contract', metamaskClient);

const arbitraryTokenData = {
    tokenClass: {
        additionalKey: 'fakeTokenKey',
        category: 'fakeCategory',
        collection: 'fakeCollection',
        type: 'fakeType',
    },
    description: 'This is a description',
    image: 'foo.png',
    name: 'Foo',
    symbol: 'FOO',
    maxSupply: '100000',
};

export async function createTokenClass() {
    try {
        const result = await tokenClient.CreateTokenClass(arbitraryTokenData);
        console.log('Token class created:', result);
        message.value = 'Token class created successfully!';
    } catch (error) {
        console.error('Failed to create token class:', error);
        message.value = 'Failed to create token class!';
    }
}
```

### Template

In your Vue component, you can add a simple template with a connect button and a button to create a token class:

```html
<template>
    <div>
        <button @click="connectToMetaMask">Connect to MetaMask</button>
        <button @click="createTokenClass" :disabled="!isConnected">Create Token Class</button>
        <p>{{ message }}</p>
    </div>
</template>

<script>
import { connectToMetaMask, createTokenClass, message, isConnected } from './path-to-your-script';

export default {
    setup() {
        return {
            connectToMetaMask,
            createTokenClass,
            message,
            isConnected,
        };
    },
};
</script>
```

## Server-Side Signing

GalaChain Connect supports server-side signing using a private key. This is useful for backend services that need to interact with GalaChain without user interaction.

### Server-Side Example

```typescript
import { ServerSigningClient, PublicKeyApi } from '@gala-chain/connect';

const privateKey = 'your-private-key-here';
const connection = new ServerSigningClient(privateKey);

// The below URI is an example; you can use any URI that supports this
const uri = 'https://your-galachain-api-url/asset/PublicKeyContract';

const publicKeyClient = new PublicKeyApi(uri, connection);

async function getProfile() {
    try {
        const profile = await publicKeyClient.GetMyProfile();
        if ('alias' in profile) {
            console.log(`Your alias: ${profile.alias}, ETH address, if any: ${profile.ethAddress}`);
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

getProfile();
```

### Server-Side Token Class Creation

You can also create a token class on the server side:

```typescript
import { ServerSigningClient, TokenApi } from '@gala-chain/connect';

const privateKey = 'your-private-key-here';
const connection = new ServerSigningClient(privateKey);

const tokenClient = new TokenApi('https://your-galachain-api-url/asset/token-contract', connection);

const arbitraryTokenData = {
    tokenClass: {
        additionalKey: 'serverTokenKey',
        category: 'serverCategory',
        collection: 'serverCollection',
        type: 'serverType',
    },
    description: 'Server-side token class',
    image: 'server.png',
    name: 'ServerToken',
    symbol: 'STKN',
    maxSupply: '500000',
};

async function createTokenClass() {
    try {
        const result = await tokenClient.CreateTokenClass(arbitraryTokenData);
        console.log('Server-side token class created:', result);
    } catch (error) {
        console.error('Failed to create server-side token class:', error);
    }
}

createTokenClass();
```

## Notes

- **Private Keys**: Never commit or share your private keys. The private keys used in these examples are placeholders. Use environment variables or secure key management systems to handle private keys in production.
- **API Endpoints**: Replace `'https://your-galachain-api-url/asset/token-contract'` and other URLs with the actual GalaChain API endpoints.
- **Token Data**: Adjust `arbitraryTokenData` to match the specific token class details you wish to create.
- **Image Field**: The `image` field in `arbitraryTokenData` should point to a valid image URL

---