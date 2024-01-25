**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > ConflictError

# Class: ConflictError

## Contents

- [Extends](ConflictError.md#extends)
- [Constructors](ConflictError.md#constructors)
  - [new ConflictError(args)](ConflictError.md#new-conflicterrorargs)
- [Properties](ConflictError.md#properties)
  - [code](ConflictError.md#code)
  - [key](ConflictError.md#key)
  - [message](ConflictError.md#message)
  - [name](ConflictError.md#name)
  - [payload](ConflictError.md#payload)
  - [stack](ConflictError.md#stack)
- [Methods](ConflictError.md#methods)
  - [andExec()](ConflictError.md#andexec)
  - [logError()](ConflictError.md#logerror)
  - [logWarn()](ConflictError.md#logwarn)
  - [map()](ConflictError.md#map)
  - [matches()](ConflictError.md#matches)

## Extends

- [`ChainError`](ChainError.md)\<`this`\>

## Constructors

### new ConflictError(args)

> **new ConflictError**(...`args`): [`ConflictError`](ConflictError.md)

#### Parameters

▪ ...**args**: `unknown`[]

#### Inherited from

[`ChainError`](ChainError.md).[`constructor`](ChainError.md#constructors)

#### Source

[chain-api/src/utils/error.ts:17](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L17)

## Properties

### code

> **`readonly`** **code**: [`ErrorCode`](../enumerations/ErrorCode.md)

Status code, a value from ErrorCode enum. It is directly mapped to HTTP,
status, it is a constant value to be used by clients integrating with
the chain.

#### Inherited from

[`ChainError`](ChainError.md).[`code`](ChainError.md#code)

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

[`ChainError`](ChainError.md).[`key`](ChainError.md#key)

#### Source

[chain-api/src/utils/error.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L53)

***

### message

> **message**: `string`

#### Inherited from

[`ChainError`](ChainError.md).[`message`](ChainError.md#message)

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1076

***

### name

> **name**: `string`

#### Inherited from

[`ChainError`](ChainError.md).[`name`](ChainError.md#name)

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1075

***

### payload

> **`readonly`** **payload**?: `Record`\<`string`, `unknown`\>

Additional information to be used by

#### Inherited from

[`ChainError`](ChainError.md).[`payload`](ChainError.md#payload)

#### Source

[chain-api/src/utils/error.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L58)

***

### stack

> **stack**?: `string`

#### Inherited from

[`ChainError`](ChainError.md).[`stack`](ChainError.md#stack)

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

[`ChainError`](ChainError.md).[`andExec`](ChainError.md#andexec)

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

[`ChainError`](ChainError.md).[`logError`](ChainError.md#logerror)

#### Source

[chain-api/src/utils/error.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L119)

***

### logWarn()

> **logWarn**(`logger`): [`ChainError`](ChainError.md)

#### Parameters

▪ **logger**: `object`

▪ **logger.warn**

#### Inherited from

[`ChainError`](ChainError.md).[`logWarn`](ChainError.md#logwarn)

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

[`ChainError`](ChainError.md).[`map`](ChainError.md#map)

#### Source

[chain-api/src/utils/error.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L148)

***

### matches()

> **matches**(`key`): `boolean`

#### Parameters

▪ **key**: [`ErrorCode`](../enumerations/ErrorCode.md) \| `ClassConstructor`\<[`ChainError`](ChainError.md)\>

#### Inherited from

[`ChainError`](ChainError.md).[`matches`](ChainError.md#matches)

#### Source

[chain-api/src/utils/error.ts:129](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L129)
