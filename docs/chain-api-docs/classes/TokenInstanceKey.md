**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenInstanceKey

# Class: TokenInstanceKey

## Contents

- [Extends](TokenInstanceKey.md#extends)
- [Constructors](TokenInstanceKey.md#constructors)
  - [new TokenInstanceKey()](TokenInstanceKey.md#new-tokeninstancekey)
- [Properties](TokenInstanceKey.md#properties)
  - [additionalKey](TokenInstanceKey.md#additionalkey)
  - [category](TokenInstanceKey.md#category)
  - [collection](TokenInstanceKey.md#collection)
  - [instance](TokenInstanceKey.md#instance)
  - [signature](TokenInstanceKey.md#signature)
  - [signerPublicKey](TokenInstanceKey.md#signerpublickey)
  - [trace](TokenInstanceKey.md#trace)
  - [type](TokenInstanceKey.md#type)
  - [uniqueKey](TokenInstanceKey.md#uniquekey)
  - [ENCODING](TokenInstanceKey.md#encoding)
- [Methods](TokenInstanceKey.md#methods)
  - [getTokenClassKey()](TokenInstanceKey.md#gettokenclasskey)
  - [isFungible()](TokenInstanceKey.md#isfungible)
  - [isSignatureValid()](TokenInstanceKey.md#issignaturevalid)
  - [serialize()](TokenInstanceKey.md#serialize)
  - [sign()](TokenInstanceKey.md#sign)
  - [signed()](TokenInstanceKey.md#signed)
  - [toQueryKey()](TokenInstanceKey.md#toquerykey)
  - [toString()](TokenInstanceKey.md#tostring)
  - [toStringKey()](TokenInstanceKey.md#tostringkey)
  - [validate()](TokenInstanceKey.md#validate)
  - [validateOrReject()](TokenInstanceKey.md#validateorreject)
  - [deserialize()](TokenInstanceKey.md#deserialize)
  - [fungibleKey()](TokenInstanceKey.md#fungiblekey)
  - [nftKey()](TokenInstanceKey.md#nftkey)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new TokenInstanceKey()

> **new TokenInstanceKey**(): [`TokenInstanceKey`](TokenInstanceKey.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:57](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L57)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:51](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L51)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L48)

***

### instance

> **instance**: `BigNumber`

#### Source

[chain-api/src/types/TokenInstance.ts:63](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L63)

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

> **type**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:54](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L54)

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

### getTokenClassKey()

> **getTokenClassKey**(): [`TokenClassKey`](TokenClassKey.md)

#### Source

[chain-api/src/types/TokenInstance.ts:83](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L83)

***

### isFungible()

> **isFungible**(): `boolean`

#### Source

[chain-api/src/types/TokenInstance.ts:113](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L113)

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

> **signed**(`privateKey`, `useDer`): [`TokenInstanceKey`](TokenInstanceKey.md)

Creates a signed copy of current object.

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signed`](ChainCallDTO.md#signed)

#### Source

[chain-api/src/types/dtos.ts:179](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L179)

***

### toQueryKey()

> **toQueryKey**(): [`TokenInstanceQueryKey`](TokenInstanceQueryKey.md)

#### Source

[chain-api/src/types/TokenInstance.ts:93](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L93)

***

### toString()

> **toString**(): `string`

#### Source

[chain-api/src/types/TokenInstance.ts:104](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L104)

***

### toStringKey()

> **toStringKey**(): `string`

#### Source

[chain-api/src/types/TokenInstance.ts:108](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L108)

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

***

### fungibleKey()

> **`static`** **fungibleKey**(`c`): [`TokenInstanceKey`](TokenInstanceKey.md)

#### Parameters

▪ **c**: [`TokenClassKey`](TokenClassKey.md) \| [`TokenClass`](TokenClass.md)

#### Source

[chain-api/src/types/TokenInstance.ts:79](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L79)

***

### nftKey()

> **`static`** **nftKey**(`c`, `instance`): [`TokenInstanceKey`](TokenInstanceKey.md)

#### Parameters

▪ **c**: [`TokenClassKeyProperties`](../interfaces/TokenClassKeyProperties.md) \| [`TokenClassKey`](TokenClassKey.md) \| [`TokenClass`](TokenClass.md)

▪ **instance**: `string` \| `number` \| `BigNumber`

#### Source

[chain-api/src/types/TokenInstance.ts:65](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L65)
