**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > HighThroughputMintTokenDto

# Class: HighThroughputMintTokenDto

Experimental: Defines an action to mint a token. High-throughput implementation.

 2023-03-23

## Contents

- [Extends](HighThroughputMintTokenDto.md#extends)
- [Constructors](HighThroughputMintTokenDto.md#constructors)
  - [new HighThroughputMintTokenDto()](HighThroughputMintTokenDto.md#new-highthroughputminttokendto)
- [Properties](HighThroughputMintTokenDto.md#properties)
  - [allowanceKey](HighThroughputMintTokenDto.md#allowancekey)
  - [owner](HighThroughputMintTokenDto.md#owner)
  - [quantity](HighThroughputMintTokenDto.md#quantity)
  - [signature](HighThroughputMintTokenDto.md#signature)
  - [signerPublicKey](HighThroughputMintTokenDto.md#signerpublickey)
  - [tokenClass](HighThroughputMintTokenDto.md#tokenclass)
  - [trace](HighThroughputMintTokenDto.md#trace)
  - [uniqueKey](HighThroughputMintTokenDto.md#uniquekey)
  - [ENCODING](HighThroughputMintTokenDto.md#encoding)
  - [MAX\_NFT\_MINT\_SIZE](HighThroughputMintTokenDto.md#max-nft-mint-size)
- [Methods](HighThroughputMintTokenDto.md#methods)
  - [isSignatureValid()](HighThroughputMintTokenDto.md#issignaturevalid)
  - [serialize()](HighThroughputMintTokenDto.md#serialize)
  - [sign()](HighThroughputMintTokenDto.md#sign)
  - [signed()](HighThroughputMintTokenDto.md#signed)
  - [validate()](HighThroughputMintTokenDto.md#validate)
  - [validateOrReject()](HighThroughputMintTokenDto.md#validateorreject)
  - [deserialize()](HighThroughputMintTokenDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new HighThroughputMintTokenDto()

> **new HighThroughputMintTokenDto**(): [`HighThroughputMintTokenDto`](HighThroughputMintTokenDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### allowanceKey

> **allowanceKey**?: [`AllowanceKey`](AllowanceKey.md)

#### Source

[chain-api/src/types/mint.ts:164](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L164)

***

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/mint.ts:151](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L151)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/mint.ts:159](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L159)

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

[chain-api/src/types/mint.ts:144](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L144)

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

### MAX\_NFT\_MINT\_SIZE

> **`static`** **MAX\_NFT\_MINT\_SIZE**: `number` = `1000`

#### Source

[chain-api/src/types/mint.ts:136](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L136)

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

> **signed**(`privateKey`, `useDer`): [`HighThroughputMintTokenDto`](HighThroughputMintTokenDto.md)

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
