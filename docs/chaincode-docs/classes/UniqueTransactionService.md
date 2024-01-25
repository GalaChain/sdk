**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > UniqueTransactionService

# Class: UniqueTransactionService

## Contents

- [Constructors](UniqueTransactionService.md#constructors)
  - [new UniqueTransactionService()](UniqueTransactionService.md#new-uniquetransactionservice)
- [Properties](UniqueTransactionService.md#properties)
  - [UT\_INDEX\_KEY](UniqueTransactionService.md#ut-index-key)
- [Methods](UniqueTransactionService.md#methods)
  - [ensureUniqueKey()](UniqueTransactionService.md#ensureuniquekey)
  - [ensureUniqueTransaction()](UniqueTransactionService.md#ensureuniquetransaction)
  - [getUniqueTransactionKey()](UniqueTransactionService.md#getuniquetransactionkey)
  - [putUniqueTransaction()](UniqueTransactionService.md#putuniquetransaction)

## Constructors

### new UniqueTransactionService()

> **new UniqueTransactionService**(): [`UniqueTransactionService`](UniqueTransactionService.md)

## Properties

### UT\_INDEX\_KEY

> **`static`** **`private`** **UT\_INDEX\_KEY**: `string` = `UniqueTransaction.INDEX_KEY`

#### Source

[chaincode/src/services/UniqueTransactionService.ts:24](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransactionService.ts#L24)

## Methods

### ensureUniqueKey()

> **`static`** **`private`** **ensureUniqueKey**(`ctx`, `uniqueKey`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **uniqueKey**: `string`

#### Source

[chaincode/src/services/UniqueTransactionService.ts:38](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransactionService.ts#L38)

***

### ensureUniqueTransaction()

> **`static`** **ensureUniqueTransaction**(`ctx`, `uniqueKey`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **uniqueKey**: `string`

#### Source

[chaincode/src/services/UniqueTransactionService.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransactionService.ts#L53)

***

### getUniqueTransactionKey()

> **`static`** **`private`** **getUniqueTransactionKey**(`ctx`, `uniqueKey`): `string`

#### Parameters

▪ **ctx**: `Context`

▪ **uniqueKey**: `string`

#### Source

[chaincode/src/services/UniqueTransactionService.ts:26](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransactionService.ts#L26)

***

### putUniqueTransaction()

> **`static`** **`private`** **putUniqueTransaction**(`ctx`, `uniqueKey`): `Promise`\<`void`\>

#### Parameters

▪ **ctx**: [`GalaChainContext`](GalaChainContext.md)

▪ **uniqueKey**: `string`

#### Source

[chaincode/src/services/UniqueTransactionService.ts:30](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransactionService.ts#L30)
