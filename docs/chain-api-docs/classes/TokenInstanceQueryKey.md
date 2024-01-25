**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenInstanceQueryKey

# Class: TokenInstanceQueryKey

## Contents

- [Extends](TokenInstanceQueryKey.md#extends)
- [Constructors](TokenInstanceQueryKey.md#constructors)
  - [new TokenInstanceQueryKey()](TokenInstanceQueryKey.md#new-tokeninstancequerykey)
- [Properties](TokenInstanceQueryKey.md#properties)
  - [additionalKey](TokenInstanceQueryKey.md#additionalkey)
  - [category](TokenInstanceQueryKey.md#category)
  - [collection](TokenInstanceQueryKey.md#collection)
  - [instance](TokenInstanceQueryKey.md#instance)
  - [signature](TokenInstanceQueryKey.md#signature)
  - [signerPublicKey](TokenInstanceQueryKey.md#signerpublickey)
  - [trace](TokenInstanceQueryKey.md#trace)
  - [type](TokenInstanceQueryKey.md#type)
  - [uniqueKey](TokenInstanceQueryKey.md#uniquekey)
  - [ENCODING](TokenInstanceQueryKey.md#encoding)
- [Methods](TokenInstanceQueryKey.md#methods)
  - [isCompleteKey()](TokenInstanceQueryKey.md#iscompletekey)
  - [isSignatureValid()](TokenInstanceQueryKey.md#issignaturevalid)
  - [publicKeyProperties()](TokenInstanceQueryKey.md#publickeyproperties)
  - [serialize()](TokenInstanceQueryKey.md#serialize)
  - [sign()](TokenInstanceQueryKey.md#sign)
  - [signed()](TokenInstanceQueryKey.md#signed)
  - [toCompleteKey()](TokenInstanceQueryKey.md#tocompletekey)
  - [toQueryParams()](TokenInstanceQueryKey.md#toqueryparams)
  - [validate()](TokenInstanceQueryKey.md#validate)
  - [validateOrReject()](TokenInstanceQueryKey.md#validateorreject)
  - [deserialize()](TokenInstanceQueryKey.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new TokenInstanceQueryKey()

> **new TokenInstanceQueryKey**(): [`TokenInstanceQueryKey`](TokenInstanceQueryKey.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:165](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L165)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:159](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L159)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:156](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L156)

***

### instance

> **instance**?: `BigNumber`

#### Source

[chain-api/src/types/TokenInstance.ts:171](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L171)

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

[chain-api/src/types/TokenInstance.ts:162](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L162)

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

### isCompleteKey()

> **isCompleteKey**(): `boolean`

#### Source

[chain-api/src/types/TokenInstance.ts:173](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L173)

***

### isSignatureValid()

> **isSignatureValid**(`publicKey`): `boolean`

#### Parameters

▪ **publicKey**: `string`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`isSignatureValid`](ChainCallDTO.md#issignaturevalid)

#### Source

[chain-api/src/types/dtos.ts:185](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L185)

***

### publicKeyProperties()

> **publicKeyProperties**(): `string`[]

#### Source

[chain-api/src/types/TokenInstance.ts:214](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L214)

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

> **signed**(`privateKey`, `useDer`): [`TokenInstanceQueryKey`](TokenInstanceQueryKey.md)

Creates a signed copy of current object.

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signed`](ChainCallDTO.md#signed)

#### Source

[chain-api/src/types/dtos.ts:179](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L179)

***

### toCompleteKey()

> **toCompleteKey**(): [`TokenInstanceKey`](TokenInstanceKey.md)

#### Source

[chain-api/src/types/TokenInstance.ts:184](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L184)

***

### toQueryParams()

> **toQueryParams**(): `string`[]

#### Source

[chain-api/src/types/TokenInstance.ts:221](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L221)

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
