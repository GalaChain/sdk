# Authorization and authentication

GalaChain uses two layers of authorization and authentication to ensure that only authorized users can access the system.
First level, exposed to the client, is based on secp256k1 signatures and private/public key authorization.
Second level uses native Hyperledger Fabric CA users and organizations MSPs.

## How it works

1. Client application signs the transaction with the **end user** private key.
2. GalaChain REST API uses custom **CA user** credentials to call the chaincode.
3. Chaincode checks the MSP of the **CA user** (**Organization based authorization**).
4. Chaincode recovers the **end user** public key from the dto and signature, and verifies if the **end user** is registered (**Signature based authorization**).
5. The transaction is executed if both checks pass.

Note the difference between the **end user** and the **CA user**.
The **end user** is the person who is using the client application, while the **CA user** is the system-level application user that is used to call the chaincode.

## Signature based authorization

Signature based authorization user secp256k1 signatures to verify the identity of the end user.
It uses the same algorithm as Ethereum.

### Signing the transaction payload

Client side it is recommended to use `@gala-chain/api`, or `@gala-chain/cli`, or `@gala-chain/connect` library to sign the transactions.
These libraries will automatically sign the transaction in a way it is compatible with GalaChain.

#### Using `@gala-chain/api`:

```typescript
import { createValidDto } from '@gala-chain/api';
import { ChainCallDTO } from "./dtos";
import { signatures } from "./index";

class MyDtoClass extends ChainCallDTO { ... }

// recommended way to sign the transaction
const dto1 = await createValidDto(MyDtoClass, {myField: "myValue"}).signed(userPrivateKey);

// alternate way, imperative style
const dto2 = new MyDtoClass({myField: "myValue"});
dto2.sign(userPrivateKey);

// when you don't have the dto class, but just a plain object
const dto3 = {myField: "myValue"};
dto3.signature = signatures.getSignature(dto3, Buffer.from(userPrivateKey));
```

#### Using `@gala-chain/cli`:

```bash
galachain dto:sign -o=./output/path.json ./priv-key-file '{ "myField": "myValue" }'
```

#### Using `@gala-chain/connect`:

For the `@gala-chain/connect` library, signing is done automatically when you call the `sendTransaction` method, and it is handled by MetaMask wallet provider.

```typescript
import { GalachainConnectClient } from "@gala-chain/connect";

const client = new GalaChainConnectClient();
await client.connectToMetaMask();

const dto = ...;
const response = await client.sendTransaction(contractUrl, "TransferToken", dto);
```

### Authenticating and authorizing in the chaincode

In the chaincode, before the transaction is executed, GalaChain SDK will recover the public key from the signature and check if the user is registered.
If the user is not registered, the transaction will be rejected with an error.

By default `@Submit` and `@Evaluate` decorators for contract methods enforce signature based authorization.

Chain side `ctx.callingUser` property will be populated with the user's alias, which is either `client|<custom-name>` or `eth|<eth-addr>` (if there is no custom name defined).
Also, `ctx.callingUserEthAddress` will contain the user's Ethereum address.
This way it is possible to get the current user's properties in the chaincode and use them in the business logic.

### User registration

TBD


### Default admin user

TBD

## Organization based authorization

`PublicKeyContract` supports `CURATOR_ORG_MSP` environment variable to restrict access to the chaincode to a specific organization.
If you want to use other organization as an authority to register users, you need to create a new chaincode and set the `CURATOR_ORG_MSP` environment variable to the desired organization.

TBD

## Next: Role Based Access Control (RBAC)

GalaChain v2 will drop support for the chaincode level authorization using Orgs and MSPs.
Instead, we will introduce a new Role Based Access Control (RBAC) system that will allow for more fine-grained control over who can access what resources.

The `allowedOrgs` property will be removed from the chaincode definition and replaced with a new `allowedRoles` property.
For instance, instead of specifying that only `CuratorOrg` can access a certain chaincode, you will be able to specify that only users with the `CURATOR` role can access it.
User roles will be saved with `UserProfile` objects in chain data.

See the current progress in the [RBAC issue](https://github.com/GalaChain/sdk/issues/249).