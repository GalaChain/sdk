**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > GalaChainResponse

# Class: `abstract` GalaChainResponse`<T>`

## Contents

- [Extended By](GalaChainResponse.md#extended-by)
- [Type parameters](GalaChainResponse.md#type-parameters)
- [Constructors](GalaChainResponse.md#constructors)
  - [new GalaChainResponse()](GalaChainResponse.md#new-galachainresponse)
- [Properties](GalaChainResponse.md#properties)
  - [Data](GalaChainResponse.md#data)
  - [ErrorCode](GalaChainResponse.md#errorcode)
  - [ErrorKey](GalaChainResponse.md#errorkey)
  - [ErrorPayload](GalaChainResponse.md#errorpayload)
  - [Message](GalaChainResponse.md#message)
  - [Status](GalaChainResponse.md#status)
- [Methods](GalaChainResponse.md#methods)
  - [Error()](GalaChainResponse.md#error)
  - [Success()](GalaChainResponse.md#success)
  - [Wrap()](GalaChainResponse.md#wrap)
  - [deserialize()](GalaChainResponse.md#deserialize)
  - [isError()](GalaChainResponse.md#iserror)
  - [isSuccess()](GalaChainResponse.md#issuccess)

## Extended By

- [`GalaChainErrorResponse`](GalaChainErrorResponse.md)
- [`GalaChainSuccessResponse`](GalaChainSuccessResponse.md)

## Type parameters

▪ **T**

## Constructors

### new GalaChainResponse()

> **new GalaChainResponse**\<`T`\>(): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

## Properties

### Data

> **`readonly`** **Data**?: `T`

#### Source

[chain-api/src/types/contract.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L31)

***

### ErrorCode

> **`readonly`** **ErrorCode**?: `number`

#### Source

[chain-api/src/types/contract.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L28)

***

### ErrorKey

> **`readonly`** **ErrorKey**?: `string`

#### Source

[chain-api/src/types/contract.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L29)

***

### ErrorPayload

> **`readonly`** **ErrorPayload**?: `unknown`

#### Source

[chain-api/src/types/contract.ts:30](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L30)

***

### Message

> **`readonly`** **Message**?: `string`

#### Source

[chain-api/src/types/contract.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L27)

***

### Status

> **`readonly`** **Status**: [`GalaChainResponseType`](../enumerations/GalaChainResponseType.md)

#### Source

[chain-api/src/types/contract.ts:26](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L26)

## Methods

### Error()

#### Error(e)

> **`static`** **Error**\<`T`\>(`e`): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

##### Type parameters

▪ **T**

##### Parameters

▪ **e**: `object`

▪ **e.message?**: `string`

##### Source

[chain-api/src/types/contract.ts:35](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L35)

#### Error(e)

> **`static`** **Error**\<`T`\>(`e`): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

##### Type parameters

▪ **T**

##### Parameters

▪ **e**: [`ChainError`](ChainError.md)

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

##### Source

[chain-api/src/types/contract.ts:37](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L37)

***

### Success()

> **`static`** **Success**\<`T`\>(`Data`): [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

#### Type parameters

▪ **T**

#### Parameters

▪ **Data**: `T`

#### Source

[chain-api/src/types/contract.ts:32](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L32)

***

### Wrap()

> **`static`** **Wrap**\<`T`\>(`op`): `Promise`\<[`GalaChainResponse`](GalaChainResponse.md)\<`T`\>\>

#### Type parameters

▪ **T**

#### Parameters

▪ **op**: `Promise`\<`T`\>

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

#### Source

[chain-api/src/types/contract.ts:71](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L71)

***

### isError()

> **`static`** **isError**\<`T`\>(`r`): `r is GalaChainErrorResponse<T>`

#### Type parameters

▪ **T**

#### Parameters

▪ **r**: [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

#### Source

[chain-api/src/types/contract.ts:67](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L67)

***

### isSuccess()

> **`static`** **isSuccess**\<`T`\>(`r`): `r is GalaChainSuccessResponse<T>`

#### Type parameters

▪ **T**

#### Parameters

▪ **r**: [`GalaChainResponse`](GalaChainResponse.md)\<`T`\>

#### Source

[chain-api/src/types/contract.ts:63](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/contract.ts#L63)
