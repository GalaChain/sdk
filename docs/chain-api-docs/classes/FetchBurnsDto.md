**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > FetchBurnsDto

# Class: FetchBurnsDto

## Contents

- [Extends](FetchBurnsDto.md#extends)
- [Constructors](FetchBurnsDto.md#constructors)
  - [new FetchBurnsDto()](FetchBurnsDto.md#new-fetchburnsdto)
- [Properties](FetchBurnsDto.md#properties)
  - [additionalKey](FetchBurnsDto.md#additionalkey)
  - [burnedBy](FetchBurnsDto.md#burnedby)
  - [category](FetchBurnsDto.md#category)
  - [collection](FetchBurnsDto.md#collection)
  - [created](FetchBurnsDto.md#created)
  - [instance](FetchBurnsDto.md#instance)
  - [signature](FetchBurnsDto.md#signature)
  - [signerPublicKey](FetchBurnsDto.md#signerpublickey)
  - [trace](FetchBurnsDto.md#trace)
  - [type](FetchBurnsDto.md#type)
  - [uniqueKey](FetchBurnsDto.md#uniquekey)
  - [ENCODING](FetchBurnsDto.md#encoding)
- [Methods](FetchBurnsDto.md#methods)
  - [isSignatureValid()](FetchBurnsDto.md#issignaturevalid)
  - [serialize()](FetchBurnsDto.md#serialize)
  - [sign()](FetchBurnsDto.md#sign)
  - [signed()](FetchBurnsDto.md#signed)
  - [validate()](FetchBurnsDto.md#validate)
  - [validateOrReject()](FetchBurnsDto.md#validateorreject)
  - [deserialize()](FetchBurnsDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new FetchBurnsDto()

> **new FetchBurnsDto**(): [`FetchBurnsDto`](FetchBurnsDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/burn.ts:75](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L75)

***

### burnedBy

> **burnedBy**: `string`

#### Source

[chain-api/src/types/burn.ts:47](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L47)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/burn.ts:61](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L61)

***

### collection

> **collection**?: `string`

#### Source

[chain-api/src/types/burn.ts:54](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L54)

***

### created

> **created**?: `number`

#### Source

[chain-api/src/types/burn.ts:90](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L90)

***

### instance

> **instance**?: `string`

#### Source

[chain-api/src/types/burn.ts:82](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L82)

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

### trace

> **trace**?: [`TraceContext`](../interfaces/TraceContext.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`trace`](ChainCallDTO.md#trace)

#### Source

[chain-api/src/types/dtos.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L99)

***

### type

> **type**?: `string`

#### Source

[chain-api/src/types/burn.ts:68](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L68)

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

> **signed**(`privateKey`, `useDer`): [`FetchBurnsDto`](FetchBurnsDto.md)

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
