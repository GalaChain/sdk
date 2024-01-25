**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenInstanceQuantity

# Class: TokenInstanceQuantity

## Contents

- [Extends](TokenInstanceQuantity.md#extends)
- [Constructors](TokenInstanceQuantity.md#constructors)
  - [new TokenInstanceQuantity()](TokenInstanceQuantity.md#new-tokeninstancequantity)
- [Properties](TokenInstanceQuantity.md#properties)
  - [quantity](TokenInstanceQuantity.md#quantity)
  - [signature](TokenInstanceQuantity.md#signature)
  - [signerPublicKey](TokenInstanceQuantity.md#signerpublickey)
  - [tokenInstance](TokenInstanceQuantity.md#tokeninstance)
  - [tokenMetadata](TokenInstanceQuantity.md#tokenmetadata)
  - [trace](TokenInstanceQuantity.md#trace)
  - [uniqueKey](TokenInstanceQuantity.md#uniquekey)
  - [ENCODING](TokenInstanceQuantity.md#encoding)
- [Methods](TokenInstanceQuantity.md#methods)
  - [getTokenClassKey()](TokenInstanceQuantity.md#gettokenclasskey)
  - [isSignatureValid()](TokenInstanceQuantity.md#issignaturevalid)
  - [serialize()](TokenInstanceQuantity.md#serialize)
  - [sign()](TokenInstanceQuantity.md#sign)
  - [signed()](TokenInstanceQuantity.md#signed)
  - [toString()](TokenInstanceQuantity.md#tostring)
  - [toStringKey()](TokenInstanceQuantity.md#tostringkey)
  - [validate()](TokenInstanceQuantity.md#validate)
  - [validateOrReject()](TokenInstanceQuantity.md#validateorreject)
  - [deserialize()](TokenInstanceQuantity.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new TokenInstanceQuantity()

> **new TokenInstanceQuantity**(): [`TokenInstanceQuantity`](TokenInstanceQuantity.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenInstance.ts:127](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L127)

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

[chain-api/src/types/TokenInstance.ts:122](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L122)

***

### tokenMetadata

> **tokenMetadata**?: [`TokenClass`](TokenClass.md)

#### Source

[chain-api/src/types/TokenInstance.ts:135](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L135)

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

## Methods

### getTokenClassKey()

> **getTokenClassKey**(`this`): [`TokenClassKey`](TokenClassKey.md)

#### Parameters

▪ **this**: [`TokenInstanceQuantity`](TokenInstanceQuantity.md)

#### Source

[chain-api/src/types/TokenInstance.ts:137](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L137)

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

> **signed**(`privateKey`, `useDer`): [`TokenInstanceQuantity`](TokenInstanceQuantity.md)

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

> **toString**(`this`): `string`

#### Parameters

▪ **this**: [`TokenInstanceQuantity`](TokenInstanceQuantity.md)

#### Source

[chain-api/src/types/TokenInstance.ts:141](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L141)

***

### toStringKey()

> **toStringKey**(`this`): `string`

#### Parameters

▪ **this**: [`TokenInstanceQuantity`](TokenInstanceQuantity.md)

#### Source

[chain-api/src/types/TokenInstance.ts:145](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L145)

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
