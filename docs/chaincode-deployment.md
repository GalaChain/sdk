# Chaincode deployment

GalaChain supports TNT network as a Testnet for your chaincodes. Once you deploy a chaincode to TNT network, it will be exposed to the public through the Geteway at [https://gateway-testnet.galachain.com/docs/](https://gateway-testnet.galachain.com/docs/). Registering and deploying chaincodes is available to anyone.

## The anatomy of a chaincode from the deployment perspective

When you init a chaincode with `@gala-chain/cli`, it creates a chaincode directory which includes among others:
- The `keys` directory - public keys that are required for calling our managed infrastructure. Typically two files: `gc-admin-key.pub`, and `gc-dev-key.pub`.
- The `Dockerfile` file that should be used to build the chaincode Docker image.

Additionally, the `init` command creates private keys for the chaincode admin and developer in your home directory at `~/.gc-keys/<chaincode-name>` (`gc-admin-key`, and `gc-dev-key`), where `<chaincode-name>` consists of `gc-` prefix and eth address calculated from chaincode admin public key.

All of this is important for managing the chaincode deployment.

## Registering the chaincode

You may check if your chaincode is registered by calling from the chaincode directory the following command:

```
galachain info
```

This command:
1. Uses your admin public key to determine the chaincode name (requires the `./keys/gc-admin-key.pub` file).
2. Determines the developer private key to sign the request (by default uses developer private key from `/.gc-keys/<chaincode-name>` directory, but there are also other options to provide it).
3. Signs the request with developer private key and calls the TNT Gateway to get the chaincode deployment information.

On the first call, since your chaincode is not registered yet, you will get the unauthorized error. Sample:

```
Error: [401] Cannot authorize access to chaincode on network TNT.

  Operation ID:         EHpFVcHpaBejni2yzQ2WX
  Chaincode:            gc-ab4a643F9f26d933c1bE9Dd8f5057f0F5c820f25
  Developer public key: 04b70f2b896dff49d2da338a3b021dc28aafa5e34712fc59948d64ecc354bb671a940d652763a16b91e208f4b244cc0842d82ac4863b8a7c562808f52a0908e670

It usually means that the chaincode is not registered on TNT, or you are using 
the wrong developer key for signing. If you are sure that the chaincode is 
registered on TNT, please check your developer key. Otherwise, you can register 
the chaincode with `galachain register` command (requires @gala-chain/cli 
version 2.2.0 or higher).
```

You will get the same error if you try to deploy non-registered chaincode.

In order to **register a chaincode**, you need to call the following command:

```
galachain register
```

The command again uses chaincode admin public key to determine the chaincode name, and also uses the content all files that match the pattern: `./keys/gc-dev*-key*.pub` as developers public keys. This way you can provide multiple developers on registration by providing for instance `gc-dev2-key.pub`, or `gc-dev-key2.pub` as additional developer key files. It is also safe to keep developer public keys in the version control.

The CLI register command serves the following prompt to confirm the registration:

```
Registering chaincode on GalaChain TNT network...

  Chaincode name:
    gc-ab4a643f9f26d933c1be9dd8f5057f0f5c820f25
  Chaincode admin public key:
    0461b7b6df010ec529d3ed393f9991fabfe94e8167de43519746309ecddd0007135bdba4f73cf49c22e8086ff1b7305eb889f7286d58e2e57f06c050b4e2b288af
  Developer public keys:
    04b70f2b896dff49d2da338a3b021dc28aafa5e34712fc59948d64ecc354bb671a940d652763a16b91e208f4b244cc0842d82ac4863b8a7c562808f52a0908e670

Are you sure you want to register the chaincode on TNT? (y/n): y
```

And once you confirm it will display the information about the registered chaincode:

```
Chaincode gc-ab4a643f9f26d933c1be9dd8f5057f0f5c820f25 has been registered:
{
  "channel": "testnet01",
  "chaincode": "gc-ab4a643f9f26d933c1be9dd8f5057f0f5c820f25",
  "imageName": null,
  "status": "CH_CREATED",
  "adminPublicKey": "0461b7b6df010ec529d3ed393f9991fabfe94e8167de43519746309ecddd0007135bdba4f73cf49c22e8086ff1b7305eb889f7286d58e2e57f06c050b4e2b288af",
  "lastUpdated": "2025-04-08T13:50:16.881Z",
  "developersPublicKeys": [
    "04b70f2b896dff49d2da338a3b021dc28aafa5e34712fc59948d64ecc354bb671a940d652763a16b91e208f4b244cc0842d82ac4863b8a7c562808f52a0908e670"
  ]
}
```

After that step you are able to deploy the chaincode.


## Preparing the chaincode Docker image

If you want to deploy a chaincode TNT, you need to build and publish a chaincode Docker image.

The image should be built with the `Dockerfile` provided by the `galachain init` command. It ensures the image has proper format and can be used as a chaincode. The CLI performs initial validation of the image before the deployment to prevent from deploying the wrong image.

The image needs to be publicly available so the GalaChain services can access it and deploy. We also not recommend using temporary Docker image registries (like [ttl.sh](ttl.sh)), because it does not allow to redeploy if needed.

Finally the Docker image needs to be built for `linux/amd64` architecture.


## Deploying the chaincode

In order to deploy the chaincode, you need to call the following command:

```
galachain deploy <your-docker-image:tag>
```

The CLI will verify the Docker image locally, and produce a similar prompt for confirmation:

```
Verifying Docker image registry.gitlab.com/dzikowski.online/galachain-sample:1.0.24...

  Chaincode:    gc-ab4a643f9f26d933c1be9dd8f5057f0f5c820f25
  Image:        registry.gitlab.com/dzikowski.online/galachain-sample:1.0.24
  Image SHA256: sha256:af0b2b5acde1fe5dc5cd49cc65d6734be8648fda3688525e69da4d6479effe66
  Contracts: 
   - AppleContract
   - GalaChainToken
   - PublicKeyContract

Are you sure you want to deploy the chaincode gc-ab4a643f9f26d933c1be9dd8f5057f0f5c820f25 to TNT? (y/n): y
```

If you are working on Apple M processor, you may also see a warning: _The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested_, but this is just a result of performing local validation of the image, and you can ignore it.

Once you confirm the deploy, you may expect a response which is similar to:

```
Deployment scheduled to TNT:
{
  "network": "TNT",
  "channel": "testnet01",
  "chaincode": "gc-ab4a643f9f26d933c1be9dd8f5057f0f5c820f25",
  "adminPublicKey": "0461b7b6df010ec529d3ed393f9991fabfe94e8167de43519746309ecddd0007135bdba4f73cf49c22e8086ff1b7305eb889f7286d58e2e57f06c050b4e2b288af",
  "developersPublicKeys": [
    "04b70f2b896dff49d2da338a3b021dc28aafa5e34712fc59948d64ecc354bb671a940d652763a16b91e208f4b244cc0842d82ac4863b8a7c562808f52a0908e670"
  ],
  "imageName": null,
  "sequence": 1,
  "status": "CC_DEPLOY_SCHEDULED",
  "lastUpdated": "2025-04-08T16:30:03.757Z"
}
```

Typically it takes about 1-5 minutes till your chaincode is available on GalaChain Gateway.


## Call the deployed chaincode

You can use any REST API client (like `axios`, `fetch`, or `undici` to call your chaincodes). Remember in most cases you will need to sign the DTO with either the `gc-admin-key` or any key of registered user.

We highly recommend to use the `@gala-chain/api` library for handling DTOs and signing. For instance, you can register a user by calling `/api/.../...-PublicKeyContract/RegisterEthUser` and providing the following [`RegisterEthUser`](https://galahackathon.com/latest/chain-api-docs/classes/RegisterEthUserDto/) as payload:

```typescript
const dto = new RegisterEthUser();
dto.publicKey = <newUserPublicKey>;
dto.sign(<gc-admin-key>);
const payloadString = dto.serialize();
```

In the current version of the library, local environment exposes slightly different endpoints than the production environment.
`gcclient` and `@gala-chain/client` packages are compatible with the local environment only.
For calling the production environment, you should consult the Swagger documentation at [https://gateway-testnet.galachain.com/docs/](https://gateway-testnet.galachain.com/docs/), and use generic REST API client.
