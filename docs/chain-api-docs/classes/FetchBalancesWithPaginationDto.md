**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > FetchBalancesWithPaginationDto

# Class: FetchBalancesWithPaginationDto

## Contents

- [Extends](FetchBalancesWithPaginationDto.md#extends)
- [Constructors](FetchBalancesWithPaginationDto.md#constructors)
  - [new FetchBalancesWithPaginationDto()](FetchBalancesWithPaginationDto.md#new-fetchbalanceswithpaginationdto)
- [Properties](FetchBalancesWithPaginationDto.md#properties)
  - [additionalKey](FetchBalancesWithPaginationDto.md#additionalkey)
  - [bookmark](FetchBalancesWithPaginationDto.md#bookmark)
  - [category](FetchBalancesWithPaginationDto.md#category)
  - [collection](FetchBalancesWithPaginationDto.md#collection)
  - [limit](FetchBalancesWithPaginationDto.md#limit)
  - [owner](FetchBalancesWithPaginationDto.md#owner)
  - [signature](FetchBalancesWithPaginationDto.md#signature)
  - [signerPublicKey](FetchBalancesWithPaginationDto.md#signerpublickey)
  - [trace](FetchBalancesWithPaginationDto.md#trace)
  - [type](FetchBalancesWithPaginationDto.md#type)
  - [uniqueKey](FetchBalancesWithPaginationDto.md#uniquekey)
  - [DEFAULT\_LIMIT](FetchBalancesWithPaginationDto.md#default-limit)
  - [ENCODING](FetchBalancesWithPaginationDto.md#encoding)
  - [MAX\_LIMIT](FetchBalancesWithPaginationDto.md#max-limit)
- [Methods](FetchBalancesWithPaginationDto.md#methods)
  - [isSignatureValid()](FetchBalancesWithPaginationDto.md#issignaturevalid)
  - [serialize()](FetchBalancesWithPaginationDto.md#serialize)
  - [sign()](FetchBalancesWithPaginationDto.md#sign)
  - [signed()](FetchBalancesWithPaginationDto.md#signed)
  - [validate()](FetchBalancesWithPaginationDto.md#validate)
  - [validateOrReject()](FetchBalancesWithPaginationDto.md#validateorreject)
  - [deserialize()](FetchBalancesWithPaginationDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new FetchBalancesWithPaginationDto()

> **new FetchBalancesWithPaginationDto**(): [`FetchBalancesWithPaginationDto`](FetchBalancesWithPaginationDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/token.ts:422](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L422)

***

### bookmark

> **bookmark**?: `string`

#### Source

[chain-api/src/types/token.ts:429](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L429)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/token.ts:409](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L409)

***

### collection

> **collection**?: `string`

#### Source

[chain-api/src/types/token.ts:402](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L402)

***

### limit

> **limit**?: `number`

#### Source

[chain-api/src/types/token.ts:441](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L441)

***

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/token.ts:395](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L395)

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

[chain-api/src/types/token.ts:416](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L416)

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

[chain-api/src/types/token.ts:388](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L388)

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

[chain-api/src/types/token.ts:387](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/token.ts#L387)

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

> **signed**(`privateKey`, `useDer`): [`FetchBalancesWithPaginationDto`](FetchBalancesWithPaginationDto.md)

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
