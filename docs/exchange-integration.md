# GalaChain Exchange Integration FAQ

## General Information

### What is GalaChain?
GalaChain is a **layer 1 blockchain** designed for **Web3 gaming, entertainment, and decentralized applications**. It is built on **Hyperledger Fabric**, providing fast, scalable, and secure blockchain solutions.

### Where can I find official documentation for GalaChain integration?
* **Official Website**: [https://www.galachain.com](https://www.galachain.com)  
* **GalaConnect API Documentation**: [https://connect.gala.com/info/api.html\#section/Getting-Started](https://connect.gala.com/info/api.html#section/Getting-Started)  
* GalaChain Mainnet API Documentation: https://gateway-mainnet.galachain.com/docs/  
* **Block Explorer**: [https://explorer.galachain.com](https://explorer.galachain.com)  
* Block Explorer API Documentation: https://explorer-api.galachain.com/docs/  
* **GitHub Repository**: [https://github.com/GalaChain](https://github.com/GalaChain)

## Node and RPC Support

### Does GalaChain support running a local node?  
No, **GalaChain does not require or support exchanges running their own nodes**. Integration is done via **REST APIs**.

### What is the Chain ID for GalaChain?
GalaChain does not have a traditional **EVM-based Chain ID**. Transactions and operations are handled via **REST APIs**. GalaChain is a Layer 1 Blockchain that is not EVM compatible. 

### How can I access GalaChain’s mainnet nodes?
You can access GalaChain’s **public APIs** via standard HTTP calls using the following endpoints:
* **Mainnet API**: [https://gateway-mainnet.galachain.com/docs](https://gateway-mainnet.galachain.com/docs)  
* **Explorer API**: [https://explorer-api.galachain.com/docs](https://explorer-api.galachain.com/docs)

### **Wallets & Address Formats**

### What wallets support GalaChain?
GalaChain supports MetaMask and other wallets, but uses its own **address format**.

### What are the address formats used in GalaChain?
* **Client|**\-Prefix wallets are created with a Gala Games account on the Gala Platforms.  
* **eth|**\-Prefix wallets are created through all other methods (Web3 Wallet connections on Gala Connect and via the API). Valid eth|-prefix consists of `eth|` prefix and valid check-sumed ETH address, without preceeding `0x`.

### Can I convert a MetaMask address to a GalaChain address?
Yes, you can use **eth|** formatted addresses in MetaMask.

## Token Transactions & API Usage

### How do I transfer tokens on GalaChain?
Use the **TransferToken API** endpoint: [https://connect.gala.com/info/api.html\#tag/API:-GalaChain-Operations/paths/1galachain1api1asset1token-contract\~1TransferToken/post](https://connect.gala.com/info/api.html#tag/API:-GalaChain-Operations/paths/1galachain1api1asset1token-contract~1TransferToken/post)

### Does GalaChain support memos like EOS?
No, **GalaChain transactions do not support memo functions**. Unlike Solidity and EVM based chains which come with a limited set of primitive data types and other restrictions, GalaChain supports an extremely wide range of data structures and is very flexible on storage. For example, the `TokenBalance` chain entry provided in Gala’s SDK has a distinct `owner` property assigned to it. This obviates the need for quote “clever ontransfer functions” (ref: eosauthority.com) that *might* be implemented in smart contracts. Blockchains shouldn’t need “clever workarounds” to simply associate a balance with an identity, and GalaChain does not “support memos” because it doesn’t have a need for them. It supports actually required, properly defined and encoded properties that are necessary for the business use case at hand. 

### How can we monitor deposits and withdrawals? 
Use GalaChain’s **WebSocket service** or **Explorer API**:
* **WebSocket API**: [https://explorer-api.galachain.com](https://explorer-api.galachain.com)  
* **REST API for transactions**: [https://explorer-api.galachain.com/docs](https://explorer-api.galachain.com/docs)

### How do we verify deposits?  
You need to **scan blocks** for **TransferToken transactions** associated with your deposit addresses. A successful `TransferToken` transaction will contain the acting `TokenBalance` chain entries in its Read / Write Set. Every `TokenBalance` chain entry includes an `owner` property in Chain Key position 0 that identifies the wallet address that owns the deposit. You can also use the `FetchBalances` HTTP query (see below) to query for specific balances directly. E.g. [https://explorer.galachain.com/details/asset-channel/8039619?tx=715beb375021f9fb5760b9aa7e33e74c220f01888e572b375919ee938e48f48d](https://explorer.galachain.com/details/asset-channel/8039619?tx=715beb375021f9fb5760b9aa7e33e74c220f01888e572b375919ee938e48f48d) , expand all on the raw block, ctrl-F for `/GCTB/` (the `INDEX_KEY` for the `TokenBalance` class.

### Is there a rate limit on API calls?
Yes, the API is **limited to 20 requests per minute**. Custom rate limits can be discussed.

### How do we retrieve balances?
Use the **FetchBalances API**: [https://gateway-mainnet.galachain.com/api/asset/token-contract/FetchBalances](https://gateway-mainnet.galachain.com/api/asset/token-contract/FetchBalances)

### Does GalaChain provide transaction IDs (txIDs)?
Yes, GalaChain transactions are each assigned a unique transaction ID. Each block can contain many transactions. Each transaction can contain many reads and writes. Because GalaChain is built on Hyperledger Fabric, more technical details can be found in their documentation: [https://hyperledger-fabric.readthedocs.io/en/release-2.4/txflow.html](https://hyperledger-fabric.readthedocs.io/en/release-2.4/txflow.html) , [https://hyperledger-fabric.readthedocs.io/en/release-2.4/readwrite.html](https://hyperledger-fabric.readthedocs.io/en/release-2.4/readwrite.html) 

## Smart Contract & Chaincode Development

### How can we deploy a test contract on GalaChain?
Use the **GalaChain CLI and SDK**:

```
npm i -g @gala-chain/cli
galachain init <project-name>
galachain deploy <docker-image-tag>
```

More info: [https://docs.galachain.com/v2.0.0/](https://docs.galachain.com/v2.0.0/)  

### Does GalaChain support smart contracts like Ethereum?
Yes, GalaChain supports smart contracts that are significantly more flexible and extensible than EVM and Solidity based smart contracts. GalaChain uses **chaincode contracts** written in **TypeScript**, optimized for Hyperledger Fabric. Fees are low, storage capacity is high, and data models are as flexible as a developer can make them using standard TypeScript classes. Feel free to review Hyperledger Fabric’s documentation on Smart Contracts: [https://hyperledger-fabric.readthedocs.io/en/release-2.4/smartcontract/smartcontract.html](https://hyperledger-fabric.readthedocs.io/en/release-2.4/smartcontract/smartcontract.html) while noting that GalaChain’s SDK built on top of Hyperledger Fabric includes significantly improved Developer Experience and additional functionality like atomicity of reads and writes during smart contract execution.   

### What programming languages can be used to write GalaChain smart contracts?
**TypeScript** is the primary language for writing **chaincode**.

### How do we sign transactions on GalaChain?
Transactions use **secp256k1 signatures**, compatible with **Ethereum signing mechanisms**.

### Is there an example of using the GalaChain SDK? 
Yes, there is a growing library of example projects: [https://github.com/GalaChain/examples](https://github.com/GalaChain/examples). For the purposes of this document, here is a brief example of how you can interact with GalaChain using the **@gala-chain/client** library:

```typescript
import { ChainClient } from "@gala-chain/client";

const client = new ChainClient({
    apiUrl: "https://gateway-mainnet.galachain.com/api",
    contractName: "TokenContract"
});

await client.submitTransaction("TransferToken", {
    from: "eth|your-address",
    to: "eth|receiver-address",
    quantity: "1000"
});
```

## Chaincode Deployment

### How is chaincode deployed on GalaChain?
To deploy a **custom chaincode (smart contract) on GalaChain**, follow these steps:

#### Step 1: Build the Chaincode
Ensure that your chaincode is properly written and structured according to GalaChain's **Hyperledger Fabric-based framework**. If you are starting from scratch, you can use the GalaChain SDK to initialize a new project:

```
npm i -g @gala-chain/cli
galachain init my-gc-chaincode
cd my-gc-chaincode
```

#### Step 2: Test the Chaincode Locally
Before deploying, it’s recommended to **test your chaincode** using a local network. Start the network and run tests:

```
npm run network:start   # Starts the GalaChain local test environment
npm run test:e2e        # Runs end-to-end integration tests
```

#### Step 3: Build and Publish the Docker Image
GalaChain chaincode is deployed as a **Docker container**. Build and push your Docker image to a container registry (Docker Hub, AWS ECR, etc.):

```
docker build -t your-repo/your-chaincode:latest .
docker push your-repo/your-chaincode:latest
```

Ensure that your **Docker image is publicly accessible** so GalaChain nodes can fetch it.

#### Step 4: Register the Chaincode for Deployment
Before deployment, you must register your **secp256k1 public key** with GalaChain support. If you don’t have a key, generate one:

```
galachain keygen gc-admin-key
galachain keygen gc-dev-key
```

Send the generated **gc-admin-key.pub** and **gc-dev-key.pub** to **GalaChain support** to obtain deployment permissions.

#### Step 5: Deploy the Chaincode Using GalaChain CLI
Once your chaincode is registered, deploy it using:

```
galachain deploy your-repo/your-chaincode:latest
```

If successful, your chaincode will be **available on GalaChain’s mainnet or testnet**.

#### Step 6: Verify the Deployment

Check the status of your deployed chaincode with:

```
galachain info
```

Look for **CC\_DEPLOYED** in the output, which indicates that the chaincode is live and ready to use. You can now interact with it via **GalaChain’s REST API**.

### What is the process for updating chaincode?
Updating chaincode follows a similar process as deployment but requires version control to ensure **backward compatibility**:

#### Step 1: Modify the Chaincode
* Make the necessary updates to your chaincode files in the **src/** directory.  
* Ensure all changes are compatible with existing contracts.

#### Step 2: Run Local Tests
Always test your updates **before redeployment**:
```
npm run network:start
npm run test:e2e
```

#### Step 3: Build and Publish a New Docker Image
Each new deployment **must have a unique version tag**:
```
docker build -t your-repo/your-chaincode:v1.1.0 .
docker push your-repo/your-chaincode:v1.1.0
```

#### Step 4: Deploy the Updated Chaincode
Use the GalaChain CLI to deploy the **new version**:

```
galachain deploy your-repo/your-chaincode:v1.1.0
```

If you experience issues, verify the deployment using:

```
galachain info
```

## Bridging & Cross-Chain Transfers

### Does GalaChain support cross-chain transfers?
Yes, GalaChain has **bridging mechanisms** for ERC-20 tokens & Solana & TON.

* Bridges can be configured true/false whether they are **Burning Bridges or Locking**

## Security & Compliance

### How does GalaChain prevent double-spending?
GalaChain uses **Hyperledger Fabric’s transaction validation** to prevent **double-spending**. It is impossible for two transactions to write or read a written chain entry within the same block execution, because this would cause an \`MVCC\_READ\_CONFLICT\`. More technical detail can be found in Hyperledger Fabric’s documentation on Valid Transactions ([https://hyperledger-fabric.readthedocs.io/en/release-2.4/smartcontract/smartcontract.html\#valid-transactions](https://hyperledger-fabric.readthedocs.io/en/release-2.4/smartcontract/smartcontract.html#valid-transactions)).

Additionally, the transaction DTO may contain a `uniqueKey` property which is validated on the chaincode side to prevent accidentally sending the same transaction multiple times.

### Is GalaChain audited?
Yes, GalaChain’s smart contracts and core infrastructure undergo **security audits from CertiK**.

**See Also**:  [https://lf-hyperledger.atlassian.net/wiki/spaces/fabric/pages/22840960/Audits](https://lf-hyperledger.atlassian.net/wiki/spaces/fabric/pages/22840960/Audits)

### Does GalaChain have a built-in fraud detection mechanism?**  
Yes, GalaChain’s **state validation and transaction consensus** prevent fraudulent transactions.

## Exchange-Specific Considerations
How can exchanges list GalaChain assets?

* **Integrate with the API**: Use **GalaChain’s REST API** to support deposits/withdrawals.  
* **Verify addresses**: Ensure compatibility with **eth| and client| formats**.  
* **Set up monitoring**: Use **WebSockets or API polling** for transaction tracking.  

## Can GalaChain transactions be reversed?
No, **GalaChain transactions are final** and **cannot be reversed**.

## Does GalaChain have minimum deposit amounts?
The minimum deposit amount is **determined by the exchange**.

## What happens if a transaction is sent to the wrong address?
**GalaChain transactions are irreversible**. Users should double-check addresses before sending.

## Does GalaChain support institutional wallets?
Yes, institutional wallets can integrate via **API authentication and multisig solutions**.