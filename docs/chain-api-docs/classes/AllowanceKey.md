**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > AllowanceKey

# Class: AllowanceKey

## Contents

- [Extends](AllowanceKey.md#extends)
- [Constructors](AllowanceKey.md#constructors)
  - [new AllowanceKey()](AllowanceKey.md#new-allowancekey)
- [Properties](AllowanceKey.md#properties)
  - [additionalKey](AllowanceKey.md#additionalkey)
  - [allowanceType](AllowanceKey.md#allowancetype)
  - [category](AllowanceKey.md#category)
  - [collection](AllowanceKey.md#collection)
  - [created](AllowanceKey.md#created)
  - [grantedBy](AllowanceKey.md#grantedby)
  - [grantedTo](AllowanceKey.md#grantedto)
  - [instance](AllowanceKey.md#instance)
  - [signature](AllowanceKey.md#signature)
  - [signerPublicKey](AllowanceKey.md#signerpublickey)
  - [trace](AllowanceKey.md#trace)
  - [type](AllowanceKey.md#type)
  - [uniqueKey](AllowanceKey.md#uniquekey)
  - [ENCODING](AllowanceKey.md#encoding)
- [Methods](AllowanceKey.md#methods)
  - [isSignatureValid()](AllowanceKey.md#issignaturevalid)
  - [serialize()](AllowanceKey.md#serialize)
  - [sign()](AllowanceKey.md#sign)
  - [signed()](AllowanceKey.md#signed)
  - [validate()](AllowanceKey.md#validate)
  - [validateOrReject()](AllowanceKey.md#validateorreject)
  - [deserialize()](AllowanceKey.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new AllowanceKey()

> **new AllowanceKey**(): [`AllowanceKey`](AllowanceKey.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/common.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L52)

***

### allowanceType

> **allowanceType**: [`AllowanceType`](../enumerations/AllowanceType.md)

#### Source

[chain-api/src/types/common.ts:61](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L61)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/common.ts:46](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L46)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/common.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L43)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/common.ts:68](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L68)

***

### grantedBy

> **grantedBy**: `string`

#### Source

[chain-api/src/types/common.ts:64](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L64)

***

### grantedTo

> **grantedTo**: `string`

#### Source

[chain-api/src/types/common.ts:40](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L40)

***

### instance

> **instance**: `BigNumber`

#### Source

[chain-api/src/types/common.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L58)

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

[chain-api/src/types/common.ts:49](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/common.ts#L49)

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

> **signed**(`privateKey`, `useDer`): [`AllowanceKey`](AllowanceKey.md)

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
