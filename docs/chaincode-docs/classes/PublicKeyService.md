**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > PublicKeyService

# Class: PublicKeyService

## Contents

- [Constructors](PublicKeyService.md#constructors)
  - [new PublicKeyService()](PublicKeyService.md#new-publickeyservice)
- [Properties](PublicKeyService.md#properties)
  - [PK\_INDEX\_KEY](PublicKeyService.md#pk-index-key)
  - [UP\_INDEX\_KEY](PublicKeyService.md#up-index-key)
  - [normalizePublicKey](PublicKeyService.md#normalizepublickey)
- [Methods](PublicKeyService.md#methods)
  - [ensurePublicKeySignatureIsValid()](PublicKeyService.md#ensurepublickeysignatureisvalid)
  - [getPublicKey()](PublicKeyService.md#getpublickey)
  - [getPublicKeyKey()](PublicKeyService.md#getpublickeykey)
  - [getUserProfile()](PublicKeyService.md#getuserprofile)
  - [getUserProfileKey()](PublicKeyService.md#getuserprofilekey)
  - [putPublicKey()](PublicKeyService.md#putpublickey)
  - [putUserProfile()](PublicKeyService.md#putuserprofile)

## Constructors

### new PublicKeyService()

> **new PublicKeyService**(): [`PublicKeyService`](PublicKeyService.md)

## Properties

### PK\_INDEX\_KEY

> **`static`** **`private`** **PK\_INDEX\_KEY**: `string` = `PK_INDEX_KEY`

#### Source

[chaincode/src/services/PublicKeyService.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L31)

***

### UP\_INDEX\_KEY

> **`static`** **`private`** **UP\_INDEX\_KEY**: `string` = `UP_INDEX_KEY`

#### Source

[chaincode/src/services/PublicKeyService.ts:32](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L32)

***

### normalizePublicKey

> **`static`** **normalizePublicKey**: (`input`) => `string` = `normalizePublicKey`

#### Parameters

▪ **input**: `string`

#### Source

[chaincode/src/services/PublicKeyService.ts:42](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L42)

## Methods

### ensurePublicKeySignatureIsValid()

> **`static`** **ensurePublicKeySignatureIsValid**(`ctx`, `userId`, `dto`): `Promise`\<`PublicKey`\>

Verifies if the data is properly signed. Throws exception instead.

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **userId**: `string`

▪ **dto**: `ChainCallDTO`

#### Source

[chaincode/src/services/PublicKeyService.ts:124](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L124)

***

### getPublicKey()

> **`static`** **getPublicKey**(`ctx`, `userId`): `Promise`\<`undefined` \| `PublicKey`\>

#### Parameters

▪ **ctx**: `Context`

▪ **userId**: `string`

#### Source

[chaincode/src/services/PublicKeyService.ts:96](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L96)

***

### getPublicKeyKey()

> **`static`** **`private`** **getPublicKeyKey**(`ctx`, `userId`): `string`

#### Parameters

▪ **ctx**: `Context`

▪ **userId**: `string`

#### Source

[chaincode/src/services/PublicKeyService.ts:34](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L34)

***

### getUserProfile()

> **`static`** **getUserProfile**(`ctx`, `ethAddress`): `Promise`\<`undefined` \| `UserProfile`\>

#### Parameters

▪ **ctx**: `Context`

▪ **ethAddress**: `string`

#### Source

[chaincode/src/services/PublicKeyService.ts:65](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L65)

***

### getUserProfileKey()

> **`static`** **`private`** **getUserProfileKey**(`ctx`, `ethAddress`): `string`

#### Parameters

▪ **ctx**: `Context`

▪ **ethAddress**: `string`

#### Source

[chaincode/src/services/PublicKeyService.ts:38](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L38)

***

### putPublicKey()

> **`static`** **putPublicKey**(`ctx`, `publicKey`, `userId`?): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **publicKey**: `string`

▪ **userId?**: `string`

#### Source

[chaincode/src/services/PublicKeyService.ts:44](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L44)

***

### putUserProfile()

> **`static`** **putUserProfile**(`ctx`, `ethAddress`, `userAlias`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **ethAddress**: `string`

▪ **userAlias**: `string`

#### Source

[chaincode/src/services/PublicKeyService.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/PublicKeyService.ts#L52)
