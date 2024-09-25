# GalaChain Connect

GalaChain Connect is a library that provides developers with capabilities comparable to [ethers.js](https://docs.ethers.io/), allowing users to connect to and interact with GalaChain using wallets such as MetaMask.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Building](#building)
- [Running Unit Tests](#running-unit-tests)
- [Examples](#examples)
- [Local Library Testing](#local-library-testing)

## Features

- **Client-Side Signing and Calls**: Enables applications to interact with GalaChain using client-side signing via web3 wallets like MetaMask and Trust Wallet.
- **Server-Side Signing and Calls**: Supports server-side interactions with GalaChain using private keys for automated processes or backend services.
- **Unified API Interface**: Provides a consistent API for both client-side and server-side interactions with GalaChain.

## Installation

To install Gala Connect, run:

```bash
npm install @gala-chain/connect
```

## Building

Run the following command to build the library:

```bash
nx build chain-connect
```

## Running Unit Tests

To execute the unit tests via [Jest](https://jestjs.io), run:

```bash
nx test chain-connect
```

## Examples

The [Examples Documentation](docs/Examples.md) provides detailed examples on how to use GalaChain Connect, including:

- Connecting to a Web3 wallet and interacting with GalaChain on the client side.
- Performing server-side signing and interactions using a private key.

## Local Library Testing

To test the library locally in another project:

1. Build the library:

    ```bash
    nx build chain-connect
    ```

2. Link the library:

    ```bash
    npm link
    ```

3. In your project where you want to test the library, link it:

    ```bash
    npm link @gala-chain/connect
    ```