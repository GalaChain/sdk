**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > MintTokenDto

# Class: MintTokenDto

## Contents

- [Extends](MintTokenDto.md#extends)
- [Constructors](MintTokenDto.md#constructors)
  - [new MintTokenDto()](MintTokenDto.md#new-minttokendto)
- [Properties](MintTokenDto.md#properties)
  - [allowanceKey](MintTokenDto.md#allowancekey)
  - [owner](MintTokenDto.md#owner)
  - [quantity](MintTokenDto.md#quantity)
  - [signature](MintTokenDto.md#signature)
  - [signerPublicKey](MintTokenDto.md#signerpublickey)
  - [tokenClass](MintTokenDto.md#tokenclass)
  - [trace](MintTokenDto.md#trace)
  - [uniqueKey](MintTokenDto.md#uniquekey)
  - [ENCODING](MintTokenDto.md#encoding)
  - [MAX\_NFT\_MINT\_SIZE](MintTokenDto.md#max-nft-mint-size)
- [Methods](MintTokenDto.md#methods)
  - [isSignatureValid()](MintTokenDto.md#issignaturevalid)
  - [serialize()](MintTokenDto.md#serialize)
  - [sign()](MintTokenDto.md#sign)
  - [signed()](MintTokenDto.md#signed)
  - [validate()](MintTokenDto.md#validate)
  - [validateOrReject()](MintTokenDto.md#validateorreject)
  - [deserialize()](MintTokenDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new MintTokenDto()

> **new MintTokenDto**(): [`MintTokenDto`](MintTokenDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### allowanceKey

> **allowanceKey**?: [`AllowanceKey`](AllowanceKey.md)

#### Source

[chain-api/src/types/mint.ts:60](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L60)

***

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/mint.ts:47](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L47)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/mint.ts:55](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L55)

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

[chain-api/src/types/mint.ts:40](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L40)

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

[chain-api/src/types/mint.ts:32](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/mint.ts#L32)

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

> **signed**(`privateKey`, `useDer`): [`MintTokenDto`](MintTokenDto.md)

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
