**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > PatchMintAllowanceRequestDto

# Class: PatchMintAllowanceRequestDto

## Contents

- [Extends](PatchMintAllowanceRequestDto.md#extends)
- [Constructors](PatchMintAllowanceRequestDto.md#constructors)
  - [new PatchMintAllowanceRequestDto()](PatchMintAllowanceRequestDto.md#new-patchmintallowancerequestdto)
- [Properties](PatchMintAllowanceRequestDto.md#properties)
  - [additionalKey](PatchMintAllowanceRequestDto.md#additionalkey)
  - [category](PatchMintAllowanceRequestDto.md#category)
  - [collection](PatchMintAllowanceRequestDto.md#collection)
  - [signature](PatchMintAllowanceRequestDto.md#signature)
  - [signerPublicKey](PatchMintAllowanceRequestDto.md#signerpublickey)
  - [totalKnownMintAllowancesCount](PatchMintAllowanceRequestDto.md#totalknownmintallowancescount)
  - [trace](PatchMintAllowanceRequestDto.md#trace)
  - [type](PatchMintAllowanceRequestDto.md#type)
  - [uniqueKey](PatchMintAllowanceRequestDto.md#uniquekey)
  - [ENCODING](PatchMintAllowanceRequestDto.md#encoding)
- [Methods](PatchMintAllowanceRequestDto.md#methods)
  - [isSignatureValid()](PatchMintAllowanceRequestDto.md#issignaturevalid)
  - [serialize()](PatchMintAllowanceRequestDto.md#serialize)
  - [sign()](PatchMintAllowanceRequestDto.md#sign)
  - [signed()](PatchMintAllowanceRequestDto.md#signed)
  - [validate()](PatchMintAllowanceRequestDto.md#validate)
  - [validateOrReject()](PatchMintAllowanceRequestDto.md#validateorreject)
  - [deserialize()](PatchMintAllowanceRequestDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new PatchMintAllowanceRequestDto()

> **new PatchMintAllowanceRequestDto**(): [`PatchMintAllowanceRequestDto`](PatchMintAllowanceRequestDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/mint.ts:289](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L289)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/mint.ts:277](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L277)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/mint.ts:271](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L271)

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

### totalKnownMintAllowancesCount

> **totalKnownMintAllowancesCount**: `BigNumber`

#### Source

[chain-api/src/types/mint.ts:296](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L296)

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

[chain-api/src/types/mint.ts:283](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L283)

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

> **signed**(`privateKey`, `useDer`): [`PatchMintAllowanceRequestDto`](PatchMintAllowanceRequestDto.md)

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
