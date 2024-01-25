**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > InsufficientBurnAllowanceError

# Class: InsufficientBurnAllowanceError

## Contents

- [Extends](InsufficientBurnAllowanceError.md#extends)
- [Constructors](InsufficientBurnAllowanceError.md#constructors)
  - [new InsufficientBurnAllowanceError(user, allowedQuantity, quantity, tokenInstanceKey, toPersonKey)](InsufficientBurnAllowanceError.md#new-insufficientburnallowanceerroruser-allowedquantity-quantity-tokeninstancekey-topersonkey)
- [Properties](InsufficientBurnAllowanceError.md#properties)
  - [code](InsufficientBurnAllowanceError.md#code)
  - [key](InsufficientBurnAllowanceError.md#key)
  - [message](InsufficientBurnAllowanceError.md#message)
  - [name](InsufficientBurnAllowanceError.md#name)
  - [payload](InsufficientBurnAllowanceError.md#payload)
  - [stack](InsufficientBurnAllowanceError.md#stack)
- [Methods](InsufficientBurnAllowanceError.md#methods)
  - [andExec()](InsufficientBurnAllowanceError.md#andexec)
  - [logError()](InsufficientBurnAllowanceError.md#logerror)
  - [logWarn()](InsufficientBurnAllowanceError.md#logwarn)
  - [map()](InsufficientBurnAllowanceError.md#map)
  - [matches()](InsufficientBurnAllowanceError.md#matches)

## Extends

- [`InsufficientAllowanceError`](InsufficientAllowanceError.md)

## Constructors

### new InsufficientBurnAllowanceError(user, allowedQuantity, quantity, tokenInstanceKey, toPersonKey)

> **new InsufficientBurnAllowanceError**(`user`, `allowedQuantity`, `quantity`, `tokenInstanceKey`, `toPersonKey`): [`InsufficientBurnAllowanceError`](InsufficientBurnAllowanceError.md)

#### Parameters

▪ **user**: `string`

▪ **allowedQuantity**: `BigNumber`

▪ **quantity**: `BigNumber`

▪ **tokenInstanceKey**: `TokenInstanceKey`

▪ **toPersonKey**: `string`

#### Overrides

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`constructor`](InsufficientAllowanceError.md#constructors)

#### Source

[chaincode/src/burns/BurnError.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/burns/BurnError.ts#L43)

## Properties

### code

> **`readonly`** **code**: `ErrorCode`

Status code, a value from ErrorCode enum. It is directly mapped to HTTP,
status, it is a constant value to be used by clients integrating with
the chain.

#### Inherited from

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`code`](InsufficientAllowanceError.md#code)

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

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`key`](InsufficientAllowanceError.md#key)

#### Source

[chain-api/src/utils/error.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L53)

***

### message

> **message**: `string`

#### Inherited from

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`message`](InsufficientAllowanceError.md#message)

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1076

***

### name

> **name**: `string`

#### Inherited from

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`name`](InsufficientAllowanceError.md#name)

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1075

***

### payload

> **`readonly`** **payload**?: `Record`\<`string`, `unknown`\>

Additional information to be used by

#### Inherited from

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`payload`](InsufficientAllowanceError.md#payload)

#### Source

[chain-api/src/utils/error.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L58)

***

### stack

> **stack**?: `string`

#### Inherited from

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`stack`](InsufficientAllowanceError.md#stack)

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

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`andExec`](InsufficientAllowanceError.md#andexec)

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

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`logError`](InsufficientAllowanceError.md#logerror)

#### Source

[chain-api/src/utils/error.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L119)

***

### logWarn()

> **logWarn**(`logger`): `ChainError`

#### Parameters

▪ **logger**: `object`

▪ **logger.warn**

#### Inherited from

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`logWarn`](InsufficientAllowanceError.md#logwarn)

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

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`map`](InsufficientAllowanceError.md#map)

#### Source

[chain-api/src/utils/error.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L148)

***

### matches()

> **matches**(`key`): `boolean`

#### Parameters

▪ **key**: `ErrorCode` \| `ClassConstructor`\<`ChainError`\>

#### Inherited from

[`InsufficientAllowanceError`](InsufficientAllowanceError.md).[`matches`](InsufficientAllowanceError.md#matches)

#### Source

[chain-api/src/utils/error.ts:129](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L129)
