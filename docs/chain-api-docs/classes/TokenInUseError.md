**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenInUseError

# Class: TokenInUseError

## Contents

- [Extends](TokenInUseError.md#extends)
- [Constructors](TokenInUseError.md#constructors)
  - [new TokenInUseError(owner, tokenClass, instanceId)](TokenInUseError.md#new-tokeninuseerrorowner-tokenclass-instanceid)
- [Properties](TokenInUseError.md#properties)
  - [code](TokenInUseError.md#code)
  - [key](TokenInUseError.md#key)
  - [message](TokenInUseError.md#message)
  - [name](TokenInUseError.md#name)
  - [payload](TokenInUseError.md#payload)
  - [stack](TokenInUseError.md#stack)
- [Methods](TokenInUseError.md#methods)
  - [andExec()](TokenInUseError.md#andexec)
  - [logError()](TokenInUseError.md#logerror)
  - [logWarn()](TokenInUseError.md#logwarn)
  - [map()](TokenInUseError.md#map)
  - [matches()](TokenInUseError.md#matches)

## Extends

- [`ValidationFailedError`](ValidationFailedError.md)

## Constructors

### new TokenInUseError(owner, tokenClass, instanceId)

> **new TokenInUseError**(`owner`, `tokenClass`, `instanceId`): [`TokenInUseError`](TokenInUseError.md)

#### Parameters

▪ **owner**: `string`

▪ **tokenClass**: [`TokenClassKeyProperties`](../interfaces/TokenClassKeyProperties.md)

▪ **instanceId**: `BigNumber`

#### Overrides

[`ValidationFailedError`](ValidationFailedError.md).[`constructor`](ValidationFailedError.md#constructors)

#### Source

[chain-api/src/types/TokenBalance.ts:71](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L71)

## Properties

### code

> **`readonly`** **code**: [`ErrorCode`](../enumerations/ErrorCode.md)

Status code, a value from ErrorCode enum. It is directly mapped to HTTP,
status, it is a constant value to be used by clients integrating with
the chain.

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`code`](ValidationFailedError.md#code)

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

[`ValidationFailedError`](ValidationFailedError.md).[`key`](ValidationFailedError.md#key)

#### Source

[chain-api/src/utils/error.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L53)

***

### message

> **message**: `string`

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`message`](ValidationFailedError.md#message)

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1076

***

### name

> **name**: `string`

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`name`](ValidationFailedError.md#name)

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1075

***

### payload

> **`readonly`** **payload**?: `Record`\<`string`, `unknown`\>

Additional information to be used by

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`payload`](ValidationFailedError.md#payload)

#### Source

[chain-api/src/utils/error.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L58)

***

### stack

> **stack**?: `string`

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`stack`](ValidationFailedError.md#stack)

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1077

## Methods

### andExec()

> **andExec**(`fn`): [`ChainError`](ChainError.md)

Allows to execute function getting as a parameter the current error.

#### Parameters

▪ **fn**: (`e`) => `void`

#### Returns

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`andExec`](ValidationFailedError.md#andexec)

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

> **logError**(`logger`): [`ChainError`](ChainError.md)

#### Parameters

▪ **logger**: `object`

▪ **logger.error**

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`logError`](ValidationFailedError.md#logerror)

#### Source

[chain-api/src/utils/error.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L119)

***

### logWarn()

> **logWarn**(`logger`): [`ChainError`](ChainError.md)

#### Parameters

▪ **logger**: `object`

▪ **logger.warn**

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`logWarn`](ValidationFailedError.md#logwarn)

#### Source

[chain-api/src/utils/error.ts:124](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L124)

***

### map()

> **map**(`key`, `newError`): [`ChainError`](ChainError.md)

Maps ChainError to another chain error by error code if `key` param matches
current error code or current diagnostic key. Otherwise, returns original
error.

Useful in rethrowing an error or mapping an error to another one in catch
clauses or catch methods in promises.

#### Parameters

▪ **key**: [`ErrorCode`](../enumerations/ErrorCode.md) \| `ClassConstructor`\<[`ChainError`](ChainError.md)\>

error code or error class to match

▪ **newError**: [`ChainError`](ChainError.md) \| (`e`) => [`ChainError`](ChainError.md)

new error or a function to create the new error

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`map`](ValidationFailedError.md#map)

#### Source

[chain-api/src/utils/error.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L148)

***

### matches()

> **matches**(`key`): `boolean`

#### Parameters

▪ **key**: [`ErrorCode`](../enumerations/ErrorCode.md) \| `ClassConstructor`\<[`ChainError`](ChainError.md)\>

#### Inherited from

[`ValidationFailedError`](ValidationFailedError.md).[`matches`](ValidationFailedError.md#matches)

#### Source

[chain-api/src/utils/error.ts:129](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L129)
