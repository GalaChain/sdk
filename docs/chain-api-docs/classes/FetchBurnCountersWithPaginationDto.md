**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > FetchBurnCountersWithPaginationDto

# Class: FetchBurnCountersWithPaginationDto

## Contents

- [Extends](FetchBurnCountersWithPaginationDto.md#extends)
- [Constructors](FetchBurnCountersWithPaginationDto.md#constructors)
  - [new FetchBurnCountersWithPaginationDto()](FetchBurnCountersWithPaginationDto.md#new-fetchburncounterswithpaginationdto)
- [Properties](FetchBurnCountersWithPaginationDto.md#properties)
  - [additionalKey](FetchBurnCountersWithPaginationDto.md#additionalkey)
  - [bookmark](FetchBurnCountersWithPaginationDto.md#bookmark)
  - [category](FetchBurnCountersWithPaginationDto.md#category)
  - [collection](FetchBurnCountersWithPaginationDto.md#collection)
  - [limit](FetchBurnCountersWithPaginationDto.md#limit)
  - [signature](FetchBurnCountersWithPaginationDto.md#signature)
  - [signerPublicKey](FetchBurnCountersWithPaginationDto.md#signerpublickey)
  - [trace](FetchBurnCountersWithPaginationDto.md#trace)
  - [type](FetchBurnCountersWithPaginationDto.md#type)
  - [uniqueKey](FetchBurnCountersWithPaginationDto.md#uniquekey)
  - [DEFAULT\_LIMIT](FetchBurnCountersWithPaginationDto.md#default-limit)
  - [ENCODING](FetchBurnCountersWithPaginationDto.md#encoding)
  - [MAX\_LIMIT](FetchBurnCountersWithPaginationDto.md#max-limit)
- [Methods](FetchBurnCountersWithPaginationDto.md#methods)
  - [isSignatureValid()](FetchBurnCountersWithPaginationDto.md#issignaturevalid)
  - [serialize()](FetchBurnCountersWithPaginationDto.md#serialize)
  - [sign()](FetchBurnCountersWithPaginationDto.md#sign)
  - [signed()](FetchBurnCountersWithPaginationDto.md#signed)
  - [validate()](FetchBurnCountersWithPaginationDto.md#validate)
  - [validateOrReject()](FetchBurnCountersWithPaginationDto.md#validateorreject)
  - [deserialize()](FetchBurnCountersWithPaginationDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new FetchBurnCountersWithPaginationDto()

> **new FetchBurnCountersWithPaginationDto**(): [`FetchBurnCountersWithPaginationDto`](FetchBurnCountersWithPaginationDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/burn.ts:187](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L187)

***

### bookmark

> **bookmark**?: `string`

#### Source

[chain-api/src/types/burn.ts:194](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L194)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/burn.ts:173](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L173)

***

### collection

> **collection**?: `string`

#### Source

[chain-api/src/types/burn.ts:166](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L166)

***

### limit

> **limit**?: `number`

#### Source

[chain-api/src/types/burn.ts:206](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L206)

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

[chain-api/src/types/burn.ts:180](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L180)

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

[chain-api/src/types/burn.ts:159](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L159)

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

[chain-api/src/types/burn.ts:158](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L158)

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

> **signed**(`privateKey`, `useDer`): [`FetchBurnCountersWithPaginationDto`](FetchBurnCountersWithPaginationDto.md)

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
