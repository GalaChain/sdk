**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenMintAllowanceRequest

# Class: TokenMintAllowanceRequest

## Contents

- [Extends](TokenMintAllowanceRequest.md#extends)
- [Constructors](TokenMintAllowanceRequest.md#constructors)
  - [new TokenMintAllowanceRequest()](TokenMintAllowanceRequest.md#new-tokenmintallowancerequest)
- [Properties](TokenMintAllowanceRequest.md#properties)
  - [additionalKey](TokenMintAllowanceRequest.md#additionalkey)
  - [category](TokenMintAllowanceRequest.md#category)
  - [collection](TokenMintAllowanceRequest.md#collection)
  - [created](TokenMintAllowanceRequest.md#created)
  - [epoch](TokenMintAllowanceRequest.md#epoch)
  - [expires](TokenMintAllowanceRequest.md#expires)
  - [grantedBy](TokenMintAllowanceRequest.md#grantedby)
  - [grantedTo](TokenMintAllowanceRequest.md#grantedto)
  - [id](TokenMintAllowanceRequest.md#id)
  - [quantity](TokenMintAllowanceRequest.md#quantity)
  - [state](TokenMintAllowanceRequest.md#state)
  - [timeKey](TokenMintAllowanceRequest.md#timekey)
  - [totalKnownMintAllowancesCount](TokenMintAllowanceRequest.md#totalknownmintallowancescount)
  - [type](TokenMintAllowanceRequest.md#type)
  - [uses](TokenMintAllowanceRequest.md#uses)
  - [INDEX\_KEY](TokenMintAllowanceRequest.md#index-key)
- [Methods](TokenMintAllowanceRequest.md#methods)
  - [fulfill()](TokenMintAllowanceRequest.md#fulfill)
  - [fulfillmentKey()](TokenMintAllowanceRequest.md#fulfillmentkey)
  - [getRangedKey()](TokenMintAllowanceRequest.md#getrangedkey)
  - [requestId()](TokenMintAllowanceRequest.md#requestid)
  - [serialize()](TokenMintAllowanceRequest.md#serialize)
  - [toPlainObject()](TokenMintAllowanceRequest.md#toplainobject)
  - [validate()](TokenMintAllowanceRequest.md#validate)
  - [validateOrReject()](TokenMintAllowanceRequest.md#validateorreject)
  - [deserialize()](TokenMintAllowanceRequest.md#deserialize)
  - [getRangedKeyFromParts()](TokenMintAllowanceRequest.md#getrangedkeyfromparts)
  - [getStringKeyFromParts()](TokenMintAllowanceRequest.md#getstringkeyfromparts)

## Extends

- [`RangedChainObject`](RangedChainObject.md)

## Constructors

### new TokenMintAllowanceRequest()

> **new TokenMintAllowanceRequest**(): [`TokenMintAllowanceRequest`](TokenMintAllowanceRequest.md)

#### Inherited from

[`RangedChainObject`](RangedChainObject.md).[`constructor`](RangedChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L43)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:35](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L35)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L31)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L58)

***

### epoch

> **epoch**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:84](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L84)

***

### expires

> **expires**?: `number`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:79](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L79)

***

### grantedBy

> **grantedBy**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:61](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L61)

***

### grantedTo

> **grantedTo**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:51](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L51)

***

### id

> **id**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:72](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L72)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:66](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L66)

***

### state

> **state**: [`TokenMintStatus`](../enumerations/TokenMintStatus.md)

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:69](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L69)

***

### timeKey

> **timeKey**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:47](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L47)

***

### totalKnownMintAllowancesCount

> **totalKnownMintAllowancesCount**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:55](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L55)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:39](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L39)

***

### uses

> **uses**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:76](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L76)

***

### INDEX\_KEY

> **`static`** **INDEX\_KEY**: `string` = `"GCTMAR"`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L27)

## Methods

### fulfill()

> **fulfill**(`instance`): [[`TokenMintAllowance`](TokenMintAllowance.md), [`TokenAllowance`](TokenAllowance.md)]

#### Parameters

▪ **instance**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:134](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L134)

***

### fulfillmentKey()

> **fulfillmentKey**(): `string`

#### Source

[chain-api/src/types/TokenMintAllowanceRequest.ts:110](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L110)

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

[chain-api/src/types/TokenMintAllowanceRequest.ts:86](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowanceRequest.ts#L86)

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
