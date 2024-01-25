**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenMintRequest

# Class: TokenMintRequest

## Contents

- [Extends](TokenMintRequest.md#extends)
- [Constructors](TokenMintRequest.md#constructors)
  - [new TokenMintRequest()](TokenMintRequest.md#new-tokenmintrequest)
- [Properties](TokenMintRequest.md#properties)
  - [additionalKey](TokenMintRequest.md#additionalkey)
  - [allowanceKey](TokenMintRequest.md#allowancekey)
  - [category](TokenMintRequest.md#category)
  - [collection](TokenMintRequest.md#collection)
  - [created](TokenMintRequest.md#created)
  - [epoch](TokenMintRequest.md#epoch)
  - [id](TokenMintRequest.md#id)
  - [owner](TokenMintRequest.md#owner)
  - [quantity](TokenMintRequest.md#quantity)
  - [requestor](TokenMintRequest.md#requestor)
  - [state](TokenMintRequest.md#state)
  - [timeKey](TokenMintRequest.md#timekey)
  - [totalKnownMintsCount](TokenMintRequest.md#totalknownmintscount)
  - [type](TokenMintRequest.md#type)
  - [INDEX\_KEY](TokenMintRequest.md#index-key)
  - [OBJECT\_TYPE](TokenMintRequest.md#object-type)
- [Methods](TokenMintRequest.md#methods)
  - [fulfill()](TokenMintRequest.md#fulfill)
  - [fulfillmentKey()](TokenMintRequest.md#fulfillmentkey)
  - [getRangedKey()](TokenMintRequest.md#getrangedkey)
  - [requestId()](TokenMintRequest.md#requestid)
  - [serialize()](TokenMintRequest.md#serialize)
  - [toPlainObject()](TokenMintRequest.md#toplainobject)
  - [validate()](TokenMintRequest.md#validate)
  - [validateOrReject()](TokenMintRequest.md#validateorreject)
  - [deserialize()](TokenMintRequest.md#deserialize)
  - [getRangedKeyFromParts()](TokenMintRequest.md#getrangedkeyfromparts)
  - [getStringKeyFromParts()](TokenMintRequest.md#getstringkeyfromparts)

## Extends

- [`RangedChainObject`](RangedChainObject.md)

## Constructors

### new TokenMintRequest()

> **new TokenMintRequest**(): [`TokenMintRequest`](TokenMintRequest.md)

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`constructor`](RangedChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:44](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L44)

***

### allowanceKey

> **allowanceKey**?: [`AllowanceKey`](AllowanceKey.md)

#### Source

[chain-api/src/types/TokenMintRequest.ts:83](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L83)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:36](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L36)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:32](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L32)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/TokenMintRequest.ts:62](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L62)

***

### epoch

> **epoch**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:78](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L78)

***

### id

> **id**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:73](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L73)

***

### owner

> **owner**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L52)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintRequest.ts:67](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L67)

***

### requestor

> **requestor**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:59](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L59)

***

### state

> **state**: [`TokenMintStatus`](../enumerations/TokenMintStatus.md)

#### Source

[chain-api/src/types/TokenMintRequest.ts:70](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L70)

***

### timeKey

> **timeKey**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L48)

***

### totalKnownMintsCount

> **totalKnownMintsCount**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintRequest.ts:56](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L56)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:40](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L40)

***

### INDEX\_KEY

> **`static`** **INDEX\_KEY**: `string` = `"GCTMR"`

#### Source

[chain-api/src/types/TokenMintRequest.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L27)

***

### OBJECT\_TYPE

> **`static`** **OBJECT\_TYPE**: `string` = `"TokenMintRequest"`

#### Source

[chain-api/src/types/TokenMintRequest.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L28)

## Methods

### fulfill()

> **fulfill**(`qty`): [`TokenMintFulfillment`](TokenMintFulfillment.md)

#### Parameters

▪ **qty**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintRequest.ts:117](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L117)

***

### fulfillmentKey()

> **fulfillmentKey**(): `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:101](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L101)

***

### getRangedKey()

> **getRangedKey**(): `string`

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`getRangedKey`](RangedChainObject.md#getrangedkey)

#### Source

[chain-api/src/types/RangedChainObject.ts:63](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L63)

***

### requestId()

> **requestId**(): `string`

#### Source

[chain-api/src/types/TokenMintRequest.ts:85](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintRequest.ts#L85)

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
