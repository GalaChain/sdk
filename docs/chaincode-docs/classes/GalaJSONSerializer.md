**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > GalaJSONSerializer

# Class: GalaJSONSerializer

Buffers are converted to the format of {type:'Buffer', data:xxxxx }
If an object has a toJSON() method then that will be used - as this uses
serialize() from @gala-chain/sdk

## Contents

- [Constructors](GalaJSONSerializer.md#constructors)
  - [new GalaJSONSerializer()](GalaJSONSerializer.md#new-galajsonserializer)
- [Methods](GalaJSONSerializer.md#methods)
  - [\_fromString()](GalaJSONSerializer.md#fromstring)
  - [fromBuffer()](GalaJSONSerializer.md#frombuffer)
  - [toBuffer()](GalaJSONSerializer.md#tobuffer)

## Constructors

### new GalaJSONSerializer()

> **new GalaJSONSerializer**(): [`GalaJSONSerializer`](GalaJSONSerializer.md)

## Methods

### \_fromString()

> **\_fromString**(`stringData`, `fullschema`, `loggerPrefix`): `object`

#### Parameters

▪ **stringData**: `string`

▪ **fullschema**: `any`

▪ **loggerPrefix**: `any`

#### Returns

> ##### jsonForValidation
>
> > **jsonForValidation**: `any`
>
> ##### value
>
> > **value**: `any`
>

#### Source

[chaincode/src/utils/GalaJSONSerializer.ts:101](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/utils/GalaJSONSerializer.ts#L101)

***

### fromBuffer()

> **fromBuffer**(`data`, `fullschema`, `loggerPrefix`): `object`

Inflates the data to the object or other type

If on inflation the object has a type field that will throw
an error if it is not 'Buffer'

#### Parameters

▪ **data**: `any`

byte buffer containing the data

▪ **fullschema**: `any`

▪ **loggerPrefix**: `any`

#### Returns

the resulting type

> ##### jsonForValidation
>
> > **jsonForValidation**: `any`
>
> ##### value
>
> > **value**: `any`
>

#### Source

[chaincode/src/utils/GalaJSONSerializer.ts:86](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/utils/GalaJSONSerializer.ts#L86)

***

### toBuffer()

> **toBuffer**(`result`, `schema`, `loggerPrefix`?): `undefined` \| `Buffer`

Takes the result and produces a buffer that matches this serialization format

#### Parameters

▪ **result**: `any`

to be converted

▪ **schema**: `object`= `{}`

▪ **schema.type?**: `string`

▪ **loggerPrefix?**: `string`

#### Returns

container the encoded data

#### Source

[chaincode/src/utils/GalaJSONSerializer.ts:44](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/utils/GalaJSONSerializer.ts#L44)
