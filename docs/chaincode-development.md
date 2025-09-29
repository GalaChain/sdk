# Chaincode development

The GalaChain SDK allows you to write Hyperledger Fabric chaincodes in TypeScript in a more convenient way, while adjusting them to the GalaChain platform.

Key features:
- Contract classes
- Transaction decorators
- Transaction context
- Authentication and authorization
- DTO types
- Objects saved on chain
- Error handling
- State cache
- Recommended project structure
- Tracing support

All samples in this document come from the GalaChain chaincode template.
You can find the template in our source code in `chain-cli/chaincode-template` directory, or initialize it with the `galachain init` command.

## Contract classes

The GalaChain SDK allows developers to write chaincodes in an object-oriented way.
It reuses the concept of contract classes and contract methods from the [Hyperledger Fabric Contract API](https://hyperledger.github.io/fabric-chaincode-node/release-2.2/api/).
Typically, a contract class is a TypeScript class that extends the `GalaContract` class from the `@gala-chain/chaincode` library.
It is recommended to treat each contract class as a controller in the MVC pattern (Model, View, Controller) and minimize the logic within it.

Sample contract class:

```typescript
import { Evaluate, GalaChainContext, GalaContract, Submit } from "@gala-chain/chaincode";
import { version } from "../../package.json";
import { AppleTreeDto, FetchTreesDto, PagedTreesDto, fetchTrees, plantTree } from "../apples";

export class AppleContract extends GalaContract {
  constructor() {
    super("AppleContract", version);
  }

  @Submit({
    in: AppleTreeDto
  })
  public async PlantTree(ctx: GalaChainContext, dto: AppleTreeDto): Promise<void> {
    await plantTree(ctx, dto);
  }

  @Evaluate({
    in: FetchTreesDto,
    out: PagedTreesDto
  })
  public async FetchTrees(ctx: GalaChainContext, dto: FetchTreesDto): Promise<PagedTreesDto> {
    return await fetchTrees(ctx, dto);
  }
}
```

`GalaContract` is a base class for all contract classes.
It provides several features:
- It ensures that all contract methods have access to the proper transaction context (`GalaChainContext`, see [Transaction decorators](#transaction-decorators)).
- It adds common methods for a contract: `GetContractVersion`, `GetContractAPI`, `GetObjectByKey`, and `GetObjectHistory`.
- It saves all writes from the GalaChain state cache to the ledger at the end of a successful transaction (see [State cache](#state-cache)).
- It enhances tracing (see [Tracing support](#tracing-support)).

The constructor `GalaContract` class requires two parameters: `name` and `version`.
`name` is a name of the contract, and `version` is a version of the contract.
Typically, you can read the version from the `package.json` file and 
version numbers conventionally follow the 
[npm / semver standards](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#version).

Each method of the contract class require two parameters: `ctx` and `dto`.
`ctx` is a transaction context, an object that extends Hyperledger Fabric [`Context`](https://hyperledger.github.io/fabric-chaincode-node/release-2.2/api/fabric-contract-api.Context.html) class.
Aside from the standard Fabric context, it provides some additional methods and properties (see [Transaction context](#transaction-context)).

The second parameter, `dto`, is an object that contains all parameters of the transaction (see [DTO types](#dto-types)).

Also, all contract methods are decorated with `@Submit`, `@Evaluate`, or `@GalaTransaction` decorators (see [Transaction decorators](#transaction-decorators)).
These decorators are required for various reasons. For instance, they allow you to properly expose the contract methods in GalaChain, deserialize and validate input parameters, normalize the response, handle authorization, etc.

## Transaction decorators

Transaction decorators enhance the contract methods with various features:
- They allow to properly expose the contract methods API in GalaChain.
- They deserialize and validate the DTO before method is called.
- They normalize the chaincode method output from any type to `GalaChainResponse`.
- They handle authorization.
- They can be used to ensure uniqueness of the transaction in case of duplicate calls.
- They can be used to define actions that should be executed before and after the transaction.

GalaChain defines three decorator types: `@Submit`, `@Evaluate`, and `@GalaTransaction`.

- `@Submit` decorator is used for contract methods that modify the ledger state.
- `@Evaluate` decorator is used for contract methods that only read the ledger state.
- `@GalaTransaction` decorator is used for both types of contract methods, but is more verbose.
  It is recommended to use `@Submit` and `@Evaluate` decorators instead.

All decorators support the following parameters:
- `in` - input DTO class that extends `GalaChainDto` class from `@gala-chain/chaincode` library (default: `ChainCallDTO` class).
  This parameter is used to properly deserialize and validate the input parameters of the transaction, and to properly expose the contract method API in GalaChain.
  It is highly recommended to provide a custom dto class as a parameter, otherwise the validation won't work at all: There will be issues with deserialization of non-standard input parameters like nested classes, `BigDecimal` values etc.
- `out` - output type of the chaincode method (default: `"null"`).
  It might be a string representing the type (`"number"`, `"string"`, `"boolean"`, `"null"`, `"object"`), or a custom class, or an object `{ "arrayOf": X }` where `X` is a string representing the type or a custom class.
  This parameter is used to properly expose the contract method API in GalaChain.
- `description` - optional description of the contract method that is presented in GalaChain contract method API definition.
- `allowedOrgs` - optional parameter to define which organizations are allowed to call the contract method.
  It is a string array with organization names.
  If not provided, all organizations are allowed to call the contract method.
  **Note**: This parameter is deprecated and will be removed in future versions. Use `allowedRoles` instead.
- `allowedRoles` - optional parameter to define which roles are allowed to call the contract method.
  It is a string array with role names.
  If not provided, defaults to `SUBMIT` for submit transactions and `EVALUATE` for evaluate transactions.
- `minimalQuorum` - optional parameter to override the user's signature quorum requirement.
  This allows you to require fewer signatures than the user's configured quorum for specific operations.
- `apiMethodName` - optional name of the contract method that should be used in the GalaChain REST API.
  If not provided, the name of the contract method is used.
- `sequence` - optional parameter for advanced use cases.
  It means that the method call should actually be defined as a sequence of calls.
  It is useful when a GalaChain REST API call should consist of multiple calls, and each call should be executed in a separate transaction in a separate block.
  The sequence of calls is handled by GalaChain REST API.
- `enforceUniqueKey` - ensures that DTO contain a `uniqueKey` property, which is required to prevent duplicate calls (see [Prevent attacks or bad data state from duplicate calls](#prevent-duplicate-calls)).
- `before` - optional parameter defining a function to be executed before the actual transaction (but after the authorization).
- `after` - optional parameter defining a function to be executed after the actual transaction (but before the state cache is saved to the ledger).

Additionally, `@GalaTransaction` decorator supports `type` and `verifySignature` parameters.
`type` can be `GalaTransactionType.SUBMIT` or `GalaTransactionType.EVALUATE` and means whether the transaction is a submit or evaluate transaction.
`verifySignature` can be `true` or `false` and means whether the transaction should be verified against the signature.
It is NOT recommended to use `verifySignature` as `false`, because it disables authorization for the transaction.

`@Submit` decorator is a shortcut for `@GalaTransaction({ type: GalaTransactionType.SUBMIT, verifySignature: true })`.
`@Evaluate` decorator is a shortcut for `@GalaTransaction({ type: GalaTransactionType.EVALUATE, verifySignature: true })`.

## Transaction context

`GalaChainContext` is an object that extends Hyperledger Fabric [`Context`](https://hyperledger.github.io/fabric-chaincode-node/release-2.2/api/fabric-contract-api.Context.html) class.
Asides from standard Fabric context, it provides some additional methods and properties:

- `callingUser` - returns standardized user id with prefix and actual name (note calling user is something different, than user in Fabric CA; see [Authentication and authorization](#authentication-and-authorization)).
- `callingUserEthAddress` - returns eth address that is derived from calling user public key (see [Authentication and authorization](#authentication-and-authorization)).
- `callingUserTonAddress` - returns TON address that is derived from calling user public key (see [Authentication and authorization](#authentication-and-authorization)).
- `callingUserRoles` - returns array of roles assigned to the calling user.
- `callingUserProfile` - returns complete user profile object for the calling user.
- `callingUserSignedByKeys` - returns array of public keys that signed the current transaction (for multisig).
- `callingUserSignatureQuorum` - returns required number of signatures for the calling user (for multisig).
- `callingUserData` - setter for all calling user data (used internally by authentication).
- `txUnixTime` - returns unix time of the transaction.
- `span` - returns tracing span of the transaction (see [Tracing support](#tracing-support)).

`GalaChainContext` also changes the behavior of the `stub` property.
In a standard Fabric context, the `stub` property returns a `ChaincodeStub` object.
In a GalaChain context, the `stub` property returns a proxy object that wraps `ChaincodeStub` in a way to support caching (see [State cache](#state-cache)).

Finally, it adds some customization to the `logger` property.

### Multisig Context Properties

When working with multisig transactions, additional context properties are available:

- `callingUserSignedByKeys`: Array of public keys that signed the current transaction
- `callingUserSignatureQuorum`: Required number of signatures for the calling user
- `callingUserData`: Setter for all calling user data (used internally by authentication)

These properties are particularly useful for implementing business logic that depends on multisig requirements:

```typescript
@Submit({
  in: TransferDto,
  description: "Transfer tokens with multisig validation"
})
async transferTokens(ctx: GalaChainContext, dto: TransferDto): Promise<void> {
  // Access multisig information
  const signedByKeys = ctx.callingUserSignedByKeys;
  const requiredQuorum = ctx.callingUserSignatureQuorum;
  
  // Log multisig information
  ctx.logger.info(`Transfer signed by ${signedByKeys.length}/${requiredQuorum} required signatures`);
  
  // Implement business logic based on signature count
  if (dto.amount > 10000 && signedByKeys.length < 3) {
    throw new ValidationFailedError("Large transfers require at least 3 signatures");
  }
  
  // Process the transfer
  await processTransfer(ctx, dto);
}
```


## Authentication and authorization

A method call requires authorization when it is marked with `@Submit` or `@Evaluate` decorator, or with `@GalaTransaction` with `verifySignature: true`.

Authorization is handled chaincode-side, on the basis of secp256k1 signature of the transaction.
GalaChain recovers the public key from the signature, and derives the corresponding eth address from the public key.
Then, GalaChain checks whether the eth address is registered in GalaChain as a user.

If the user is registered, `ctx.callingUser` and `ctx.callingUserEthAddress` properties are set in the transaction context.
`ctx.callingUser` is a standardized user id with prefix and actual name.
It may be `eth|<user-eth-address>` or `client|<user-alias>`, depending on the way the user was registered (`RegisterUser` and `RegisterEthUser` respectively).

If the user is not registered, or the signature is missing or invalid, then the transaction is rejected.

Additional notes:
* If a method is exposed but (1) does not require authorization (marked with `@GalaTransaction` with `verifySignature: false`), and (2) its DTO does not have a signature, then `ctx.callingUser` contains the Fabric CA username (`client|<ca-username>`) and executing `ctx.callingUserEthAddress` throws an exception.
* If a method is exposed, does not require authorization, and the DTO has a signature, then the regular authorization flow is performed.

### Additional notes about signatures

A JSON payload to be signed is created from a DTO object without `signature` and `trace` properties, with its keys sorted alphabetically, and no end of line character(s) at the end. (Further reading as to why the must be the case can be found in the official [Hyperledger Fabric documentation](https://hyperledger-fabric.readthedocs.io/en/release-2.4/chaincode4ade.html#json-determinism)). 
Sample `jq` command to produce valid data to sign: `jq -cSj "." dto-file.json`.

Also, all `BigNumber` data should be provided as strings (not numbers or directly serialized BigNumber objects) with fixed decimal point notation.

The EC secp256k1 signature should be created for keccak256 hash of the data.
The recommended format of the signature is a HEX encoded string, including r + s + v values.
Signature in this format is supported by [`ethers`](https://docs.ethers.org/v5/) library.

Sample signature:

```
b7244d62671319583ea8f30c8ef3b343cf28e7b7bd56e32b21a5920752dc95b94a9d202b2919581bcf776f0637462cb67170828ddbcc1ea63505f6a211f9ac5b1b
```

GalaChain also supports DER encoded signatures for authorization, but since the DER signature does not contain `v` value (the recovery part), you need to additionally provide `signerPublicKey` parameter to the transaction DTO.

Sample DER signature (first line), and the corresponding `signerPublicKey` (second line):

```
3045022100b7244d62671319583ea8f30c8ef3b343cf28e7b7bd56e32b21a5920752dc95b902204a9d202b2919581bcf776f0637462cb67170828ddbcc1ea63505f6a211f9ac5b
04fa7d9e30902207fd821a1518ce777e1935a45e52180d6a6339f37c3e3f759d1a64e33ed1e334070d37731f6ce3f4a5daa6ee4c9884f21860601fed892d40b2a9
```

### Restricting access by organization name

You can restrict access to a contract method by organization name using `allowedOrgs` parameter of the transaction decorators.
It is a string array with organization MSP names.

For example, if you want to allow only `CuratorOrg` and `FarmerOrg` to call a contract method, you can use:

GalaChain authorization will check whether the Fabric CA user which called the transaction belongs to one of the allowed organizations.
Thus, the check is not related with user profile saved on chain, but related with the CA user which called the transaction.

```typescript
@Submit({
  in: AppleTreeDto,
  allowedOrgs: ["CuratorOrg", "FarmerOrg"]
})
```

Additionally, if you don't want to hardcode the organization names in the contract code, you can use `AUTHORITY_ORG_NAME` const from `@gala-chain/chaincode` library.
It takes the organization name from `AUTHORITY_ORG_NAME` environment variable (which defaults to `CuratorOrg`).


## DTO types

We consider DTO as an object that contains all parameters of the transaction (transaction input parameters).
It is passed as a second parameter to the contract method and deserialized with the use of transaction decorator `in` parameter.

Each DTO class should extend `ChainCallDTO` class from `@gala-chain/chaincode` library.
It defines some additional fields that are required for GalaChain to properly handle the transaction:
- `signature` - optional signature of the transaction.
  It is required for authorization (see [Authentication and authorization](#authentication-and-authorization)).
- `signerPublicKey` - optional signer public key of the transaction.
  It is required for authorization when the transaction is signed with DER signature (see [Authentication and authorization](#authentication-and-authorization)).
- `uniqueKey` - optional unique key of the transaction.
  It is required to prevent duplicate calls (see [Prevent duplicate calls](#prevent-duplicate-calls)).
- `dtoExpiresAt` - optional expiration timestamp in milliseconds.
  It is used to prevent replay attacks and enforce time-sensitive operations (see [Authentication and authorization](#dto-expiration)).
- `trace` - optional tracing span of the transaction (see [Tracing support](#tracing-support)).

Sample DTO class:

```typescript
import { ChainCallDTO, StringEnumProperty } from "@gala-chain/api";
import { Type } from "class-transformer";
import { ArrayNotEmpty, ValidateNested } from "class-validator";

export enum Variety {
  GALA = "GALA",
  GOLDEN_DELICIOUS = "GOLDEN_DELICIOUS"
}

export class AppleTreeDto extends ChainCallDTO {
  @StringEnumProperty(Variety)
  public readonly variety: Variety;

  public readonly index: number;
}

export class AppleTreesDto extends ChainCallDTO {
  @ValidateNested({ each: true })
  @Type(() => AppleTreeDto)
  @ArrayNotEmpty()
  public readonly trees: AppleTreeDto[];
}
```

GalaChain uses [`class-transformer`](https://github.com/typestack/class-transformer) and [`class-validator`](https://github.com/typestack/class-validator) libraries for DTO serialization and validation.
It also provides some additional decorators for DTO properties, like `@StringEnumProperty`, or `@BigNumberProperty`.
You should consult the documentation of these libraries, especially for more complex use cases (including but not limited to): Nested objects, arrays of objects, etc. (note decorators for `trees` property in the sample above).

Optionally, you can provide a `@JSONSchema` decorator from the [`class-validator-jsonschema`](https://github.com/epiphone/class-validator-jsonschema) library, either for whole DTO class, or for each property.
It is used to generate a JSON schema for the DTO, which is used in GalaChain REST API.


## Objects saved on chain

GalaChain uses the same validation and serialization libraries for objects saved on chain as for DTOs ([`class-transformer`](https://github.com/typestack/class-transformer) and [`class-validator`](https://github.com/typestack/class-validator)).
Accordingly, you can use the same decorators for objects saved on chain as for DTOs.

```typescript
import { BigNumberProperty, ChainKey, ChainObjectBase, StringEnumProperty } from "@gala-chain/api";
import BigNumber from "bignumber.js";
import { IsString } from "class-validator";
import { Variety } from "./types";

export class AppleTree extends ChainObject {
  static INDEX_KEY = "GCAPPL";

  @ChainKey({ position: 0 })
  @IsString()
  public readonly plantedBy: string;

  @ChainKey({ position: 1 })
  @StringEnumProperty(Variety)
  public readonly variety: Variety;

  @ChainKey({ position: 2 })
  public readonly index: number;

  public readonly plantedAt: number;

  @BigNumberProperty()
  public applesPicked: BigNumber;
}
```

Aside from standard validation and serialization, GalaChain provides a `@ChainKey` decorator.
It is used to define parts of the key of the object saved on chain.
For instance in the sample above, the key of the object saved on chain consists of `INDEX_KEY`, `plantedBy`, `variety`, and `index` properties.
Since it is build from multiple properties, it is called a composite key.

Consider you have `appleTree` which is an instance of `AppleTree` class, and you want to save it on chain.
You can use `putChainObject` method from `@gala-chain/chaincode` library:

```typescript
await putChainObject(ctx, appleTree);
```

If you want to delete it from chain, you can use `deleteChainObject` method:

```typescript
await deleteChainObject(ctx, appleTree);
```

If you have a key of the object saved on chain (`key`), you can use `getChainObject` method to get the object from chain (`AppleTree` class is required to properly deserialize the object):

```typescript
await getObjectByKey(ctx, AppleTree, key);
```

You can get object history with `getObjectHistory` method:

```typescript
await getObjectHistory(ctx, key);
```

And you can check if the object exists on chain with `objectExists` method:

```typescript
await objectExists(ctx, key);
```

Additionally, since GalaChain uses composite keys, you can get all objects with the same prefix using the `getObjectByPartialCompositeKey` method.
For instance, if you want to get all gala apple trees planted by a farmer, you can use:

```typescript
await getObjectByPartialCompositeKey(ctx, AppleTree.INDEX_KEY, ["farmer1", Variety.GALA], AppleTree);
```

There is also a relevant method that uses pagination (can be used only read-only transactions): `getObjectByPartialCompositeKeyWithPagination`.

### Ranged objects

GalaChain also supports ranged objects.
Ranged objects do not use composite keys, so they can be used in Hyperledger Fabric range queries.

Instead of `ChainObject` class, you should use `RangedChainObject` class.
Then, you can use `@ChainKey` decorator to define the key parts of the object saved on chain the same way as for `ChainObject` class.
In order to put ranged object on chain, you should use `putRangedChainObject` method.

## Error handling

We recommend handling errors with exceptions.
The GalaChain SDK provides a `ChainError` class that extends the Node.js `Error` class, which additionally contains:
* `code` property mapped to a corresponding HTTP code in GalaChain REST API.
* `key` property which is an autogenerated string key from the error class name (for easier debugging).
* `payload` property which is an optional object with additional information about the error.

The GalaChain SDK provides also several predefined error classes which contain proper `code` values: `ValidationError`, `UnauthorizedError`, `PaymentRequiredError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `NoLongerAvailableError`, `DefaultError`, `RuntimeError`, `NotImplementedError`.
You may use them in your code or (preferably) create your own error classes that extend one of the predefined error classes.

When a contract method throws an error:
* no state changes are saved to the ledger;
* the error is logged;
* the error is automatically handled, so the response is always a `GalaChainResponse` object (in case of error the response object contains error properites `Status`, `Message`, `ErrorCode`, `ErrorKey`, and `ErrorPayload`);
* the transaction is saved on the ledger in transaction history.


## State cache

When you get state in Hyperledger Fabric, it always returns the latest value from the ledger.
When you update the state in a method, and get it again in the same method, it returns the same value as before the update.
To avoid this behavior, the GalaChain SDK has a built-in state cache.

This way, when you get state in a transaction method, and update it in the same method, the second get returns the updated value.

The state cache also prevents inconsistent state in case of exceptions.
Since all state changes are flushed to the ledger only at the end of a successful transaction, if an exception is thrown, the state is not updated.

## Prevent duplicate calls

Accidental (or maliciously intentional) duplicate calls of some transactions could potentially lead to bad data states, spend of additional token quantities, application layer vulnerabilities, or other ill effects. 
To prevent this class of problems, DTOs can contain a `uniqueKey` property.
It is an optional string, provided client-side, that is used to prevent duplicate calls.
If the same `uniqueKey` is provided in two different transactions, the second transaction is rejected with `UniqueTransactionConflictError` error.
