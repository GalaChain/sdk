**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > GalaChainErrorResponse

# Class: GalaChainErrorResponse`<T>`

## Contents

- [Extends](GalaChainErrorResponse.md#extends)
- [Type parameters](GalaChainErrorResponse.md#type-parameters)
- [Constructors](GalaChainErrorResponse.md#constructors)
  - [new GalaChainErrorResponse(message, errorCode, errorKey, errorPayload)](GalaChainErrorResponse.md#new-galachainerrorresponsemessage-errorcode-errorkey-errorpayload)
  - [new GalaChainErrorResponse(error)](GalaChainErrorResponse.md#new-galachainerrorresponseerror)
  - [new GalaChainErrorResponse(error)](GalaChainErrorResponse.md#new-galachainerrorresponseerror-1)
- [Properties](GalaChainErrorResponse.md#properties)
  - [Data](GalaChainErrorResponse.md#data)
  - [ErrorCode](GalaChainErrorResponse.md#errorcode)
  - [ErrorKey](GalaChainErrorResponse.md#errorkey)
  - [ErrorPayload](GalaChainErrorResponse.md#errorpayload)
  - [Message](GalaChainErrorResponse.md#message)
  - [Status](GalaChainErrorResponse.md#status)
- [Methods](GalaChainErrorResponse.md#methods)
  - [Error()](GalaChainErrorResponse.md#error)
  - [Success()](GalaChainErrorResponse.md#success)
  - [Wrap()](GalaChainErrorResponse.md#wrap)
  - [deserialize()](GalaChainErrorResponse.md#deserialize)
  - [isError()](GalaChainErrorResponse.md#iserror)
  - [isSuccess()](GalaChainErrorResponse.md#issuccess)

## Extends

- [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

## Type parameters

▪ **T**

## Constructors

### new GalaChainErrorResponse(message, errorCode, errorKey, errorPayload)

> **new GalaChainErrorResponse**\<`T`\>(`message`, `errorCode`?, `errorKey`?, `errorPayload`?): [`GalaChainErrorResponse`](GalaChainErrorResponse.md)\<`T`\>

#### Parameters

▪ **message**: `string`

▪ **errorCode?**: `number`

▪ **errorKey?**: `string`

▪ **errorPayload?**: `Record`\<`string`, `unknown`\>

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`constructor`](GalaChainResponse.md#constructors)

#### Source

[chain-api/src/types/contract.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L99)

### new GalaChainErrorResponse(error)

> **new GalaChainErrorResponse**\<`T`\>(`error`): [`GalaChainErrorResponse`](GalaChainErrorResponse.md)\<`T`\>

#### Parameters

▪ **error**: `object`

▪ **error.message?**: `string`

#### Overrides

GalaChainResponse\<T\>.constructor

#### Source

[chain-api/src/types/contract.ts:101](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L101)

### new GalaChainErrorResponse(error)

> **new GalaChainErrorResponse**\<`T`\>(`error`): [`GalaChainErrorResponse`](GalaChainErrorResponse.md)\<`T`\>

#### Parameters

▪ **error**: [`ChainError`](ChainError.md)

#### Overrides

GalaChainResponse\<T\>.constructor

#### Source

[chain-api/src/types/contract.ts:103](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L103)

## Properties

### Data

> **`readonly`** **Data**?: `T`

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`Data`](GalaChainResponse.md#data)

#### Source

[chain-api/src/types/contract.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L31)

***

### ErrorCode

> **`readonly`** **ErrorCode**: `number`

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`ErrorCode`](GalaChainResponse.md#errorcode)

#### Source

[chain-api/src/types/contract.ts:95](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L95)

***

### ErrorKey

> **`readonly`** **ErrorKey**: `string`

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`ErrorKey`](GalaChainResponse.md#errorkey)

#### Source

[chain-api/src/types/contract.ts:96](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L96)

***

### ErrorPayload

> **`readonly`** **ErrorPayload**?: `Record`\<`string`, `unknown`\>

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`ErrorPayload`](GalaChainResponse.md#errorpayload)

#### Source

[chain-api/src/types/contract.ts:97](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L97)

***

### Message

> **`readonly`** **Message**: `string`

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`Message`](GalaChainResponse.md#message)

#### Source

[chain-api/src/types/contract.ts:94](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L94)

***

### Status

> **`readonly`** **Status**: [`Error`](../enumerations/GalaChainResponseType.md#error)

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`Status`](GalaChainResponse.md#status)

#### Source

[chain-api/src/types/contract.ts:93](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L93)

## Methods

### Error()

#### Error(e)

> **`static`** **Error**\<`T`\>(`e`): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

##### Type parameters

▪ **T**

##### Parameters

▪ **e**: `object`

▪ **e.message?**: `string`

##### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`Error`](GalaChainResponse.md#error)

##### Source

[chain-api/src/types/contract.ts:35](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L35)

#### Error(e)

> **`static`** **Error**\<`T`\>(`e`): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

##### Type parameters

▪ **T**

##### Parameters

▪ **e**: [`ChainError`](ChainError.md)

##### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`Error`](GalaChainResponse.md#error)

##### Source

[chain-api/src/types/contract.ts:36](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L36)

#### Error(Message, ErrorCode, ErrorKey, ErrorPayload)

> **`static`** **Error**\<`T`\>(`Message`, `ErrorCode`, `ErrorKey`, `ErrorPayload`?): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

##### Type parameters

▪ **T**

##### Parameters

▪ **Message**: `string`

▪ **ErrorCode**: `number`

▪ **ErrorKey**: `string`

▪ **ErrorPayload?**: `Record`\<`string`, `unknown`\>

##### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`Error`](GalaChainResponse.md#error)

##### Source

[chain-api/src/types/contract.ts:37](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L37)

***

### Success()

> **`static`** **Success**\<`T`\>(`Data`): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

#### Type parameters

▪ **T**

#### Parameters

▪ **Data**: `T`

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`Success`](GalaChainResponse.md#success)

#### Source

[chain-api/src/types/contract.ts:32](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L32)

***

### Wrap()

> **`static`** **Wrap**\<`T`\>(`op`): `Promise`\<[`GalaChainResponse`](GalaChainResponse.md)\<`T`\>\>

#### Type parameters

▪ **T**

#### Parameters

▪ **op**: `Promise`\<`T`\>

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`Wrap`](GalaChainResponse.md#wrap)

#### Source

[chain-api/src/types/contract.ts:57](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L57)

***

### deserialize()

> **`static`** **deserialize**\<`T`\>(`constructor`, `object`): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

#### Type parameters

▪ **T**

#### Parameters

▪ **constructor**: `undefined` \| [`ClassConstructor`](../interfaces/ClassConstructor.md)\<[`Inferred`](../type-aliases/Inferred.md)\<`T`\>\>

▪ **object**: `string` \| `Record`\<`string`, `unknown`\>

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`deserialize`](GalaChainResponse.md#deserialize)

#### Source

[chain-api/src/types/contract.ts:71](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L71)

***

### isError()

> **`static`** **isError**\<`T`\>(`r`): `r is GalaChainErrorResponse<T>`

#### Type parameters

▪ **T**

#### Parameters

▪ **r**: [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`isError`](GalaChainResponse.md#iserror)

#### Source

[chain-api/src/types/contract.ts:67](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L67)

***

### isSuccess()

> **`static`** **isSuccess**\<`T`\>(`r`): `r is GalaChainSuccessResponse<T>`

#### Type parameters

▪ **T**

#### Parameters

▪ **r**: [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`isSuccess`](GalaChainResponse.md#issuccess)

#### Source

[chain-api/src/types/contract.ts:63](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L63)
