# Node Deployment Guide

This guide provides comprehensive information about deploying and operating GalaChain nodes, including essential chain-level mechanisms and configuration details.

## Overview

GalaChain nodes are the backbone of the network, responsible for maintaining consensus, processing transactions, and ensuring network security. This guide covers the technical specifications and operational considerations for running a GalaChain node.

## Prerequisites

Before deploying a GalaChain node, ensure you have:

- **Hardware Requirements**:
  - CPU: 4+ cores (Intel/AMD x86_64)
  - RAM: 16GB+ (32GB recommended)
  - Storage: 500GB+ SSD (1TB+ recommended)
  - Network: 100Mbps+ stable connection

- **Software Requirements**:
  - Operating System: Linux (Ubuntu 20.04+ recommended)
  - Docker: 20.10+ with Docker Compose
  - Node.js: 18+ (for CLI tools)
  - Git: Latest version

## Chain-Level Basic Information

### Network Architecture

GalaChain is built on Hyperledger Fabric and operates with the following network topology:

- **Ordering Service**: Manages transaction ordering and block creation
- **Peer Nodes**: Execute chaincode and maintain the ledger
- **Certificate Authority (CA)**: Manages identity certificates
- **Channel**: Private subnetworks for specific use cases

### Consensus Mechanism

GalaChain can use **Raft consensus** and **BFT consensus** for ordering service, which provides:

- **Finality**: Blocks are final once committed
- **Fault Tolerance**: Network continues operating with up to 1/3 of nodes offline
- **Performance**: Optimized for high-throughput gaming applications

### Block Structure

Each block contains:
- **Block Header**: Block number, previous hash, data hash
- **Block Data**: Ordered list of transactions
- **Block Metadata**: Signatures, validation info

## Core Mechanisms

### 1. Decimal Precision

GalaChain supports configurable decimal precision for token operations:

```typescript
// Token class with 18 decimal places (standard for ERC-20 compatibility)
export class TokenClass {
  decimals: number = 8;
  symbol: string;
  name: string;
}

// Balance calculations use BigNumber for precision
import { BigNumber } from "bignumber.js";

const balance = new BigNumber("1000000000000000000"); // 1 token with 18 decimals
const humanReadable = balance.dividedBy(10 ** 8); // 1.0
```

**Key Points**:
- Default precision: 18 decimal places
- Configurable per token class
- Uses BigNumber.js for accurate calculations
- Prevents floating-point precision errors

### 2. Rollback and Recovery

GalaChain implements robust rollback mechanisms:

#### Transaction Rollback
```typescript
@Submit({
  in: TransferDto
})
public async Transfer(ctx: GalaChainContext, dto: TransferDto): Promise<void> {
  try {
    // Perform transfer operations
    await this.debitAccount(ctx, dto.from, dto.amount);
    await this.creditAccount(ctx, dto.to, dto.amount);
    
    // If any operation fails, the entire transaction rolls back
  } catch (error) {
    // Transaction automatically rolls back on error
    throw new TransferError(`Transfer failed: ${error.message}`);
  }
}
```

#### State Rollback
- **Automatic Rollback**: Failed transactions automatically revert all state changes
- **Recovery**: Failed nodes can recover from checkpoint and replay transactions

### 3. Finalization

GalaChain provides strong finality guarantees:

#### Block Finality
- **Immediate Finality**: Blocks are final once committed to the ledger
- **No Forking**: Unlike proof-of-work chains, GalaChain doesn't fork
- **Deterministic State**: All nodes reach the same state after processing blocks

#### Transaction Finality
```typescript
// Transaction is final once included in a committed block
@Submit({
  in: MintTokenDto
})
public async MintToken(ctx: GalaChainContext, dto: MintTokenDto): Promise<TokenInstanceKey[]> {
  // Transaction is final when this method completes successfully
  const tokens = await mintTokens(ctx, dto);
  
  // State changes are immediately visible to subsequent transactions
  return tokens;
}
```

### 4. Expiration Time

GalaChain implements configurable expiration mechanisms:

#### Transaction Expiration
```typescript
// DTO with expiration time
export class ExpiringOperationDto extends ChainCallDTO {
  @IsString()
  operationId: string;
  
  @IsNumber()
  expiresAt: number; // Unix timestamp in milliseconds
}

// Contract method that checks expiration
@Submit({
  in: ExpiringOperationDto
})
public async ExecuteOperation(ctx: GalaChainContext, dto: ExpiringOperationDto): Promise<void> {
  const txTimestamp = ctx.stub.getTxTimestamp();
  const currentTime = txTimestamp.seconds.toNumber() * 1000; // Convert to milliseconds
  if (currentTime > dto.expiresAt) {
    throw new ExpirationError("Operation has expired");
  }
  
  // Execute operation
  await performOperation(ctx, dto);
}
```

#### Token Expiration
```typescript
// Token with expiration
export class ExpiringToken {
  @IsString()
  tokenId: string;
  
  @IsNumber()
  expiresAt: number; // Unix timestamp in milliseconds
  
  isExpired(currentTime: number): boolean {
    return currentTime > this.expiresAt;
  }
}
```

### 5. Gas Mechanism

GalaChain uses a fee-based system instead of traditional gas:

#### Fee Structure
```typescript
// Fee configuration
export class FeeConfig {
  @IsNumber()
  baseFee: number; // Base fee per transaction
  
  @IsNumber()
  dataFee: number; // Fee per KB of data
  
  @IsNumber()
  computeFee: number; // Fee for compute-intensive operations
}

// Fee calculation
export function calculateFee(operation: Operation, config: FeeConfig): number {
  let fee = config.baseFee;
  
  // Add data fee
  const dataSize = JSON.stringify(operation).length / 1024; // KB
  fee += dataSize * config.dataFee;
  
  // Add compute fee for complex operations
  if (operation.isComputeIntensive) {
    fee += config.computeFee;
  }
  
  return fee;
}
```

#### Fee Collection
- **Automatic Deduction**: Fees are automatically deducted from user accounts
- **Fee Distribution**: Fees are distributed to network participants
- **Dynamic Pricing**: Fees can be adjusted based on network load

### 6. Replay Protection

GalaChain implements multiple layers of replay protection:

#### Nonce-based Protection
```typescript
import { ChainObject, ChainKey, getObjectByKey, putChainObject, ChainCallDTO } from "@gala-chain/chaincode";
import { IsString, IsNumber } from "class-validator";

// DTO with nonce for replay protection
export class ReplayProtectedDto extends ChainCallDTO {
  @IsString()
  operationId: string;
  
  @IsNumber()
  nonce: number; // Unique sequence number
  
  @IsString()
  signature: string; // Digital signature
}

// Nonce record for storing used nonces
export class NonceRecord extends ChainObject {
  static INDEX_KEY = "GCNONC";
  
  @ChainKey({ position: 0 })
  @IsString()
  public readonly operationId: string;
  
  @ChainKey({ position: 1 })
  @IsNumber()
  public readonly nonce: number;
  
  constructor(operationId: string, nonce: number) {
    super();
    this.operationId = operationId;
    this.nonce = nonce;
  }
}

// Helper function to get the last used nonce
async function getLastNonce(ctx: GalaChainContext, operationId: string): Promise<number> {
  try {
    const nonceKey = NonceRecord.getCompositeKeyFromParts(NonceRecord.INDEX_KEY, [operationId]);
    const lastNonceRecord = await getObjectByKey(ctx, NonceRecord, nonceKey);
    return lastNonceRecord.nonce;
  } catch (error) {
    // If no nonce record exists, return 0
    return 0;
  }
}

// Contract method that validates nonce
@Submit({
  in: ReplayProtectedDto
})
public async ExecuteOperation(ctx: GalaChainContext, dto: ReplayProtectedDto): Promise<void> {
  // Check if nonce has been used
  const lastNonce = await getLastNonce(ctx, dto.operationId);
  if (dto.nonce <= lastNonce) {
    throw new ReplayError("Nonce already used");
  }
  
  // Store the new nonce to prevent replay
  const nonceRecord = new NonceRecord(dto.operationId, dto.nonce);
  await putChainObject(ctx, nonceRecord);
  
  // Execute operation
  await performOperation(ctx, dto);
}
```

#### Timestamp-based Protection
```typescript
// DTO with timestamp for replay protection
export class TimestampProtectedDto extends ChainCallDTO {
  @IsString()
  operationId: string;
  
  @IsNumber()
  timestamp: number; // Unix timestamp in milliseconds
  
  @IsString()
  signature: string;
}

// Contract method that validates timestamp
@Submit({
  in: TimestampProtectedDto
})
public async ExecuteOperation(ctx: GalaChainContext, dto: TimestampProtectedDto): Promise<void> {
  const txTimestamp = ctx.stub.getTxTimestamp();
  const currentTime = txTimestamp.seconds.toNumber() * 1000; // Convert to milliseconds
  const timeDiff = Math.abs(currentTime - dto.timestamp);
  
  // Reject if timestamp is too old (e.g., 5 minutes)
  if (timeDiff > 5 * 60 * 1000) {
    throw new ReplayError("Timestamp too old");
  }
  
  // Execute operation
  await performOperation(ctx, dto);
}
```

## Node deployment

Currently, deploying with ChainLaunch is the fastest way to get a node up and running.

### Getting Started

ChainLaunch is a tool that allows you to deploy a node in a few steps. First, you'll need to install and start the ChainLaunch server.

#### Installation

**For macOS (Apple Silicon)**
```bash
export CHAINLAUNCH_VERSION=v0.0.2
export CHAINLAUNCH_URL="https://github.com/LF-Decentralized-Trust-labs/chainlaunch/releases/download/${CHAINLAUNCH_VERSION}/chainlaunch-darwin-arm64"
curl -L -O ${CHAINLAUNCH_URL}
chmod +x chainlaunch-darwin-arm64
sudo mv chainlaunch-darwin-arm64 /usr/local/bin/chainlaunch
```

**For Linux**
```bash
export CHAINLAUNCH_VERSION=v0.0.2
export CHAINLAUNCH_URL="https://github.com/LF-Decentralized-Trust-labs/chainlaunch/releases/download/${CHAINLAUNCH_VERSION}/chainlaunch-linux-amd64"
curl -L -O ${CHAINLAUNCH_URL}
chmod +x chainlaunch-linux-amd64
sudo mv chainlaunch-linux-amd64 /usr/local/bin/chainlaunch
```

#### Starting the Server

Set up basic configuration and start the ChainLaunch server:

```bash
# Set required environment variables
export CHAINLAUNCH_USER=admin
export CHAINLAUNCH_PASSWORD=mysecretpassword

# Start the server
chainlaunch serve --port=8100 --db=./chainlaunch.db
```

#### Accessing the Web Interface

After starting the server, access the web interface at:
```
http://localhost:8100
```

Login with the default credentials: `admin/mysecretpassword`

### Adding Organizations and Nodes

Once ChainLaunch is running, you can add organizations and deploy nodes through the web interface:

#### 1. Add an Organization

Navigate to the **Organizations** section in the ChainLaunch web interface to create a new organization with your MSP details.

- For detailed instructions, see the official documentation:  
  [How to create an organization](https://docs.chainlaunch.dev/fabric/create-org)

#### 2. Deploy a Node

After creating your organization, you can deploy nodes using the plugin deployment system.

- For step-by-step guidance, refer to:  
  [How to create nodes](https://docs.chainlaunch.dev/fabric/create-nodes-fabric)



### ChainLaunch Plugin Deployment

The following plugin configuration allows you to deploy a Hyperledger Fabric API plugin that provides a REST API interface to interact with your GalaChain network:

```yaml
apiVersion: dev.chainlaunch/v1
kind: Plugin
metadata:
    name: operation-api-next
    version: '1.0'
    description: "Hyperledger Fabric API plugin that provides a REST API interface to interact with Fabric networks"
    author: "GalaChain"
    tags:
        - fabric
        - api
        - rest
        - chaincode

spec:
    dockerCompose:
        contents: |
            version: '2.2'
            services:
              app:
                image: ghcr.io/galachain/operation-api-next:0.0.1
                environment:
                  - HLF_MSP_ID={{ .parameters.key.MspID }}
                  - HLF_PEERS=[{{- range $i, $peer := .parameters.peers }}{{if $i}},{{end}}{"url":"grpcs://{{$peer.ExternalEndpoint}}","tlsCaCert":"{{$peer.TLSCertPath}}","verifyOptions":{"rejectUnauthorized":false}}{{- end }}]
                  - HLF_KEY_PEM={{ .parameters.key.KeyPath }}
                  - HLF_CERT_PEM={{ .parameters.key.CertPath }}
                  - API_CONFIG_PATH={{ .parameters.apiConfig.Path }}
                ports:
                  - "{{ .parameters.port }}:3000"
                volumes:
                  {{- range .volumeMounts }}
                  - {{ .Source }}:{{ .Target }}:{{ if .ReadOnly }}ro{{ else }}rw{{ end }}
                  {{- end }}

    parameters:
        $schema: http://json-schema.org/draft-07/schema#
        type: object
        properties:
            port:
                type: integer
                title: Port
                description: The port to listen on

            peers:
                type: array
                title: Peers
                description: Array of peer configurations with URL and TLS CA certificate
                x-source: fabric-peer
            key:
                type: object
                title: Key PEM
                description: Path to the private key PEM file
                x-source: fabric-key
            apiConfig:
                type: string
                title: API Config Path
                description: Path to the API configuration JSON file
                x-source: file
        required: ["port", "peers", "key", "apiConfig"]

    documentation:
        readme: |
            # Hyperledger Fabric API Plugin

            This plugin provides a REST API interface to interact with Hyperledger Fabric networks, allowing you to query and invoke chaincode operations through HTTP endpoints. It is implemented using the [Nest](https://github.com/nestjs/nest) framework.

            ## Features
            - REST API interface for Fabric operations
            - Support for multiple peers with TLS
            - Chaincode query and invoke operations
            - Channel management
            - Configuration via JSON file

            ## Prerequisites
            - A running Hyperledger Fabric network
            - Valid MSP certificates and keys
            - Access to peer nodes
            - Chaincode installed and instantiated

            ### Adding new contracts

            Refer to `sample-api-config.json` for an example. The properties defined in the contract definition JSON object are used to dynamically construct the routes.

            Example configuration:
            ```json
            {
              "channels": [
                {
                  "pathFragment": "asset",
                  "channelName": "asset-channel",
                  "asLocalHost": true,
                  "connectionProfilePath": "<optional - channel specific cpp path>",
                  "contracts": [
                    {
                      "pathFragment": "public-key-contract",
                      "chaincodeName": "basic-asset",
                      "contractName": "PublicKeyContract"
                    }
                  ]
                }
              ]
            }
            ```

            ## Logging

            Set the `LOG_LEVEL` environment variable to one of: debug|verbose|info|warn|error. The format of the logs can be either a JSON string or a more human friendly output by setting the `NODE_ENV` value.

            ## Datadog Tracing

            Enable tracing by setting:
            ```sh
            ENABLE_TRACING=true
            ```

        examples: []
        troubleshooting:
            - problem: "API cannot connect to peers"
              solution: |
                ### Quick Fix
                1. Verify peer connectivity:
                   ```bash
                   docker-compose exec app ping peer0.curator.local
                   ```
                2. Check TLS certificates:
                   ```bash
                   ls -la ./tlsca-peer.pem
                   ```
                3. Validate peer endpoints:
                   ```bash
                   echo $HLF_PEERS
                   ```

                ### Common Issues
                - Invalid TLS certificates
                - Network connectivity problems
                - Incorrect peer endpoints
                - Firewall blocking access

                ### Resolution Steps
                1. **TLS Certificate Issues**
                   - Verify certificate paths
                   - Check certificate validity
                   - Ensure proper permissions

                2. **Network Issues**
                   - Check DNS resolution
                   - Verify network policies
                   - Test peer connectivity

                3. **Configuration Issues**
                   - Validate environment variables
                   - Check MSP configuration
                   - Verify API config file
              description: "This issue occurs when the API cannot establish connections to the Fabric peer nodes."

            - problem: "API server not starting"
              solution: |
                ### Quick Fix
                1. Check container logs:
                   ```bash
                   docker-compose logs app
                   ```
                2. Verify environment variables:
                   ```bash
                   docker-compose exec app env | grep HLF_
                   ```
                3. Check configuration:
                   ```bash
                   docker-compose config
                   ```

                ### Common Issues
                - Missing environment variables
                - Invalid configuration
                - Missing dependencies
                - Permission issues

                ### Resolution Steps
                1. **Environment Issues**
                   - Verify all required variables are set
                   - Check variable values
                   - Ensure proper file paths

                2. **Configuration Issues**
                   - Validate API config file
                   - Check environment variables
                   - Review volume mounts

                3. **Dependency Issues**
                   - Verify image availability
                   - Check network connectivity
                   - Validate volume permissions
              description: "This issue occurs when the API server fails to start properly." 
```


The ApiConfig configuration when deploying the plugin:

```json
{
  "channels": [
    {
      "pathFragment": "asset",
      "channelName": "asset-channel",
      "asLocalHost": true,
      "contracts": [
        {
          "pathFragment": "public-key-contract",
          "chaincodeName": "basic-asset",
          "contractName": "PublicKeyContract"
        },
        {
          "pathFragment": "token-contract",
          "chaincodeName": "basic-asset",
          "contractName": "GalaChainToken"
        }
      ]
    }
  ]
}
```

The rest of the parameters are:

- port: The port to listen on
- peers: The peers to connect to
- key: The key to use for the node
- apiConfig: The path to the API configuration file



### Support Resources

- [GalaChain Documentation](https://docs.galachain.com)
- [Community Forum](https://community.galachain.com)
- [GitHub Issues](https://github.com/galachain/galachain-sdk/issues)

For additional information, refer to:
- [Chaincode Development](chaincode-development.md)
- [Chaincode Deployment](chaincode-deployment.md)
- [Authorization](authorization.md)
- [Troubleshooting](troubleshooting.md)
