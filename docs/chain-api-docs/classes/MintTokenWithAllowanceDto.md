**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > MintTokenWithAllowanceDto

# Class: MintTokenWithAllowanceDto

## Contents

- [Extends](MintTokenWithAllowanceDto.md#extends)
- [Constructors](MintTokenWithAllowanceDto.md#constructors)
  - [new MintTokenWithAllowanceDto()](MintTokenWithAllowanceDto.md#new-minttokenwithallowancedto)
- [Properties](MintTokenWithAllowanceDto.md#properties)
  - [owner](MintTokenWithAllowanceDto.md#owner)
  - [quantity](MintTokenWithAllowanceDto.md#quantity)
  - [signature](MintTokenWithAllowanceDto.md#signature)
  - [signerPublicKey](MintTokenWithAllowanceDto.md#signerpublickey)
  - [tokenClass](MintTokenWithAllowanceDto.md#tokenclass)
  - [tokenInstance](MintTokenWithAllowanceDto.md#tokeninstance)
  - [trace](MintTokenWithAllowanceDto.md#trace)
  - [uniqueKey](MintTokenWithAllowanceDto.md#uniquekey)
  - [ENCODING](MintTokenWithAllowanceDto.md#encoding)
- [Methods](MintTokenWithAllowanceDto.md#methods)
  - [isSignatureValid()](MintTokenWithAllowanceDto.md#issignaturevalid)
  - [serialize()](MintTokenWithAllowanceDto.md#serialize)
  - [sign()](MintTokenWithAllowanceDto.md#sign)
  - [signed()](MintTokenWithAllowanceDto.md#signed)
  - [validate()](MintTokenWithAllowanceDto.md#validate)
  - [validateOrReject()](MintTokenWithAllowanceDto.md#validateorreject)
  - [deserialize()](MintTokenWithAllowanceDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new MintTokenWithAllowanceDto()

> **new MintTokenWithAllowanceDto**(): [`MintTokenWithAllowanceDto`](MintTokenWithAllowanceDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/mint.ts:82](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L82)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/mint.ts:98](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L98)

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

### tokenClass

> **tokenClass**: [`TokenClassKey`](TokenClassKey.md)

#### Source

[chain-api/src/types/mint.ts:75](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L75)

***

### tokenInstance

> **tokenInstance**: `BigNumber`

#### Source

[chain-api/src/types/mint.ts:90](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L90)

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

> **signed**(`privateKey`, `useDer`): [`MintTokenWithAllowanceDto`](MintTokenWithAllowanceDto.md)

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
