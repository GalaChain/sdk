**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > FetchBalancesDto

# Class: FetchBalancesDto

## Contents

- [Extends](FetchBalancesDto.md#extends)
- [Constructors](FetchBalancesDto.md#constructors)
  - [new FetchBalancesDto()](FetchBalancesDto.md#new-fetchbalancesdto)
- [Properties](FetchBalancesDto.md#properties)
  - [additionalKey](FetchBalancesDto.md#additionalkey)
  - [category](FetchBalancesDto.md#category)
  - [collection](FetchBalancesDto.md#collection)
  - [owner](FetchBalancesDto.md#owner)
  - [signature](FetchBalancesDto.md#signature)
  - [signerPublicKey](FetchBalancesDto.md#signerpublickey)
  - [trace](FetchBalancesDto.md#trace)
  - [type](FetchBalancesDto.md#type)
  - [uniqueKey](FetchBalancesDto.md#uniquekey)
  - [ENCODING](FetchBalancesDto.md#encoding)
- [Methods](FetchBalancesDto.md#methods)
  - [isSignatureValid()](FetchBalancesDto.md#issignaturevalid)
  - [serialize()](FetchBalancesDto.md#serialize)
  - [sign()](FetchBalancesDto.md#sign)
  - [signed()](FetchBalancesDto.md#signed)
  - [validate()](FetchBalancesDto.md#validate)
  - [validateOrReject()](FetchBalancesDto.md#validateorreject)
  - [deserialize()](FetchBalancesDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new FetchBalancesDto()

> **new FetchBalancesDto**(): [`FetchBalancesDto`](FetchBalancesDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/token.ts:380](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L380)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/token.ts:367](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L367)

***

### collection

> **collection**?: `string`

#### Source

[chain-api/src/types/token.ts:360](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L360)

***

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/token.ts:353](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L353)

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

[chain-api/src/types/token.ts:374](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L374)

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

> **signed**(`privateKey`, `useDer`): [`FetchBalancesDto`](FetchBalancesDto.md)

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
