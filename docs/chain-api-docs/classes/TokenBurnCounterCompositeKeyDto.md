**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenBurnCounterCompositeKeyDto

# Class: TokenBurnCounterCompositeKeyDto

## Contents

- [Extends](TokenBurnCounterCompositeKeyDto.md#extends)
- [Constructors](TokenBurnCounterCompositeKeyDto.md#constructors)
  - [new TokenBurnCounterCompositeKeyDto()](TokenBurnCounterCompositeKeyDto.md#new-tokenburncountercompositekeydto)
- [Properties](TokenBurnCounterCompositeKeyDto.md#properties)
  - [additionalKey](TokenBurnCounterCompositeKeyDto.md#additionalkey)
  - [burnedBy](TokenBurnCounterCompositeKeyDto.md#burnedby)
  - [category](TokenBurnCounterCompositeKeyDto.md#category)
  - [collection](TokenBurnCounterCompositeKeyDto.md#collection)
  - [instance](TokenBurnCounterCompositeKeyDto.md#instance)
  - [signature](TokenBurnCounterCompositeKeyDto.md#signature)
  - [signerPublicKey](TokenBurnCounterCompositeKeyDto.md#signerpublickey)
  - [timeKey](TokenBurnCounterCompositeKeyDto.md#timekey)
  - [totalKnownBurnsCount](TokenBurnCounterCompositeKeyDto.md#totalknownburnscount)
  - [trace](TokenBurnCounterCompositeKeyDto.md#trace)
  - [type](TokenBurnCounterCompositeKeyDto.md#type)
  - [uniqueKey](TokenBurnCounterCompositeKeyDto.md#uniquekey)
  - [ENCODING](TokenBurnCounterCompositeKeyDto.md#encoding)
- [Methods](TokenBurnCounterCompositeKeyDto.md#methods)
  - [isSignatureValid()](TokenBurnCounterCompositeKeyDto.md#issignaturevalid)
  - [serialize()](TokenBurnCounterCompositeKeyDto.md#serialize)
  - [sign()](TokenBurnCounterCompositeKeyDto.md#sign)
  - [signed()](TokenBurnCounterCompositeKeyDto.md#signed)
  - [validate()](TokenBurnCounterCompositeKeyDto.md#validate)
  - [validateOrReject()](TokenBurnCounterCompositeKeyDto.md#validateorreject)
  - [deserialize()](TokenBurnCounterCompositeKeyDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new TokenBurnCounterCompositeKeyDto()

> **new TokenBurnCounterCompositeKeyDto**(): [`TokenBurnCounterCompositeKeyDto`](TokenBurnCounterCompositeKeyDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/burn.ts:245](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L245)

***

### burnedBy

> **burnedBy**: `string`

#### Source

[chain-api/src/types/burn.ts:257](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L257)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/burn.ts:235](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L235)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/burn.ts:229](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L229)

***

### instance

> **instance**: `BigNumber`

#### Source

[chain-api/src/types/burn.ts:266](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L266)

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

### timeKey

> **timeKey**: `string`

#### Source

[chain-api/src/types/burn.ts:251](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L251)

***

### totalKnownBurnsCount

> **totalKnownBurnsCount**: `BigNumber`

#### Source

[chain-api/src/types/burn.ts:275](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L275)

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

[chain-api/src/types/burn.ts:240](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/burn.ts#L240)

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

> **signed**(`privateKey`, `useDer`): [`TokenBurnCounterCompositeKeyDto`](TokenBurnCounterCompositeKeyDto.md)

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
