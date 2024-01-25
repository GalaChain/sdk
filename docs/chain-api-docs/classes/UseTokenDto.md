**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > UseTokenDto

# Class: UseTokenDto

## Contents

- [Extends](UseTokenDto.md#extends)
- [Constructors](UseTokenDto.md#constructors)
  - [new UseTokenDto()](UseTokenDto.md#new-usetokendto)
- [Properties](UseTokenDto.md#properties)
  - [inUseBy](UseTokenDto.md#inuseby)
  - [owner](UseTokenDto.md#owner)
  - [quantity](UseTokenDto.md#quantity)
  - [signature](UseTokenDto.md#signature)
  - [signerPublicKey](UseTokenDto.md#signerpublickey)
  - [tokenInstance](UseTokenDto.md#tokeninstance)
  - [trace](UseTokenDto.md#trace)
  - [uniqueKey](UseTokenDto.md#uniquekey)
  - [useAllowances](UseTokenDto.md#useallowances)
  - [ENCODING](UseTokenDto.md#encoding)
- [Methods](UseTokenDto.md#methods)
  - [isSignatureValid()](UseTokenDto.md#issignaturevalid)
  - [serialize()](UseTokenDto.md#serialize)
  - [sign()](UseTokenDto.md#sign)
  - [signed()](UseTokenDto.md#signed)
  - [validate()](UseTokenDto.md#validate)
  - [validateOrReject()](UseTokenDto.md#validateorreject)
  - [deserialize()](UseTokenDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new UseTokenDto()

> **new UseTokenDto**(): [`UseTokenDto`](UseTokenDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### inUseBy

> **inUseBy**: `string`

#### Source

[chain-api/src/types/use.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/use.ts#L53)

***

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/use.ts:47](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/use.ts#L47)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/use.ts:71](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/use.ts#L71)

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

### tokenInstance

> **tokenInstance**: [`TokenInstanceKey`](TokenInstanceKey.md)

#### Source

[chain-api/src/types/use.ts:63](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/use.ts#L63)

***

### trace

> **trace**?: [`TraceContext`](../interfaces/TraceContext.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`trace`](ChainCallDTO.md#trace)

#### Source

[chain-api/src/types/dtos.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L99)

***

### uniqueKey

> **uniqueKey**?: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`uniqueKey`](ChainCallDTO.md#uniquekey)

#### Source

[chain-api/src/types/dtos.ts:114](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L114)

***

### useAllowances

> **useAllowances**?: `string`[]

#### Source

[chain-api/src/types/use.ts:79](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/use.ts#L79)

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

> **signed**(`privateKey`, `useDer`): [`UseTokenDto`](UseTokenDto.md)

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
