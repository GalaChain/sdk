**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > LockTokenDto

# Class: LockTokenDto

## Contents

- [Extends](LockTokenDto.md#extends)
- [Constructors](LockTokenDto.md#constructors)
  - [new LockTokenDto()](LockTokenDto.md#new-locktokendto)
- [Properties](LockTokenDto.md#properties)
  - [lockAuthority](LockTokenDto.md#lockauthority)
  - [owner](LockTokenDto.md#owner)
  - [quantity](LockTokenDto.md#quantity)
  - [signature](LockTokenDto.md#signature)
  - [signerPublicKey](LockTokenDto.md#signerpublickey)
  - [tokenInstance](LockTokenDto.md#tokeninstance)
  - [trace](LockTokenDto.md#trace)
  - [uniqueKey](LockTokenDto.md#uniquekey)
  - [useAllowances](LockTokenDto.md#useallowances)
  - [ENCODING](LockTokenDto.md#encoding)
- [Methods](LockTokenDto.md#methods)
  - [isSignatureValid()](LockTokenDto.md#issignaturevalid)
  - [serialize()](LockTokenDto.md#serialize)
  - [sign()](LockTokenDto.md#sign)
  - [signed()](LockTokenDto.md#signed)
  - [validate()](LockTokenDto.md#validate)
  - [validateOrReject()](LockTokenDto.md#validateorreject)
  - [deserialize()](LockTokenDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new LockTokenDto()

> **new LockTokenDto**(): [`LockTokenDto`](LockTokenDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### lockAuthority

> **lockAuthority**?: `string`

#### Source

[chain-api/src/types/lock.ts:45](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/lock.ts#L45)

***

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/lock.ts:35](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/lock.ts#L35)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/lock.ts:62](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/lock.ts#L62)

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

[chain-api/src/types/lock.ts:55](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/lock.ts#L55)

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

[chain-api/src/types/lock.ts:70](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/lock.ts#L70)

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

> **signed**(`privateKey`, `useDer`): [`LockTokenDto`](LockTokenDto.md)

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
