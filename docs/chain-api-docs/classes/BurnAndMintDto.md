**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > BurnAndMintDto

# Class: BurnAndMintDto

## Contents

- [Extends](BurnAndMintDto.md#extends)
- [Constructors](BurnAndMintDto.md#constructors)
  - [new BurnAndMintDto()](BurnAndMintDto.md#new-burnandmintdto)
- [Properties](BurnAndMintDto.md#properties)
  - [burnDto](BurnAndMintDto.md#burndto)
  - [burnOwner](BurnAndMintDto.md#burnowner)
  - [mintDto](BurnAndMintDto.md#mintdto)
  - [signature](BurnAndMintDto.md#signature)
  - [signerPublicKey](BurnAndMintDto.md#signerpublickey)
  - [trace](BurnAndMintDto.md#trace)
  - [uniqueKey](BurnAndMintDto.md#uniquekey)
  - [ENCODING](BurnAndMintDto.md#encoding)
  - [MAX\_ARR\_SIZE](BurnAndMintDto.md#max-arr-size)
- [Methods](BurnAndMintDto.md#methods)
  - [isSignatureValid()](BurnAndMintDto.md#issignaturevalid)
  - [serialize()](BurnAndMintDto.md#serialize)
  - [sign()](BurnAndMintDto.md#sign)
  - [signed()](BurnAndMintDto.md#signed)
  - [validate()](BurnAndMintDto.md#validate)
  - [validateOrReject()](BurnAndMintDto.md#validateorreject)
  - [deserialize()](BurnAndMintDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new BurnAndMintDto()

> **new BurnAndMintDto**(): [`BurnAndMintDto`](BurnAndMintDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### burnDto

> **burnDto**: [`BurnTokensDto`](BurnTokensDto.md)

#### Source

[chain-api/src/types/burn.ts:135](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L135)

***

### burnOwner

> **burnOwner**: `string`

#### Source

[chain-api/src/types/burn.ts:143](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L143)

***

### mintDto

> **mintDto**: [`BatchMintTokenDto`](BatchMintTokenDto.md)

#### Source

[chain-api/src/types/burn.ts:151](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L151)

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

***

### MAX\_ARR\_SIZE

> **`static`** **MAX\_ARR\_SIZE**: `number` = `1000`

#### Source

[chain-api/src/types/burn.ts:127](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L127)

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

> **signed**(`privateKey`, `useDer`): [`BurnAndMintDto`](BurnAndMintDto.md)

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
