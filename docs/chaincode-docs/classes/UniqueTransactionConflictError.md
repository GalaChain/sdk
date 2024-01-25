**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > UniqueTransactionConflictError

# Class: UniqueTransactionConflictError

## Contents

- [Extends](UniqueTransactionConflictError.md#extends)
- [Constructors](UniqueTransactionConflictError.md#constructors)
  - [new UniqueTransactionConflictError(uniqueKey, transactionId)](UniqueTransactionConflictError.md#new-uniquetransactionconflicterroruniquekey-transactionid)
- [Properties](UniqueTransactionConflictError.md#properties)
  - [code](UniqueTransactionConflictError.md#code)
  - [key](UniqueTransactionConflictError.md#key)
  - [message](UniqueTransactionConflictError.md#message)
  - [name](UniqueTransactionConflictError.md#name)
  - [payload](UniqueTransactionConflictError.md#payload)
  - [stack](UniqueTransactionConflictError.md#stack)
- [Methods](UniqueTransactionConflictError.md#methods)
  - [andExec()](UniqueTransactionConflictError.md#andexec)
  - [logError()](UniqueTransactionConflictError.md#logerror)
  - [logWarn()](UniqueTransactionConflictError.md#logwarn)
  - [map()](UniqueTransactionConflictError.md#map)
  - [matches()](UniqueTransactionConflictError.md#matches)

## Extends

- `ConflictError`

## Constructors

### new UniqueTransactionConflictError(uniqueKey, transactionId)

> **new UniqueTransactionConflictError**(`uniqueKey`, `transactionId`): [`UniqueTransactionConflictError`](UniqueTransactionConflictError.md)

#### Parameters

▪ **uniqueKey**: `string`

▪ **transactionId**: `string`

#### Overrides

ConflictError.constructor

#### Source

[chaincode/src/services/UniqueTransactionError.ts:18](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransactionError.ts#L18)

## Properties

### code

> **`readonly`** **code**: `ErrorCode`

Status code, a value from ErrorCode enum. It is directly mapped to HTTP,
status, it is a constant value to be used by clients integrating with
the chain.

#### Inherited from

ConflictError.code

#### Source

[chain-api/src/utils/error.ts:45](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L45)

***

### key

> **`readonly`** **key**: `Uppercase`\<`string`\>

An upper case string to be used as a key do diagnose where the error comes
from and help with regular development. It should not be used by client
integrating with the chain since we don't guarantee it won't change.
It is generated from original error class name.

#### Inherited from

ConflictError.key

#### Source

[chain-api/src/utils/error.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L53)

***

### message

> **message**: `string`

#### Inherited from

ConflictError.message

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1076

***

### name

> **name**: `string`

#### Inherited from

ConflictError.name

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1075

***

### payload

> **`readonly`** **payload**?: `Record`\<`string`, `unknown`\>

Additional information to be used by

#### Inherited from

ConflictError.payload

#### Source

[chain-api/src/utils/error.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L58)

***

### stack

> **stack**?: `string`

#### Inherited from

ConflictError.stack

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1077

## Methods

### andExec()

> **andExec**(`fn`): `ChainError`

Allows to execute function getting as a parameter the current error.

#### Parameters

▪ **fn**: (`e`) => `void`

#### Returns

#### Inherited from

ConflictError.andExec

#### Example

```ts
throw CommonChainError.objectNotFound(objectId).andExec((e) => {
  logger.error(e.message);
});
```

#### Source

[chain-api/src/utils/error.ts:114](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L114)

***

### logError()

> **logError**(`logger`): `ChainError`

#### Parameters

▪ **logger**: `object`

▪ **logger.error**

#### Inherited from

ConflictError.logError

#### Source

[chain-api/src/utils/error.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L119)

***

### logWarn()

> **logWarn**(`logger`): `ChainError`

#### Parameters

▪ **logger**: `object`

▪ **logger.warn**

#### Inherited from

ConflictError.logWarn

#### Source

[chain-api/src/utils/error.ts:124](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L124)

***

### map()

> **map**(`key`, `newError`): `ChainError`

Maps ChainError to another chain error by error code if `key` param matches
current error code or current diagnostic key. Otherwise, returns original
error.

Useful in rethrowing an error or mapping an error to another one in catch
clauses or catch methods in promises.

#### Parameters

▪ **key**: `ErrorCode` \| `ClassConstructor`\<`ChainError`\>

error code or error class to match

▪ **newError**: `ChainError` \| (`e`) => `ChainError`

new error or a function to create the new error

#### Inherited from

ConflictError.map

#### Source

[chain-api/src/utils/error.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L148)

***

### matches()

> **matches**(`key`): `boolean`

#### Parameters

▪ **key**: `ErrorCode` \| `ClassConstructor`\<`ChainError`\>

#### Inherited from

ConflictError.matches

#### Source

[chain-api/src/utils/error.ts:129](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L129)
