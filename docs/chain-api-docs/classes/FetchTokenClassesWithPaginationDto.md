**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > FetchTokenClassesWithPaginationDto

# Class: FetchTokenClassesWithPaginationDto

## Contents

- [Extends](FetchTokenClassesWithPaginationDto.md#extends)
- [Constructors](FetchTokenClassesWithPaginationDto.md#constructors)
  - [new FetchTokenClassesWithPaginationDto()](FetchTokenClassesWithPaginationDto.md#new-fetchtokenclasseswithpaginationdto)
- [Properties](FetchTokenClassesWithPaginationDto.md#properties)
  - [additionalKey](FetchTokenClassesWithPaginationDto.md#additionalkey)
  - [bookmark](FetchTokenClassesWithPaginationDto.md#bookmark)
  - [category](FetchTokenClassesWithPaginationDto.md#category)
  - [collection](FetchTokenClassesWithPaginationDto.md#collection)
  - [limit](FetchTokenClassesWithPaginationDto.md#limit)
  - [signature](FetchTokenClassesWithPaginationDto.md#signature)
  - [signerPublicKey](FetchTokenClassesWithPaginationDto.md#signerpublickey)
  - [trace](FetchTokenClassesWithPaginationDto.md#trace)
  - [type](FetchTokenClassesWithPaginationDto.md#type)
  - [uniqueKey](FetchTokenClassesWithPaginationDto.md#uniquekey)
  - [DEFAULT\_LIMIT](FetchTokenClassesWithPaginationDto.md#default-limit)
  - [ENCODING](FetchTokenClassesWithPaginationDto.md#encoding)
  - [MAX\_LIMIT](FetchTokenClassesWithPaginationDto.md#max-limit)
- [Methods](FetchTokenClassesWithPaginationDto.md#methods)
  - [isSignatureValid()](FetchTokenClassesWithPaginationDto.md#issignaturevalid)
  - [serialize()](FetchTokenClassesWithPaginationDto.md#serialize)
  - [sign()](FetchTokenClassesWithPaginationDto.md#sign)
  - [signed()](FetchTokenClassesWithPaginationDto.md#signed)
  - [validate()](FetchTokenClassesWithPaginationDto.md#validate)
  - [validateOrReject()](FetchTokenClassesWithPaginationDto.md#validateorreject)
  - [deserialize()](FetchTokenClassesWithPaginationDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new FetchTokenClassesWithPaginationDto()

> **new FetchTokenClassesWithPaginationDto**(): [`FetchTokenClassesWithPaginationDto`](FetchTokenClassesWithPaginationDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/token.ts:87](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L87)

***

### bookmark

> **bookmark**?: `string`

#### Source

[chain-api/src/types/token.ts:94](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L94)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/token.ts:73](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L73)

***

### collection

> **collection**?: `string`

#### Source

[chain-api/src/types/token.ts:66](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L66)

***

### limit

> **limit**?: `number`

#### Source

[chain-api/src/types/token.ts:106](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L106)

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

[chain-api/src/types/token.ts:80](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L80)

***

### uniqueKey

> **uniqueKey**?: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`uniqueKey`](ChainCallDTO.md#uniquekey)

#### Source

[chain-api/src/types/dtos.ts:114](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L114)

***

### DEFAULT\_LIMIT

> **`static`** **`readonly`** **DEFAULT\_LIMIT**: `1000` = `1000`

#### Source

[chain-api/src/types/token.ts:59](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L59)

***

### ENCODING

> **`static`** **`readonly`** **ENCODING**: `"base64"` = `"base64"`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`ENCODING`](ChainCallDTO.md#encoding)

#### Source

[chain-api/src/types/dtos.ts:100](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L100)

***

### MAX\_LIMIT

> **`static`** **`readonly`** **MAX\_LIMIT**: `number`

#### Source

[chain-api/src/types/token.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L58)

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

> **signed**(`privateKey`, `useDer`): [`FetchTokenClassesWithPaginationDto`](FetchTokenClassesWithPaginationDto.md)

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
