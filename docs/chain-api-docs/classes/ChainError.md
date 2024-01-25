**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > ChainError

# Class: `abstract` ChainError

## Contents

- [Extends](ChainError.md#extends)
- [Implements](ChainError.md#implements)
- [Constructors](ChainError.md#constructors)
  - [new ChainError(message)](ChainError.md#new-chainerrormessage)
  - [new ChainError(message, key)](ChainError.md#new-chainerrormessage-key)
  - [new ChainError(message, key, payload)](ChainError.md#new-chainerrormessage-key-payload)
  - [new ChainError(message, payload)](ChainError.md#new-chainerrormessage-payload)
- [Properties](ChainError.md#properties)
  - [code](ChainError.md#code)
  - [key](ChainError.md#key)
  - [message](ChainError.md#message)
  - [name](ChainError.md#name)
  - [payload](ChainError.md#payload)
  - [stack](ChainError.md#stack)
  - [prepareStackTrace](ChainError.md#preparestacktrace)
  - [stackTraceLimit](ChainError.md#stacktracelimit)
- [Methods](ChainError.md#methods)
  - [andExec()](ChainError.md#andexec)
  - [logError()](ChainError.md#logerror)
  - [logWarn()](ChainError.md#logwarn)
  - [map()](ChainError.md#map)
  - [matches()](ChainError.md#matches)
  - [captureStackTrace()](ChainError.md#capturestacktrace)
  - [from()](ChainError.md#from)
  - [isChainError()](ChainError.md#ischainerror)
  - [map()](ChainError.md#map-1)
  - [matches()](ChainError.md#matches-1)
  - [normalizedKey()](ChainError.md#normalizedkey)
  - [withCode()](ChainError.md#withcode)

## Extends

- `Error`

## Implements

- [`OptionalChainErrorData`](../interfaces/OptionalChainErrorData.md)

## Constructors

### new ChainError(message)

> **new ChainError**(`message`): [`ChainError`](ChainError.md)

#### Parameters

▪ **message**: `string`

#### Overrides

Error.constructor

#### Source

[chain-api/src/utils/error.ts:59](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L59)

### new ChainError(message, key)

> **new ChainError**(`message`, `key`): [`ChainError`](ChainError.md)

#### Parameters

▪ **message**: `string`

▪ **key**: `Uppercase`\<`string`\>

#### Overrides

Error.constructor

#### Source

[chain-api/src/utils/error.ts:60](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L60)

### new ChainError(message, key, payload)

> **new ChainError**(`message`, `key`, `payload`): [`ChainError`](ChainError.md)

#### Parameters

▪ **message**: `string`

▪ **key**: `Uppercase`\<`string`\>

▪ **payload**: `Record`\<`string`, `unknown`\>

#### Overrides

Error.constructor

#### Source

[chain-api/src/utils/error.ts:61](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L61)

### new ChainError(message, payload)

> **new ChainError**(`message`, `payload`): [`ChainError`](ChainError.md)

#### Parameters

▪ **message**: `string`

▪ **payload**: `unknown`

#### Overrides

Error.constructor

#### Source

[chain-api/src/utils/error.ts:62](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L62)

## Properties

### code

> **`readonly`** **code**: [`ErrorCode`](../enumerations/ErrorCode.md)

Status code, a value from ErrorCode enum. It is directly mapped to HTTP,
status, it is a constant value to be used by clients integrating with
the chain.

#### Implementation of

[`OptionalChainErrorData`](../interfaces/OptionalChainErrorData.md).[`code`](../interfaces/OptionalChainErrorData.md#code)

#### Source

[chain-api/src/utils/error.ts:45](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L45)

***

### key

> **`readonly`** **key**: `Uppercase`\<`string`\>

An upper case string to be used as a key do diagnose where the error comes
from and help with regular development. It should not be used by client
integrating with the chain since we don't guarantee it won't change.
It is generated from original error class name.

#### Implementation of

[`OptionalChainErrorData`](../interfaces/OptionalChainErrorData.md).[`key`](../interfaces/OptionalChainErrorData.md#key)

#### Source

[chain-api/src/utils/error.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L53)

***

### message

> **message**: `string`

#### Implementation of

[`OptionalChainErrorData`](../interfaces/OptionalChainErrorData.md).[`message`](../interfaces/OptionalChainErrorData.md#message)

#### Inherited from

Error.message

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1076

***

### name

> **name**: `string`

#### Inherited from

Error.name

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1075

***

### payload

> **`readonly`** **payload**?: `Record`\<`string`, `unknown`\>

Additional information to be used by

#### Implementation of

[`OptionalChainErrorData`](../interfaces/OptionalChainErrorData.md).[`payload`](../interfaces/OptionalChainErrorData.md#payload)

#### Source

[chain-api/src/utils/error.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L58)

***

### stack

> **stack**?: `string`

#### Inherited from

Error.stack

#### Source

node\_modules/typescript/lib/lib.es5.d.ts:1077

***

### prepareStackTrace

> **`static`** **prepareStackTrace**?: (`err`, `stackTraces`) => `any`

Optional override for formatting stack traces

#### Parameters

▪ **err**: `Error`

▪ **stackTraces**: `CallSite`[]

#### Returns

#### See

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

Error.prepareStackTrace

#### Source

node\_modules/@types/node/globals.d.ts:11

***

### stackTraceLimit

> **`static`** **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Source

node\_modules/@types/node/globals.d.ts:13

## Methods

### andExec()

> **andExec**(`fn`): [`ChainError`](ChainError.md)

Allows to execute function getting as a parameter the current error.

#### Parameters

▪ **fn**: (`e`) => `void`

#### Returns

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

#### Source

[chain-api/src/utils/error.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L119)

***

### logWarn()

> **logWarn**(`logger`): [`ChainError`](ChainError.md)

#### Parameters

▪ **logger**: `object`

▪ **logger.warn**

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

#### Source

[chain-api/src/utils/error.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L148)

***

### matches()

> **matches**(`key`): `boolean`

#### Parameters

▪ **key**: [`ErrorCode`](../enumerations/ErrorCode.md) \| `ClassConstructor`\<[`ChainError`](ChainError.md)\>

#### Source

[chain-api/src/utils/error.ts:129](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L129)

***

### captureStackTrace()

> **`static`** **captureStackTrace**(`targetObject`, `constructorOpt`?): `void`

Create .stack property on a target object

#### Parameters

▪ **targetObject**: `object`

▪ **constructorOpt?**: `Function`

#### Inherited from

Error.captureStackTrace

#### Source

node\_modules/@types/node/globals.d.ts:4

***

### from()

> **`static`** **from**(`e`): [`ChainError`](ChainError.md)

#### Parameters

▪ **e**: `object` & `object`

#### Source

[chain-api/src/utils/error.ts:168](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L168)

***

### isChainError()

> **`static`** **isChainError**(`e`): `e is ChainError`

#### Parameters

▪ **e**: `undefined` \| `object`

#### Source

[chain-api/src/utils/error.ts:164](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L164)

***

### map()

> **`static`** **map**(`e`, `key`, `newError`): [`ChainError`](ChainError.md)

Maps ChainError to another chain error by error code, or returns original
error if no error code matches, or returns default chain error if a given
parameter is not a ChainError instance.

Useful in rethrowing an error or mapping an error to another one in catch
clauses or catch methods in promises.

#### Parameters

▪ **e**: [`ChainError`](ChainError.md) \| `object`

original error

▪ **key**: [`ErrorCode`](../enumerations/ErrorCode.md) \| `ClassConstructor`\<[`ChainError`](ChainError.md)\>

error code or error class to match

▪ **newError**: [`ChainError`](ChainError.md) \| (`e`) => [`ChainError`](ChainError.md)

new error or a function to create the new error

#### Source

[chain-api/src/utils/error.ts:191](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L191)

***

### matches()

> **`static`** **matches**(`e`, `key`): `boolean`

#### Parameters

▪ **e**: [`ChainError`](ChainError.md) \| `object`

▪ **key**: [`ErrorCode`](../enumerations/ErrorCode.md) \| `ClassConstructor`\<[`ChainError`](ChainError.md)\>

#### Source

[chain-api/src/utils/error.ts:172](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L172)

***

### normalizedKey()

> **`static`** **normalizedKey**(`fn`): `Uppercase`\<`string`\>

#### Parameters

▪ **fn**: `string` \| `Function`

#### Source

[chain-api/src/utils/error.ts:80](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L80)

***

### withCode()

> **`static`** **withCode**(`code`): `ClassConstructor`\<[`ChainError`](ChainError.md)\>

#### Parameters

▪ **code**: [`ErrorCode`](../enumerations/ErrorCode.md)

#### Source

[chain-api/src/utils/error.ts:98](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/error.ts#L98)
