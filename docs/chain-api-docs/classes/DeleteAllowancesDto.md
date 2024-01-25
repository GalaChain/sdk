**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > DeleteAllowancesDto

# Class: DeleteAllowancesDto

## Contents

- [Extends](DeleteAllowancesDto.md#extends)
- [Constructors](DeleteAllowancesDto.md#constructors)
  - [new DeleteAllowancesDto()](DeleteAllowancesDto.md#new-deleteallowancesdto)
- [Properties](DeleteAllowancesDto.md#properties)
  - [additionalKey](DeleteAllowancesDto.md#additionalkey)
  - [allowanceType](DeleteAllowancesDto.md#allowancetype)
  - [category](DeleteAllowancesDto.md#category)
  - [collection](DeleteAllowancesDto.md#collection)
  - [grantedBy](DeleteAllowancesDto.md#grantedby)
  - [grantedTo](DeleteAllowancesDto.md#grantedto)
  - [instance](DeleteAllowancesDto.md#instance)
  - [signature](DeleteAllowancesDto.md#signature)
  - [signerPublicKey](DeleteAllowancesDto.md#signerpublickey)
  - [trace](DeleteAllowancesDto.md#trace)
  - [type](DeleteAllowancesDto.md#type)
  - [uniqueKey](DeleteAllowancesDto.md#uniquekey)
  - [ENCODING](DeleteAllowancesDto.md#encoding)
- [Methods](DeleteAllowancesDto.md#methods)
  - [isSignatureValid()](DeleteAllowancesDto.md#issignaturevalid)
  - [serialize()](DeleteAllowancesDto.md#serialize)
  - [sign()](DeleteAllowancesDto.md#sign)
  - [signed()](DeleteAllowancesDto.md#signed)
  - [validate()](DeleteAllowancesDto.md#validate)
  - [validateOrReject()](DeleteAllowancesDto.md#validateorreject)
  - [deserialize()](DeleteAllowancesDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new DeleteAllowancesDto()

> **new DeleteAllowancesDto**(): [`DeleteAllowancesDto`](DeleteAllowancesDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/allowance.ts:242](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L242)

***

### allowanceType

> **allowanceType**?: [`AllowanceType`](../enumerations/AllowanceType.md)

#### Source

[chain-api/src/types/allowance.ts:253](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L253)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/allowance.ts:228](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L228)

***

### collection

> **collection**?: `string`

#### Source

[chain-api/src/types/allowance.ts:221](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L221)

***

### grantedBy

> **grantedBy**?: `string`

#### Source

[chain-api/src/types/allowance.ts:214](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L214)

***

### grantedTo

> **grantedTo**: `string`

#### Source

[chain-api/src/types/allowance.ts:207](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L207)

***

### instance

> **instance**?: `string`

#### Source

[chain-api/src/types/allowance.ts:249](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L249)

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

[chain-api/src/types/allowance.ts:235](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L235)

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

> **signed**(`privateKey`, `useDer`): [`DeleteAllowancesDto`](DeleteAllowancesDto.md)

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
