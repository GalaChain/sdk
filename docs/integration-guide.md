# GalaChain Integration Guide

## Overview

GalaChain is a Hyperledger Fabric-based blockchain platform with some key characteristics:
- Uses REST APIs instead of RPC endpoints (not EVM-based)
- Fast transaction finality with authoritative nodes
- Supports both fungible and non-fungible tokens via a single Token Contract

## Core Components

### 1. API Endpoints

#### Mainnet Gateway API
- Primary endpoint for token transactions
- Handles assets channel operations
- Documentation: https://gateway-mainnet.galachain.com/docs

#### GalaConnect API
- Provides GalaSwap functionality
- Handles wallet creation
- Documentation: https://connect.gala.com/info/api.html#section/Getting-Started

#### Explorer API
- Near real-time transaction data
- Block streaming via websocket
- Search functionality
- Documentation: https://explorer-api.galachain.com/docs/

### 2. SDK Resources

#### Main SDK Repository
- Open-source development kit
- Focused on chaincode development
- Repository: https://github.com/GalaChain/sdk
- Documentation: https://docs.galachain.com/latest/

#### API Package
- TypeScript classes and interfaces
- DTO (Data Transfer Object) validation and signing
- NPM Package: https://www.npmjs.com/package/@gala-chain/api

## Common Operations

### Token Transfer Example

Here's a complete example of transferring tokens using the SDK:

```typescript
import { TransferTokenDto, TokenInstanceKey, createValidDTO } from '@gala-chain/api'
import { BigNumber } from "bignumber.js";

const GATEWAY_URL = "https://gateway-mainnet.galachain.com/api/asset/token-contract";

async function transferTokens() {
  try {
    // 1. Create token instance key
    const tokenInstanceKey = new TokenInstanceKey();
    tokenInstanceKey.collection = "GALA";
    tokenInstanceKey.category = "Unit";
    tokenInstanceKey.type = "none";
    tokenInstanceKey.additionalKey = "none";
    tokenInstanceKey.instance = new BigNumber(0);

    // 2. Create and validate transfer DTO
    const transferTokenDto = await createValidDTO(TransferTokenDto, {
      from: "eth|abcd",
      to: "eth|dcba",
      tokenInstance: tokenInstanceKey,
      uniqueKey: "someuniquestring",
      quantity: new BigNumber("1")
    });

    // 3. Sign the DTO
    transferTokenDto.sign("privatekey");
    
    // 4. Submit to API
    const response = await fetch(`${GATEWAY_URL}/TransferToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferTokenDto)
    });

    if (!response.ok) {
      throw new Error(`Failed to transfer tokens: ${JSON.stringify(response)}`);
    }

  } catch (err) {
    console.error(`Error transferring tokens: ${err}`, err);
  }
}
```

## Common Use Cases

- Games integrating GalaChain tokens
- Centralized exchanges
- Analytics applications
- Token management systems

## Additional Resources

- [GalaChain Documentation](https://docs.galachain.com)
- [API Documentation](https://gateway-mainnet.galachain.com/docs)
- [SDK GitHub Repository](https://github.com/GalaChain/sdk)