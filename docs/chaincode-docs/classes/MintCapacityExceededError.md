**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > MintCapacityExceededError

# Class: MintCapacityExceededError

## Contents

- [Extends](MintCapacityExceededError.md#extends)
- [Constructors](MintCapacityExceededError.md#constructors)
  - [new MintCapacityExceededError(tokenClassKey, maxCapacity, quantity)](MintCapacityExceededError.md#new-mintcapacityexceedederrortokenclasskey-maxcapacity-quantity)
- [Properties](MintCapacityExceededError.md#properties)
  - [code](MintCapacityExceededError.md#code)
  - [key](MintCapacityExceededError.md#key)
  - [message](MintCapacityExceededError.md#message)
  - [name](MintCapacityExceededError.md#name)
  - [payload](MintCapacityExceededError.md#payload)
  - [stack](MintCapacityExceededError.md#stack)
- [Methods](MintCapacityExceededError.md#methods)
  - [andExec()](MintCapacityExceededError.md#andexec)
  - [logError()](MintCapacityExceededError.md#logerror)
  - [logWarn()](MintCapacityExceededError.md#logwarn)
  - [map()](MintCapacityExceededError.md#map)
  - [matches()](MintCapacityExceededError.md#matches)

## Extends

- `ValidationFailedError`

## Constructors

### new MintCapacityExceededError(tokenClassKey, maxCapacity, quantity)

> **new MintCapacityExceededError**(`tokenClassKey`, `maxCapacity`, `quantity`): [`MintCapacityExceededError`](MintCapacityExceededError.md)

#### Parameters

▪ **tokenClassKey**: `string`

▪ **maxCapacity**: `BigNumber`

▪ **quantity**: `BigNumber`

#### Overrides

ValidationFailedError.constructor

#### Source

[chaincode/src/allowances/AllowanceError.ts:90](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/allowances/AllowanceError.ts#L90)

## Properties

### code

> **`readonly`** **code**: `ErrorCode`

Status code, a value from ErrorCode enum. It is directly mapped to HTTP,
status, it is a constant value to be used by clients integrating with
the chain.

#### Inherited from

ValidationFailedError.code

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

ValidationFailedError.key

#### Source

[chain-api/src/utils/error.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L53)

***

### message

> **message**: `string`

#### Inherited from

ValidationFailedError.message

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1076

***

### name

> **name**: `string`

#### Inherited from

ValidationFailedError.name

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1075

***

### payload

> **`readonly`** **payload**?: `Record`\<`string`, `unknown`\>

Additional information to be used by

#### Inherited from

ValidationFailedError.payload

#### Source

[chain-api/src/utils/error.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L58)

***

### stack

> **stack**?: `string`

#### Inherited from

ValidationFailedError.stack

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

ValidationFailedError.andExec

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

ValidationFailedError.logError

#### Source

[chain-api/src/utils/error.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L119)

***

### logWarn()

> **logWarn**(`logger`): `ChainError`

#### Parameters

▪ **logger**: `object`

▪ **logger.warn**

#### Inherited from

ValidationFailedError.logWarn

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

ValidationFailedError.map

#### Source

[chain-api/src/utils/error.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L148)

***

### matches()

> **matches**(`key`): `boolean`

#### Parameters

▪ **key**: `ErrorCode` \| `ClassConstructor`\<`ChainError`\>

#### Inherited from

ValidationFailedError.matches

#### Source

[chain-api/src/utils/error.ts:129](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L129)
