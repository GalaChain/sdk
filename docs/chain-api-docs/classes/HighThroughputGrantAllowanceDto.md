**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > HighThroughputGrantAllowanceDto

# Class: HighThroughputGrantAllowanceDto

Experimental: Defines allowances to be created. High-throughput implementation.

 2023-03-23

## Contents

- [Extends](HighThroughputGrantAllowanceDto.md#extends)
- [Constructors](HighThroughputGrantAllowanceDto.md#constructors)
  - [new HighThroughputGrantAllowanceDto()](HighThroughputGrantAllowanceDto.md#new-highthroughputgrantallowancedto)
- [Properties](HighThroughputGrantAllowanceDto.md#properties)
  - [allowanceType](HighThroughputGrantAllowanceDto.md#allowancetype)
  - [expires](HighThroughputGrantAllowanceDto.md#expires)
  - [quantities](HighThroughputGrantAllowanceDto.md#quantities)
  - [signature](HighThroughputGrantAllowanceDto.md#signature)
  - [signerPublicKey](HighThroughputGrantAllowanceDto.md#signerpublickey)
  - [tokenInstance](HighThroughputGrantAllowanceDto.md#tokeninstance)
  - [trace](HighThroughputGrantAllowanceDto.md#trace)
  - [uniqueKey](HighThroughputGrantAllowanceDto.md#uniquekey)
  - [uses](HighThroughputGrantAllowanceDto.md#uses)
  - [DEFAULT\_EXPIRES](HighThroughputGrantAllowanceDto.md#default-expires)
  - [ENCODING](HighThroughputGrantAllowanceDto.md#encoding)
- [Methods](HighThroughputGrantAllowanceDto.md#methods)
  - [isSignatureValid()](HighThroughputGrantAllowanceDto.md#issignaturevalid)
  - [serialize()](HighThroughputGrantAllowanceDto.md#serialize)
  - [sign()](HighThroughputGrantAllowanceDto.md#sign)
  - [signed()](HighThroughputGrantAllowanceDto.md#signed)
  - [validate()](HighThroughputGrantAllowanceDto.md#validate)
  - [validateOrReject()](HighThroughputGrantAllowanceDto.md#validateorreject)
  - [deserialize()](HighThroughputGrantAllowanceDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new HighThroughputGrantAllowanceDto()

> **new HighThroughputGrantAllowanceDto**(): [`HighThroughputGrantAllowanceDto`](HighThroughputGrantAllowanceDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### allowanceType

> **allowanceType**: [`AllowanceType`](../enumerations/AllowanceType.md)

#### Source

[chain-api/src/types/allowance.ts:344](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L344)

***

### expires

> **expires**?: `number`

#### Source

[chain-api/src/types/allowance.ts:360](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L360)

***

### quantities

> **quantities**: [`GrantAllowanceQuantity`](GrantAllowanceQuantity.md)[]

#### Source

[chain-api/src/types/allowance.ts:340](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L340)

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

> **tokenInstance**: [`TokenInstanceQueryKey`](TokenInstanceQueryKey.md)

#### Source

[chain-api/src/types/allowance.ts:331](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L331)

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

### uses

> **uses**: `BigNumber`

#### Source

[chain-api/src/types/allowance.ts:352](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L352)

***

### DEFAULT\_EXPIRES

> **`static`** **DEFAULT\_EXPIRES**: `number` = `0`

#### Source

[chain-api/src/types/allowance.ts:320](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L320)

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

> **signed**(`privateKey`, `useDer`): [`HighThroughputGrantAllowanceDto`](HighThroughputGrantAllowanceDto.md)

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
