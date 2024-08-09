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

In this document, if we refer to the **user**, we mean the **end user**.

## Signature based authorization

Signature based authorization user secp256k1 signatures to verify the identity of the end user.
By default, it uses the same algorithm as Ethereum (keccak256 + secp256k1), but also TON (The Open Network) signing scheme is supported.

### Required fields in dto object

The following fields are required in the transaction payload object:
* For Ethereum signing scheme with regular signature format (r + s + v): `signature` field only.
* For Ethereum signing scheme with DER signature formar: `signature` and `signerPublicKey` fields. 
  The `signerPublicKey` field is required to recover the public key from the signature, since DER signature does not contain the recovery parameter `v`.
* For TON signing scheme: `signature`, `signerPublicKey`, and `signing` fields. The `signing` field must be set to `TON`.

Both for Eth DER signature and TON signing scheme, instead of `signerPublicKey` field, you can use `signerAddress` field, which contains the user's checksumed Ethereum address or bounceable TON address respectively.
The address will be used to get public key of a registered user and use it for signature verification.

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

If you want to use `TON` signing scheme, just provide `TON` as the signing scheme in your DTO object:

```typescript
// recommended way to sign the transaction
const dto1 = await createValidDto(MyDtoClass, {myField: "myValue", signing: "TON"}).signed(userPrivateKey);

// alternate way, imperative style
const dto2 = new MyDtoClass({myField: "myValue", signing: "TON"});
dto2.sign(userPrivateKey);

// when you don't have the dto class, but just a plain object
const dto3 = {myField: "myValue", signing: "TON"};
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

const client = new GalaChainConnectClient(contractUrl);
await client.connectToMetaMask();

const dto = ...;
const response = await client.send({ method: "TransferToken", payload: dto });
```

#### "Manual" process (ETH):

If you are not using any of the libraries, you can sign the transaction with the following steps:

1. You need to have secp256k1 private key of the end user.
2. Given the transaction payload as JSON object, you need to serialize it to a string in a way that it contains no additional spaces or newlines, fields are sorted alphabetically, and all `BigNumber` values are converted to strings with fixed notation. Also, you need to exclude top-level `signature` and `trace` fields from the payload.
3. You need to hash the serialized payload with keccak256 algorithm (note this is [NOT the same](https://crypto.stackexchange.com/questions/15727/what-are-the-key-differences-between-the-draft-sha-3-standard-and-the-keccak-sub) algorithm as SHA-3).
4. You need to get the signature of the hash using the private key, and add it to the payload as a `signature` field. The signature should be in the format of `rsv` array, where `r` and `s` are 32-byte integers, and `v` is a single byte.

It is important to follow these steps exactly, because chain side the same way of serialization and hashing is used to verify the signature.
If the payload is not serialized and hashed in the same way, the signature will not be verified.

### "Manual" process (TON):

In this case you need to have ed25519 private key and seed for the signing and signature verification, and we recommend using `safeSign` method from `@ton/core` library:

```typescript
import { beginCell, safeSign } from "@ton/core";

const data = "..."; // properly serialized payload string
const cell = beginCell().storeBuffer(Buffer.from(data)).endCell();
const signature = safeSign(cell, privateKey, seed);
```

The serialized payload string must be prepared in the same way as for Ethereum signing:
- no additional spaces or newlines,
- fields sorted alphabetically,
- all `BigNumber` values are converted to strings with fixed notation,
- top-level `signature` and `trace` fields excluded from the payload.

`safeSign` method generates the signature in the following way:

```
signature = Ed25519Sign(privkey, sha256(0xffff ++ utf8_encode(seed) ++ sha256(message)))
```

### Authenticating and authorizing in the chaincode

In the chaincode, before the transaction is executed, GalaChain SDK will recover the public key from the signature and check if the user is registered.
If the user is not registered, the transaction will be rejected with an error.

By default `@Submit` and `@Evaluate` decorators for contract methods enforce signature based authorization.
The `@GalaTransaction` decorator is more flexible and can be used to disable signature based authorization for a specific method.
Disabling signature based authorization is useful when you want to allow anonymous access to a method, but it is not recommended for most use cases.

Chain side `ctx.callingUser` property will be populated with the user's alias, which is either `client|<custom-name>` or `eth|<eth-addr>` (if there is no custom name defined).
Also, `ctx.callingUserEthAddress` will contain the user's Ethereum address.
This way it is possible to get the current user's properties in the chaincode and use them in the business logic.

Additionally, we plan to support role-based access control (RBAC) in the future, which will allow for more fine-grained control over who can access what resources.
See the [RBAC section](#next-role-based-access-control-rbac) for more information.

### User registration

Gala chain does not allow anonymous users to access the chaincode.
In order to access the chaincode, the user must be registered with the chaincode.
There are two methods to register a user:

1. `RegisterUser` method in the `PublicKeyContract`.
2. `RegisterEthUser` method in the `PublicKeyContract`.

Both methods require the user to provide their secp256k1 public key.
The only difference between these two methods is that `RegisterEthUser` does not require the `alias` parameter, and it uses the Ethereum address (prefixed with `eth|`) as the user's alias.

Access to `RegisterUser` and `RegisterEthUser` methods is restricted on the organization level.
Only the organization that is specified in the chaincode as `CURATOR_ORG_MSP` environment variable can access these methods (it's `CuratorOrg` by default).
Technically that means that the client application must use the `CA user` that is registered with the `CuratorOrg` organization to call these methods.
See the [Organization based authorization](#organization-based-authorization) section for more information.

### Default admin user

When the chaincode is deployed, it contains a default admin end user.
It is provided by two environment variables:
* `DEV_ADMIN_PUBLIC_KEY` - it contains the admin user public key (sample: `88698cb1145865953be1a6dafd9646c3dd4c0ec3955b35d89676242129636a0b`).
* `DEV_ADMIN_USER_ID` - it contains the admin user alias (sample: `client|admin`; this variable is optional),

If the user profile is not found in the chain data, and the public key recovered from the signature is the same as the admin user public key (`DEV_ADMIN_PUBLIC_KEY`), the admin user is set as the calling user.
Additionally, if the admin user alias is specified (`DEV_ADMIN_USER_ID`), it is used as the calling user alias.
Otherwise, the default admin user alias is  `eth|<eth-addr-from-public-key>`.

The admin user is required to register other users.

For GalaChain TestNet the admin user public key is specified by the `adminPublicKey` registration parameter.

Note the admin uses is an end user, not a CA user, and it cannot bypass the organization based authorization.
If you want to use the admin user to register other users, you need to use the CA user that is registered with the curator organization.

## Organization based authorization

Organization based authorization uses Hyperledger Fabric CA users and organizations MSPs to verify the identity of the caller.
It is used to restrict access to the chaincode method to a specific organization.

You can restrict access to the contract method to a specific organizations by setting the `allowedOrgs` property in the `@GalaTransaction`.

```typescript
@GalaTransaction({
    allowedOrgs: ["SomeRandomOrg"]
})
```

For the `PublicKeyContract` chaincode, the `CURATOR_ORG_MSP` environment variable is used as the organization that is allowed to register users (default value is `CuratorOrg`).
It is recommended to use the same variable for curator-level access to the chaincode methods.

## Next: Role Based Access Control (RBAC)

GalaChain v2 will drop support for the chaincode level authorization using Orgs and MSPs.
Instead, we will introduce a new Role Based Access Control (RBAC) system that will allow for more fine-grained control over who can access what resources.

The `allowedOrgs` property will be removed from the chaincode definition and replaced with a new `allowedRoles` property.
For instance, instead of specifying that only `CuratorOrg` can access a certain chaincode, you will be able to specify that only users with the `CURATOR` role can access it.
User roles will be saved with `UserProfile` objects in chain data.

See the current progress in the [RBAC issue](https://github.com/GalaChain/sdk/issues/249).
