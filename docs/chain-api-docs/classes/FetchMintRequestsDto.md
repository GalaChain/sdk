**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > FetchMintRequestsDto

# Class: FetchMintRequestsDto

## Contents

- [Extends](FetchMintRequestsDto.md#extends)
- [Constructors](FetchMintRequestsDto.md#constructors)
  - [new FetchMintRequestsDto()](FetchMintRequestsDto.md#new-fetchmintrequestsdto)
- [Properties](FetchMintRequestsDto.md#properties)
  - [additionalKey](FetchMintRequestsDto.md#additionalkey)
  - [category](FetchMintRequestsDto.md#category)
  - [collection](FetchMintRequestsDto.md#collection)
  - [endTimestamp](FetchMintRequestsDto.md#endtimestamp)
  - [signature](FetchMintRequestsDto.md#signature)
  - [signerPublicKey](FetchMintRequestsDto.md#signerpublickey)
  - [startTimestamp](FetchMintRequestsDto.md#starttimestamp)
  - [trace](FetchMintRequestsDto.md#trace)
  - [type](FetchMintRequestsDto.md#type)
  - [uniqueKey](FetchMintRequestsDto.md#uniquekey)
  - [ENCODING](FetchMintRequestsDto.md#encoding)
- [Methods](FetchMintRequestsDto.md#methods)
  - [isSignatureValid()](FetchMintRequestsDto.md#issignaturevalid)
  - [serialize()](FetchMintRequestsDto.md#serialize)
  - [sign()](FetchMintRequestsDto.md#sign)
  - [signed()](FetchMintRequestsDto.md#signed)
  - [validate()](FetchMintRequestsDto.md#validate)
  - [validateOrReject()](FetchMintRequestsDto.md#validateorreject)
  - [deserialize()](FetchMintRequestsDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new FetchMintRequestsDto()

> **new FetchMintRequestsDto**(): [`FetchMintRequestsDto`](FetchMintRequestsDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/mint.ts:208](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L208)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/mint.ts:196](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L196)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/mint.ts:190](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L190)

***

### endTimestamp

> **endTimestamp**: `number`

#### Source

[chain-api/src/types/mint.ts:214](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L214)

***

### signature

> **signature**?: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signature`](ChainCallDTO.md#signature)

#### Source

[chain-api/src/types/dtos.ts:134](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L134)

***

### signerPublicKey

> **signerPublicKey**?: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signerPublicKey`](ChainCallDTO.md#signerpublickey)

#### Source

[chain-api/src/types/dtos.ts:143](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L143)

***

### startTimestamp

> **startTimestamp**: `number`

#### Source

[chain-api/src/types/mint.ts:211](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L211)

***

### trace

> **trace**?: [`TraceContext`](../interfaces/TraceContext.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`trace`](ChainCallDTO.md#trace)

#### Source

[chain-api/src/types/dtos.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L99)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/mint.ts:202](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L202)

***

### uniqueKey

> **uniqueKey**?: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`uniqueKey`](ChainCallDTO.md#uniquekey)

#### Source

[chain-api/src/types/dtos.ts:114](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L114)

***

### ENCODING

> **`static`** **`readonly`** **ENCODING**: `"base64"` = `"base64"`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`ENCODING`](ChainCallDTO.md#encoding)

#### Source

[chain-api/src/types/dtos.ts:100](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L100)

## Methods

### isSignatureValid()

> **isSignatureValid**(`publicKey`): `boolean`

#### Parameters

▪ **publicKey**: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`isSignatureValid`](ChainCallDTO.md#issignaturevalid)

#### Source

[chain-api/src/types/dtos.ts:185](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L185)

***

### serialize()

> **serialize**(): `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`serialize`](ChainCallDTO.md#serialize)

#### Source

[chain-api/src/types/dtos.ts:157](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L157)

***

### sign()

> **sign**(`privateKey`, `useDer`): `void`

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`sign`](ChainCallDTO.md#sign)

#### Source

[chain-api/src/types/dtos.ts:168](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L168)

***

### signed()

> **signed**(`privateKey`, `useDer`): [`FetchMintRequestsDto`](FetchMintRequestsDto.md)

Creates a signed copy of current object.

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signed`](ChainCallDTO.md#signed)

#### Source

[chain-api/src/types/dtos.ts:179](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L179)

***

### validate()

> **validate**(): `Promise`\<`ValidationError`[]\>

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`validate`](ChainCallDTO.md#validate)

#### Source

[chain-api/src/types/dtos.ts:145](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L145)

***

### validateOrReject()

> **validateOrReject**(): `Promise`\<`void`\>

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`validateOrReject`](ChainCallDTO.md#validateorreject)

#### Source

[chain-api/src/types/dtos.ts:149](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L149)

***

### deserialize()

> **`static`** **deserialize**\<`T`\>(`constructor`, `object`): `T`

#### Type parameters

▪ **T**

#### Parameters

▪ **constructor**: [`ClassConstructor`](../interfaces/ClassConstructor.md)\<[`Inferred`](../type-aliases/Inferred.md)\<`T`, [`ChainCallDTO`](ChainCallDTO.md)\>\>

▪ **object**: `string` \| `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`deserialize`](ChainCallDTO.md#deserialize)

#### Source

[chain-api/src/types/dtos.ts:161](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L161)
