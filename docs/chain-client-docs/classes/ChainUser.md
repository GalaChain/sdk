**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > ChainUser

# Class: ChainUser

Represents a user configuration object, containing all the information
needed to authenticate and sign transactions.

## Contents

- [Constructors](ChainUser.md#constructors)
  - [new ChainUser(config)](ChainUser.md#new-chainuserconfig)
- [Properties](ChainUser.md#properties)
  - [ethAddress](ChainUser.md#ethaddress)
  - [identityKey](ChainUser.md#identitykey)
  - [name](ChainUser.md#name)
  - [prefix](ChainUser.md#prefix)
  - [privateKey](ChainUser.md#privatekey)
  - [publicKey](ChainUser.md#publickey)
- [Methods](ChainUser.md#methods)
  - [withRandomKeys()](ChainUser.md#withrandomkeys)

## Constructors

### new ChainUser(config)

> **new ChainUser**(`config`): [`ChainUser`](ChainUser.md)

#### Parameters

▪ **config**: `object`

Configuration object for the constructor.

▪ **config.name?**: `string`

If provided, the resulting prefix will be
`client` and identityKey will be `client|${name}`. Otherwise, the prefix
will be `eth` and identityKey will be `eth|${ethAddress}`.

▪ **config.privateKey**: `string`

A secp256k1 private key to be used for
cryptographic operations. It will be used to calculate the public key and
the ethAddress, and will be used to sign transactions.

#### Source

[generic/ChainUser.ts:44](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainUser.ts#L44)

## Properties

### ethAddress

> **`readonly`** **ethAddress**: `string`

#### Source

[generic/ChainUser.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainUser.ts#L29)

***

### identityKey

> **`readonly`** **identityKey**: `string`

#### Source

[generic/ChainUser.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainUser.ts#L28)

***

### name

> **`readonly`** **name**: `string`

#### Source

[generic/ChainUser.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainUser.ts#L27)

***

### prefix

> **`readonly`** **prefix**: `string`

#### Source

[generic/ChainUser.ts:26](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainUser.ts#L26)

***

### privateKey

> **`readonly`** **privateKey**: `string`

#### Source

[generic/ChainUser.ts:30](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainUser.ts#L30)

***

### publicKey

> **`readonly`** **publicKey**: `string`

#### Source

[generic/ChainUser.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainUser.ts#L31)

## Methods

### withRandomKeys()

> **`static`** **withRandomKeys**(`name`?): [`ChainUser`](ChainUser.md)

Generates a new ChainUser object with random keys.

#### Parameters

▪ **name?**: `string`

The name to be used for the ChainUser.
If provided, the resulting identityKey will be `client|${name}`.
Otherwise, the identityKey will be `eth|${ethAddress}`.

#### Returns

- A new ChainUser object with the generated
random keys and the provided or default name.

#### Source

[generic/ChainUser.ts:70](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainUser.ts#L70)
