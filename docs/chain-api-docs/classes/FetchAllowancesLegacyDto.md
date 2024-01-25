**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > FetchAllowancesLegacyDto

# Class: FetchAllowancesLegacyDto

## Contents

- [Extends](FetchAllowancesLegacyDto.md#extends)
- [Constructors](FetchAllowancesLegacyDto.md#constructors)
  - [new FetchAllowancesLegacyDto()](FetchAllowancesLegacyDto.md#new-fetchallowanceslegacydto)
- [Properties](FetchAllowancesLegacyDto.md#properties)
  - [additionalKey](FetchAllowancesLegacyDto.md#additionalkey)
  - [allowanceType](FetchAllowancesLegacyDto.md#allowancetype)
  - [bookmark](FetchAllowancesLegacyDto.md#bookmark)
  - [category](FetchAllowancesLegacyDto.md#category)
  - [collection](FetchAllowancesLegacyDto.md#collection)
  - [grantedBy](FetchAllowancesLegacyDto.md#grantedby)
  - [grantedTo](FetchAllowancesLegacyDto.md#grantedto)
  - [instance](FetchAllowancesLegacyDto.md#instance)
  - [signature](FetchAllowancesLegacyDto.md#signature)
  - [signerPublicKey](FetchAllowancesLegacyDto.md#signerpublickey)
  - [trace](FetchAllowancesLegacyDto.md#trace)
  - [type](FetchAllowancesLegacyDto.md#type)
  - [uniqueKey](FetchAllowancesLegacyDto.md#uniquekey)
  - [ENCODING](FetchAllowancesLegacyDto.md#encoding)
- [Methods](FetchAllowancesLegacyDto.md#methods)
  - [isSignatureValid()](FetchAllowancesLegacyDto.md#issignaturevalid)
  - [serialize()](FetchAllowancesLegacyDto.md#serialize)
  - [sign()](FetchAllowancesLegacyDto.md#sign)
  - [signed()](FetchAllowancesLegacyDto.md#signed)
  - [validate()](FetchAllowancesLegacyDto.md#validate)
  - [validateOrReject()](FetchAllowancesLegacyDto.md#validateorreject)
  - [deserialize()](FetchAllowancesLegacyDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new FetchAllowancesLegacyDto()

> **new FetchAllowancesLegacyDto**(): [`FetchAllowancesLegacyDto`](FetchAllowancesLegacyDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/allowance.ts:159](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L159)

***

### allowanceType

> **allowanceType**?: [`AllowanceType`](../enumerations/AllowanceType.md)

#### Source

[chain-api/src/types/allowance.ts:170](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L170)

***

### bookmark

> **bookmark**?: `string`

#### Source

[chain-api/src/types/allowance.ts:184](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L184)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/allowance.ts:145](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L145)

***

### collection

> **collection**?: `string`

#### Source

[chain-api/src/types/allowance.ts:138](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L138)

***

### grantedBy

> **grantedBy**?: `string`

#### Source

[chain-api/src/types/allowance.ts:177](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L177)

***

### grantedTo

> **grantedTo**: `string`

#### Source

[chain-api/src/types/allowance.ts:131](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L131)

***

### instance

> **instance**?: `string`

#### Source

[chain-api/src/types/allowance.ts:166](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L166)

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

[chain-api/src/types/allowance.ts:152](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L152)

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

> **signed**(`privateKey`, `useDer`): [`FetchAllowancesLegacyDto`](FetchAllowancesLegacyDto.md)

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
