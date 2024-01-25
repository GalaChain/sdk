**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > ObjectNotFoundError

# Class: ObjectNotFoundError

## Contents

- [Extends](ObjectNotFoundError.md#extends)
- [Constructors](ObjectNotFoundError.md#constructors)
  - [new ObjectNotFoundError(objectId)](ObjectNotFoundError.md#new-objectnotfounderrorobjectid)
- [Properties](ObjectNotFoundError.md#properties)
  - [code](ObjectNotFoundError.md#code)
  - [key](ObjectNotFoundError.md#key)
  - [message](ObjectNotFoundError.md#message)
  - [name](ObjectNotFoundError.md#name)
  - [payload](ObjectNotFoundError.md#payload)
  - [stack](ObjectNotFoundError.md#stack)
- [Methods](ObjectNotFoundError.md#methods)
  - [andExec()](ObjectNotFoundError.md#andexec)
  - [logError()](ObjectNotFoundError.md#logerror)
  - [logWarn()](ObjectNotFoundError.md#logwarn)
  - [map()](ObjectNotFoundError.md#map)
  - [matches()](ObjectNotFoundError.md#matches)

## Extends

- `NotFoundError`

## Constructors

### new ObjectNotFoundError(objectId)

> **new ObjectNotFoundError**(`objectId`): [`ObjectNotFoundError`](ObjectNotFoundError.md)

#### Parameters

▪ **objectId**: `string`

#### Overrides

NotFoundError.constructor

#### Source

[chaincode/src/utils/state.ts:34](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/utils/state.ts#L34)

## Properties

### code

> **`readonly`** **code**: `ErrorCode`

Status code, a value from ErrorCode enum. It is directly mapped to HTTP,
status, it is a constant value to be used by clients integrating with
the chain.

#### Inherited from

NotFoundError.code

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

NotFoundError.key

#### Source

[chain-api/src/utils/error.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L53)

***

### message

> **message**: `string`

#### Inherited from

NotFoundError.message

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1076

***

### name

> **name**: `string`

#### Inherited from

NotFoundError.name

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1075

***

### payload

> **`readonly`** **payload**?: `Record`\<`string`, `unknown`\>

Additional information to be used by

#### Inherited from

NotFoundError.payload

#### Source

[chain-api/src/utils/error.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L58)

***

### stack

> **stack**?: `string`

#### Inherited from

NotFoundError.stack

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

NotFoundError.andExec

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

NotFoundError.logError

#### Source

[chain-api/src/utils/error.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L119)

***

### logWarn()

> **logWarn**(`logger`): `ChainError`

#### Parameters

▪ **logger**: `object`

▪ **logger.warn**

#### Inherited from

NotFoundError.logWarn

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

NotFoundError.map

#### Source

[chain-api/src/utils/error.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L148)

***

### matches()

> **matches**(`key`): `boolean`

#### Parameters

▪ **key**: `ErrorCode` \| `ClassConstructor`\<`ChainError`\>

#### Inherited from

NotFoundError.matches

#### Source

[chain-api/src/utils/error.ts:129](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L129)
