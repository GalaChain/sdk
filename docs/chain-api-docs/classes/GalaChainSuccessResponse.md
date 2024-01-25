**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > GalaChainSuccessResponse

# Class: GalaChainSuccessResponse`<T>`

## Contents

- [Extends](GalaChainSuccessResponse.md#extends)
- [Type parameters](GalaChainSuccessResponse.md#type-parameters)
- [Constructors](GalaChainSuccessResponse.md#constructors)
  - [new GalaChainSuccessResponse(data)](GalaChainSuccessResponse.md#new-galachainsuccessresponsedata)
- [Properties](GalaChainSuccessResponse.md#properties)
  - [Data](GalaChainSuccessResponse.md#data)
  - [ErrorCode](GalaChainSuccessResponse.md#errorcode)
  - [ErrorKey](GalaChainSuccessResponse.md#errorkey)
  - [ErrorPayload](GalaChainSuccessResponse.md#errorpayload)
  - [Message](GalaChainSuccessResponse.md#message)
  - [Status](GalaChainSuccessResponse.md#status)
- [Methods](GalaChainSuccessResponse.md#methods)
  - [Error()](GalaChainSuccessResponse.md#error)
  - [Success()](GalaChainSuccessResponse.md#success)
  - [Wrap()](GalaChainSuccessResponse.md#wrap)
  - [deserialize()](GalaChainSuccessResponse.md#deserialize)
  - [isError()](GalaChainSuccessResponse.md#iserror)
  - [isSuccess()](GalaChainSuccessResponse.md#issuccess)

## Extends

- [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

## Type parameters

▪ **T**

## Constructors

### new GalaChainSuccessResponse(data)

> **new GalaChainSuccessResponse**\<`T`\>(`data`): [`GalaChainSuccessResponse`](GalaChainSuccessResponse.md)\<`T`\>

#### Parameters

▪ **data**: `T`

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`constructor`](GalaChainResponse.md#constructors)

#### Source

[chain-api/src/types/contract.ts:132](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L132)

## Properties

### Data

> **`readonly`** **Data**: `T`

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`Data`](GalaChainResponse.md#data)

#### Source

[chain-api/src/types/contract.ts:131](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L131)

***

### ErrorCode

> **`readonly`** **ErrorCode**?: `number`

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`ErrorCode`](GalaChainResponse.md#errorcode)

#### Source

[chain-api/src/types/contract.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L28)

***

### ErrorKey

> **`readonly`** **ErrorKey**?: `string`

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`ErrorKey`](GalaChainResponse.md#errorkey)

#### Source

[chain-api/src/types/contract.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L29)

***

### ErrorPayload

> **`readonly`** **ErrorPayload**?: `unknown`

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`ErrorPayload`](GalaChainResponse.md#errorpayload)

#### Source

[chain-api/src/types/contract.ts:30](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L30)

***

### Message

> **`readonly`** **Message**?: `string`

#### Inherited from

[`GalaChainResponse`](GalaChainResponse.md).[`Message`](GalaChainResponse.md#message)

#### Source

[chain-api/src/types/contract.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L27)

***

### Status

> **`readonly`** **Status**: [`Success`](../enumerations/GalaChainResponseType.md#success)

#### Overrides

[`GalaChainResponse`](GalaChainResponse.md).[`Status`](GalaChainResponse.md#status)

#### Source

[chain-api/src/types/contract.ts:130](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L130)

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
