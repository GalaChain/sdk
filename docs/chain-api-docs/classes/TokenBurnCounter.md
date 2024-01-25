**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenBurnCounter

# Class: TokenBurnCounter

## Contents

- [Extends](TokenBurnCounter.md#extends)
- [Constructors](TokenBurnCounter.md#constructors)
  - [new TokenBurnCounter()](TokenBurnCounter.md#new-tokenburncounter)
- [Properties](TokenBurnCounter.md#properties)
  - [additionalKey](TokenBurnCounter.md#additionalkey)
  - [burnedBy](TokenBurnCounter.md#burnedby)
  - [category](TokenBurnCounter.md#category)
  - [collection](TokenBurnCounter.md#collection)
  - [created](TokenBurnCounter.md#created)
  - [epoch](TokenBurnCounter.md#epoch)
  - [instance](TokenBurnCounter.md#instance)
  - [quantity](TokenBurnCounter.md#quantity)
  - [referenceId](TokenBurnCounter.md#referenceid)
  - [timeKey](TokenBurnCounter.md#timekey)
  - [totalKnownBurnsCount](TokenBurnCounter.md#totalknownburnscount)
  - [type](TokenBurnCounter.md#type)
  - [INDEX\_KEY](TokenBurnCounter.md#index-key)
- [Methods](TokenBurnCounter.md#methods)
  - [getRangedKey()](TokenBurnCounter.md#getrangedkey)
  - [referencedBurnId()](TokenBurnCounter.md#referencedburnid)
  - [serialize()](TokenBurnCounter.md#serialize)
  - [toPlainObject()](TokenBurnCounter.md#toplainobject)
  - [validate()](TokenBurnCounter.md#validate)
  - [validateOrReject()](TokenBurnCounter.md#validateorreject)
  - [deserialize()](TokenBurnCounter.md#deserialize)
  - [getRangedKeyFromParts()](TokenBurnCounter.md#getrangedkeyfromparts)
  - [getStringKeyFromParts()](TokenBurnCounter.md#getstringkeyfromparts)

## Extends

- [`RangedChainObject`](RangedChainObject.md)

## Constructors

### new TokenBurnCounter()

> **new TokenBurnCounter**(): [`TokenBurnCounter`](TokenBurnCounter.md)

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`constructor`](RangedChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:41](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L41)

***

### burnedBy

> **burnedBy**: `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:49](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L49)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:33](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L33)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L29)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:64](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L64)

***

### epoch

> **epoch**: `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:78](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L78)

***

### instance

> **instance**: `BigNumber`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:56](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L56)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:69](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L69)

***

### referenceId

> **referenceId**: `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:73](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L73)

***

### timeKey

> **timeKey**: `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:45](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L45)

***

### totalKnownBurnsCount

> **totalKnownBurnsCount**: `BigNumber`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:61](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L61)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:37](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L37)

***

### INDEX\_KEY

> **`static`** **INDEX\_KEY**: `string` = `"GCTBRC"`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L25)

## Methods

### getRangedKey()

> **getRangedKey**(): `string`

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`getRangedKey`](RangedChainObject.md#getrangedkey)

#### Source

[chain-api/src/types/RangedChainObject.ts:63](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L63)

***

### referencedBurnId()

> **referencedBurnId**(): `string`

#### Source

[chain-api/src/types/TokenBurnCounter.ts:81](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurnCounter.ts#L81)

***

### serialize()

> **serialize**(): `string`

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`serialize`](RangedChainObject.md#serialize)

#### Source

[chain-api/src/types/RangedChainObject.ts:36](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L36)

***

### toPlainObject()

> **toPlainObject**(): `Record`\<`string`, `unknown`\>

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`toPlainObject`](RangedChainObject.md#toplainobject)

#### Source

[chain-api/src/types/RangedChainObject.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L52)

***

### validate()

> **validate**(): `Promise`\<`ValidationError`[]\>

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`validate`](RangedChainObject.md#validate)

#### Source

[chain-api/src/types/RangedChainObject.ts:40](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L40)

***

### validateOrReject()

> **validateOrReject**(): `Promise`\<`void`\>

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`validateOrReject`](RangedChainObject.md#validateorreject)

#### Source

[chain-api/src/types/RangedChainObject.ts:44](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L44)

***

### deserialize()

> **`static`** **deserialize**\<`T`\>(`constructor`, `object`): `T`

#### Type parameters

▪ **T**

#### Parameters

▪ **constructor**: [`ClassConstructor`](../interfaces/ClassConstructor.md)\<[`Inferred`](../type-aliases/Inferred.md)\<`T`, [`RangedChainObject`](RangedChainObject.md)\>\>

▪ **object**: `string` \| `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`deserialize`](RangedChainObject.md#deserialize)

#### Source

[chain-api/src/types/RangedChainObject.ts:56](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L56)

***

### getRangedKeyFromParts()

> **`static`** **getRangedKeyFromParts**(`indexKey`, `parts`): `string`

#### Parameters

▪ **indexKey**: `string`

▪ **parts**: `unknown`[]

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`getRangedKeyFromParts`](RangedChainObject.md#getrangedkeyfromparts)

#### Source

[chain-api/src/types/RangedChainObject.ts:83](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L83)

***

### getStringKeyFromParts()

> **`static`** **getStringKeyFromParts**(`parts`): `string`

#### Parameters

▪ **parts**: `string`[]

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`getStringKeyFromParts`](RangedChainObject.md#getstringkeyfromparts)

#### Source

[chain-api/src/types/RangedChainObject.ts:100](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L100)
