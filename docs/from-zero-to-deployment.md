# From zero to deployment with GalaChain SDK

GalaChain SDK allows you to develop and deploy GalaChain chaincodes (contracts) in TypeScript.
This tutorial will guide you through the process of creating a new GalaChain chaincode, connecting it with GalaChain network, deploying, and calling it.


## 1. Install the GalaChain CLI

GalaChain SDK provides a CLI to manage your chaincode. You can install it with:

```
npm i -g @gala-chain/cli
```

To verify it works you can use:

```
galachain --help
```

GalaChain CLI requires Node.js v18+.
For running a local test network you also need Docker with Docker Compose, and  `jq`.
If you work on Windows, you either need to have WSL, or you can use our [Dev Containers](https://galahackathon.com/v1.1.0/getting-started/#using-dev-containers-linux-or-macos).


## 2. Initialize the project from template

GalaChain CLI can create a fully functional sample GalaChain chaincode with some features, tests, local env. setup and many others.
Just type:

```
galachain init my-gc-chaincode
```

This will create a new directory `my-gc-chaincode` with the chaincode template.
Change the directory to the newly created one and see what's inside:

```
cd my-gc-chaincode
ls
```

Among others, you will find the following directories:
- `src` - the source code of your chaincode,
- `e2e` - end-to-end tests for your chaincode,
- `keys` - keys that are required for calling our managed infrastructure.

Additionally, init command creates private keys for the chaincode admin and developer in your home directory at `~/.gc-keys/<chaincode-name>`, where `<chaincode-name>` consists of `gc-` prefix and eth address calculated from chaincode admin public key.

## 3. Register the chaincode

Since this is an early access feature, the ability to deploy to the testnet requires GalaChain approval.
We require the following data to approve your registration: channel admin public key, developer admin key, chaincode Docker image.

## 4. Update the contract (optional)

The chaincode template comes with some sample contract code.
It exposes three contract classes:
- `PublicKeyContract` - makes the chaincode conform to the GalaChain authorization model (the only one you should not modify),
- `GalaChainTokenContract` - contains features for managing tokens (feel free modify or remove it if you want),
- `AppleContract` - a sample showcase contract, probably the easier to start with.

Feel free to modify the contract code to suit your needs.

If you want to verify that your contract works, you can start the local test network with:

```
npm run network:start
```

And then run the end-to-end tests with:

```
npm run test:e2e
```

See the [Chaincode Development](chaincode-development.md) and [Chaincode Testing](chaincode-testing.md) reference for more details.


## 5. Prepare and publish chaincode docker image

Before you can deploy your chaincode, you need to build a Docker image with it and publish it to a registry of your choice (e.g. Docker Hub).

Chaincode template comes with a `Dockerfile` that you should use to build a chaincode image.
Also, it is recommended to use `buildx` to ensure that the image architecture is `linux/amd64` (required by GalaChain network).

Assuming you have Docker tag name in `$TAG` environment variable, you can build and publish the image with the following commands:

```bash
docker buildx build --platform linux/amd64 -t $TAG .
docker push $TAG
```

Docker image should be publicly accessible, as GalaChain network will download it during the deployment.


## 6. Connect your chaincode with GalaChain network

In order to deploy a chaincode GalaChain support needs to review and approve it.
To do so, you need to provide us the following information:
- Docker image tag (without the version, or `:latest` part),
- Chaincode admin public key (from `keys/gc-admin-key.pub` file),
- Developer public key (from `keys/gc-dev-key.pub` file).

After the approval, call the following command to verify you registration:

```
galachain info
```

You should get a JSON response with your chaincode information.
Note the `chaincode` field, which is your chaincode name, and the `image` field, which is the Docker image tag you provided.


## 7. Deploy the chaincode

To deploy the chaincode, you need to call the following command:

```
galachain deploy <image-tag>
```

Replace `<image-tag>` with the Docker image tag you provided, plus the version (e.g. `my-registry/my-gc-chaincode:1.0.0`).

The command will deploy the chaincode to the GalaChain network.
The deployment process may take a while, as the network needs to download the chaincode image and start it.

You can verify the deployment status with `galachain info` command.

See the [Chaincode Deployment](chaincode-deployment.md) reference for more details.


## 8. Call REST API

GalaChain Gateway provides a REST API to interact with the chaincode.
The simplest way to call it is to use `curl` (for convenience, you can use `galachain info` and `jq` to build chaincode url):

```bash
info=$(galachain info)
chaincode=$(jq -r '.chaincode' <<< $info)
channel=$(jq -r '.channel' <<< $info)
url=https://gateway-testnet.galachain.com/api/$channel/$chaincode-AppleContract/GetChaincodeVersion

curl -X POST -d '{}' $url
```

You can also visit the GalaChain Gateway page at [https://gateway-testnet.galachain.com/docs](https://gateway-testnet.galachain.com/docs) to see the Swagger UI and explore the API.

Additionally, which is most convenient, you can use the GalaChain client library to interact with the chaincode.

```typescript
const params: RestApiClientConfig = {
  apiUrl: "https://gateway-testnet.galachain.com/api",
  configPath: path.resolve(__dirname, "api-config.json")
};

const client: ChainClient = gcclient
  .forApiConfig(params)
  .forContract(contract);
```

Also remember to sign the payload with your private key before sending it to the network.
The initial user on chain is the admin, so you can use the relevant `gc-admin-key` from the `~/.gc-keys/<chaincode-name>` directory.
See the [Chaincode Client](chaincode-client.md) and the [Authorization](authorization.md) reference for more details.
