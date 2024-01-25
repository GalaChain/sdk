**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > FullAllowanceCheckDto

# Class: FullAllowanceCheckDto

## Contents

- [Extends](FullAllowanceCheckDto.md#extends)
- [Constructors](FullAllowanceCheckDto.md#constructors)
  - [new FullAllowanceCheckDto()](FullAllowanceCheckDto.md#new-fullallowancecheckdto)
- [Properties](FullAllowanceCheckDto.md#properties)
  - [additionalKey](FullAllowanceCheckDto.md#additionalkey)
  - [allowanceType](FullAllowanceCheckDto.md#allowancetype)
  - [category](FullAllowanceCheckDto.md#category)
  - [collection](FullAllowanceCheckDto.md#collection)
  - [grantedTo](FullAllowanceCheckDto.md#grantedto)
  - [owner](FullAllowanceCheckDto.md#owner)
  - [signature](FullAllowanceCheckDto.md#signature)
  - [signerPublicKey](FullAllowanceCheckDto.md#signerpublickey)
  - [trace](FullAllowanceCheckDto.md#trace)
  - [type](FullAllowanceCheckDto.md#type)
  - [uniqueKey](FullAllowanceCheckDto.md#uniquekey)
  - [ENCODING](FullAllowanceCheckDto.md#encoding)
- [Methods](FullAllowanceCheckDto.md#methods)
  - [isSignatureValid()](FullAllowanceCheckDto.md#issignaturevalid)
  - [serialize()](FullAllowanceCheckDto.md#serialize)
  - [sign()](FullAllowanceCheckDto.md#sign)
  - [signed()](FullAllowanceCheckDto.md#signed)
  - [validate()](FullAllowanceCheckDto.md#validate)
  - [validateOrReject()](FullAllowanceCheckDto.md#validateorreject)
  - [deserialize()](FullAllowanceCheckDto.md#deserialize)

## Extends

- [`ChainCallDTO`](ChainCallDTO.md)

## Constructors

### new FullAllowanceCheckDto()

> **new FullAllowanceCheckDto**(): [`FullAllowanceCheckDto`](FullAllowanceCheckDto.md)

#### Inherited from

[`ChainCallDTO`](ChainCallDTO.md).[`constructor`](ChainCallDTO.md#constructors)

## Properties

### additionalKey

> **additionalKey**?: `string`

#### Source

[chain-api/src/types/allowance.ts:425](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L425)

***

### allowanceType

> **allowanceType**?: [`AllowanceType`](../enumerations/AllowanceType.md)

#### Source

[chain-api/src/types/allowance.ts:432](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L432)

***

### category

> **category**?: `string`

#### Source

[chain-api/src/types/allowance.ts:412](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L412)

***

### collection

> **collection**?: `string`

#### Source

[chain-api/src/types/allowance.ts:405](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L405)

***

### grantedTo

> **grantedTo**?: `string`

#### Source

[chain-api/src/types/allowance.ts:398](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L398)

***

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/allowance.ts:390](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L390)

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

[chain-api/src/types/allowance.ts:419](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/allowance.ts#L419)

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

> **signed**(`privateKey`, `useDer`): [`FullAllowanceCheckDto`](FullAllowanceCheckDto.md)

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
