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
- **Fault Tolerance**: Network continues operating with up to 1/3 of nodes offline in Raft and 2/3 in BFT
- **Performance**: Optimized for high-throughput applications

### Block Structure

Each block contains:
- **Block Header**: Block number, previous hash, data hash
- **Block Data**: Ordered list of transactions
- **Block Metadata**: Signatures, validation info

## Core Mechanisms

### 1. Decimal Precision

GalaChain supports configurable decimal precision for token operations. The number of decimals is set per token class:

- **Fungible tokens (e.g., GALA):** Typically use 8 decimal places.
- **NFTs (non-fungible tokens):** Use 0 decimals (no fractional ownership).
- **Other tokens:** Can be configured as needed.

**Key Points**:
- Default precision: 8 decimal places
- Configurable per token class
- Uses BigNumber.js for accurate calculations
- Prevents floating-point precision errors

### 2. Rollback and Recovery

GalaChain implements robust rollback mechanisms:

#### Transaction Rollback
When a transaction fails partway through execution, GalaChain automatically reverses all the state changes that occurred during that transaction. This ensures the blockchain remains in a consistent state even when operations encounter errors.

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
Once a transaction is included in a committed block, it becomes final and immutable. The state changes from that transaction are immediately visible to all subsequent transactions, ensuring a consistent and predictable execution environment.

### 4. Expiration Time

GalaChain implements optional expiration for DTOs to prevent replay attacks and ensure time-sensitive operations:

#### DTO Expiration
Data transfer objects can include an optional expiration timestamp to prevent replay attacks and ensure time-sensitive operations complete within a specific timeframe.

#### Automatic Expiration Check
The GalaChain platform automatically validates expiration times during transaction processing:

1. **Parsing Phase**: Transaction data is parsed and validated
2. **Expiration Check**: If an expiration time is specified, the system compares it with the current blockchain timestamp
3. **Rejection**: If the transaction has expired, it is rejected before execution

This expiration check happens automatically as part of the standard transaction flow.

#### Best Practices
- **Set reasonable expiration times**: 5-15 minutes for most operations
- **Use for sensitive operations**: Transfers, approvals, and administrative actions
- **Client-side responsibility**: Clients should set appropriate expiration times
- **Automatic enforcement**: The blockchain automatically rejects expired DTOs

### 6. Gas Mechanism

GalaChain uses a fee-based system instead of traditional gas to compensate network participants and manage resource usage.

#### Fee Collection
- **Automatic Deduction**: Fees are automatically deducted from user accounts
- **Fee Distribution**: Fees are distributed to network participants
- **Dynamic Pricing**: Fees can be adjusted based on network load

### 7. Replay Protection

GalaChain implements comprehensive replay protection through multiple layers of security to prevent unauthorized transaction repetition:

#### Signature-Based Protection
Every write transaction must be signed by the caller's private key, which provides the primary layer of replay protection by cryptographically verifying the transaction originator.

#### Unique Key Enforcement
For write transactions, data transfer objects must include a unique key to prevent double spending and replay attacks. This ensures that each transaction can only be executed once.

#### Multi-Layer Protection Strategy
GalaChain employs multiple layers of replay protection:

1. **Cryptographic Signatures**: Every write operation requires a valid signature from the caller's private key
2. **Unique Key Enforcement**: Write transactions must have unique keys to prevent double submission
3. **Optional Expiration**: Transactions can include expiration times for time-sensitive operations
4. **Blockchain Finality**: Once committed, transactions cannot be replayed due to blockchain immutability

#### Automatic Protection Flow
The protection mechanisms work together automatically in this order:
1. **Authentication**: Transaction signature is verified
2. **Expiration**: Expiration time is checked if specified
3. **Unique Key**: Prevents double execution of the same transaction
4. **Business Logic**: The actual operation is executed

#### Best Practices
- **Always use unique keys for write operations**: Include timestamps, operation IDs, or other unique identifiers
- **Sign all write transactions**: Use the provided SDK methods for automatic signing
- **Set expiration for sensitive operations**: Use `dtoExpiresAt` for transfers and administrative actions
- **Generate unique keys client-side**: Ensure keys are truly unique across all potential users

## Node deployment

Currently, deploying with ChainLaunch is the fastest way to get a node up and running.

### Getting Started

ChainLaunch is a tool that allows you to deploy a node in a few steps. First, you'll need to install and start the ChainLaunch server.

#### Installation

ChainLaunch is available for multiple operating systems including macOS and Linux. Download the appropriate version for your platform from the official releases page.

#### Starting the Server

Set up basic configuration and start the ChainLaunch server with your chosen credentials and port settings.

#### Accessing the Web Interface

After starting the server, access the web interface through your browser using the configured port and login credentials.

### Step-by-Step Node Deployment

Once ChainLaunch is running, follow these steps to deploy and configure your GalaChain node:

#### 1. Add an Organization

Navigate to the **Organizations** section in the ChainLaunch web interface to create a new organization with your MSP details.

- For detailed instructions, see the official documentation:
  [How to create an organization](https://docs.chainlaunch.dev/fabric/create-org)

#### 2. Deploy a Node

After creating your organization, you can deploy nodes using the plugin deployment system.

- For step-by-step guidance, refer to:
  [How to create nodes](https://docs.chainlaunch.dev/fabric/create-nodes-fabric)

#### 3. Provide information to the GalaChain team

After creating your organization, you need to provide the following information to the GalaChain team:

- **MSP ID**: The MSP ID for your organization
- **MSP Sign CA Certificate**: The MSP TLS CA certificate for your organization
- **MSP TLS CA Certificate**: The MSP TLS CA certificate for your organization

#### 4. Join the GalaChain Network

Once your node is deployed and your organization has been added to the network, you need to join the GalaChain network:

**Contact the GalaChain team** with the following information to obtain network access credentials:

**Required Information to Provide:**
- **Orderer URL**: The endpoint URL for the GalaChain network orderer
- **Channel Name**: The specific channel name you wish to join on the GalaChain network

**Important**: Network access requires approval from the GalaChain team. Contact them through the official channels to begin the onboarding process with the orderer URL and channel name.

#### 5. Deploy the ChainLaunch Plugin

After successfully joining the network, deploy the ChainLaunch plugin to enable REST API communication with your GalaChain network.


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

### Contact Information

For assistance with joining the GalaChain network or technical support:

- **Email**: Contact the GalaChain team through official channels for network access requests
- **Documentation**: [GalaChain Documentation](https://docs.galachain.com)
- **Community Forum**: [Community Forum](https://community.galachain.com)
- **GitHub Issues**: [GitHub Issues](https://github.com/galachain/galachain-sdk/issues)

### Additional Resources

For additional information, refer to:
- [Chaincode Development](chaincode-development.md)
- [Chaincode Deployment](chaincode-deployment.md)
- [Authorization](authorization.md)
- [Troubleshooting](troubleshooting.md)
