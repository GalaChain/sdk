**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenClassKey

# Class: TokenClassKey

## Contents

- [Extends](TokenClassKey.md#extends)
- [Constructors](TokenClassKey.md#constructors)
  - [new TokenClassKey()](TokenClassKey.md#new-tokenclasskey)
- [Properties](TokenClassKey.md#properties)
  - [additionalKey](TokenClassKey.md#additionalkey)
  - [category](TokenClassKey.md#category)
  - [collection](TokenClassKey.md#collection)
  - [signature](TokenClassKey.md#signature)
  - [signerPublicKey](TokenClassKey.md#signerpublickey)
  - [trace](TokenClassKey.md#trace)
  - [type](TokenClassKey.md#type)
  - [uniqueKey](TokenClassKey.md#uniquekey)
  - [ENCODING](TokenClassKey.md#encoding)
- [Methods](TokenClassKey.md#methods)
  - [allKeysPresent()](TokenClassKey.md#allkeyspresent)
  - [isSignatureValid()](TokenClassKey.md#issignaturevalid)
  - [serialize()](TokenClassKey.md#serialize)
  - [sign()](TokenClassKey.md#sign)
  - [signed()](TokenClassKey.md#signed)
  - [toString()](TokenClassKey.md#tostring)
  - [toStringKey()](TokenClassKey.md#tostringkey)
  - [validate()](TokenClassKey.md#validate)
  - [validateOrReject()](TokenClassKey.md#validateorreject)
  - [deserialize()](TokenClassKey.md#deserialize)
  - [toStringKey()](TokenClassKey.md#tostringkey-1)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new TokenClassKey()

> **new TokenClassKey**(): [`TokenClassKey`](TokenClassKey.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L58)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L52)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:49](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L49)

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

[chain-api/src/types/TokenClass.ts:55](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L55)

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

### allKeysPresent()

> **allKeysPresent**(): `boolean`

#### Source

[chain-api/src/types/TokenClass.ts:74](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L74)

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

> **signed**(`privateKey`, `useDer`): [`TokenClassKey`](TokenClassKey.md)

Creates a signed copy of current object.

#### Parameters

▪ **privateKey**: `string`

▪ **useDer**: `boolean`= `false`

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`signed`](ChainCallDTO.md#signed)

#### Source

[chain-api/src/types/dtos.ts:179](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L179)

***

### toString()

> **toString**(): `string`

#### Source

[chain-api/src/types/TokenClass.ts:60](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L60)

***

### toStringKey()

> **toStringKey**(): `string`

#### Source

[chain-api/src/types/TokenClass.ts:64](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L64)

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

### toStringKey()

> **`static`** **toStringKey**(`props`): `string`

#### Parameters

▪ **props**: [`TokenClassKeyProperties`](../interfaces/TokenClassKeyProperties.md)

#### Source

[chain-api/src/types/TokenClass.ts:69](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L69)
