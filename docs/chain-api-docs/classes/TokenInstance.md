**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenInstance

# Class: TokenInstance

## Contents

- [Extends](TokenInstance.md#extends)
- [Constructors](TokenInstance.md#constructors)
  - [new TokenInstance()](TokenInstance.md#new-tokeninstance)
- [Properties](TokenInstance.md#properties)
  - [additionalKey](TokenInstance.md#additionalkey)
  - [category](TokenInstance.md#category)
  - [collection](TokenInstance.md#collection)
  - [instance](TokenInstance.md#instance)
  - [isNonFungible](TokenInstance.md#isnonfungible)
  - [owner](TokenInstance.md#owner)
  - [type](TokenInstance.md#type)
  - [COMPOSITEKEY\_NS](TokenInstance.md#compositekey-ns)
  - [FUNGIBLE\_TOKEN\_INSTANCE](TokenInstance.md#fungible-token-instance)
  - [ID\_SPLIT\_CHAR](TokenInstance.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](TokenInstance.md#id-sub-split-char)
  - [INDEX\_KEY](TokenInstance.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](TokenInstance.md#min-unicode-rune-value)
- [Methods](TokenInstance.md#methods)
  - [GetCompositeKeyString()](TokenInstance.md#getcompositekeystring)
  - [getCompositeKey()](TokenInstance.md#getcompositekey)
  - [serialize()](TokenInstance.md#serialize)
  - [toPlainObject()](TokenInstance.md#toplainobject)
  - [validate()](TokenInstance.md#validate)
  - [validateOrReject()](TokenInstance.md#validateorreject)
  - [CreateCompositeKey()](TokenInstance.md#createcompositekey)
  - [GetCompositeKeyFromString()](TokenInstance.md#getcompositekeyfromstring)
  - [GetFungibleInstanceFromClass()](TokenInstance.md#getfungibleinstancefromclass)
  - [buildInstanceKeyList()](TokenInstance.md#buildinstancekeylist)
  - [buildInstanceKeyObject()](TokenInstance.md#buildinstancekeyobject)
  - [deserialize()](TokenInstance.md#deserialize)
  - [getCompositeKeyFromParts()](TokenInstance.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](TokenInstance.md#getstringkeyfromparts)
  - [isFungible()](TokenInstance.md#isfungible)
  - [isNFT()](TokenInstance.md#isnft)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new TokenInstance()

> **new TokenInstance**(): [`TokenInstance`](TokenInstance.md)

#### Inherited from

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:250](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L250)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:242](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L242)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:238](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L238)

***

### instance

> **instance**: `BigNumber`

#### Source

[chain-api/src/types/TokenInstance.ts:257](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L257)

***

### isNonFungible

> **isNonFungible**: `boolean`

#### Source

[chain-api/src/types/TokenInstance.ts:260](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L260)

***

### owner

> **owner**?: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:264](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L264)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:246](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L246)

***

### COMPOSITEKEY\_NS

> **`static`** **COMPOSITEKEY\_NS**: `string` = `"\x00"`

#### Inherited from

[`ChainObject`](ChainObject.md).[`COMPOSITEKEY_NS`](ChainObject.md#compositekey-ns)

#### Source

[chain-api/src/types/ChainObject.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L43)

***

### FUNGIBLE\_TOKEN\_INSTANCE

> **`static`** **FUNGIBLE\_TOKEN\_INSTANCE**: `BigNumber`

#### Source

[chain-api/src/types/TokenInstance.ts:268](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L268)

***

### ID\_SPLIT\_CHAR

> **`static`** **ID\_SPLIT\_CHAR**: `string` = `"$"`

#### Inherited from

[`ChainObject`](ChainObject.md).[`ID_SPLIT_CHAR`](ChainObject.md#id-split-char)

#### Source

[chain-api/src/types/ChainObject.ts:46](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L46)

***

### ID\_SUB\_SPLIT\_CHAR

> **`static`** **ID\_SUB\_SPLIT\_CHAR**: `string` = `"|"`

#### Inherited from

[`ChainObject`](ChainObject.md).[`ID_SUB_SPLIT_CHAR`](ChainObject.md#id-sub-split-char)

#### Source

[chain-api/src/types/ChainObject.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L48)

***

### INDEX\_KEY

> **`static`** **INDEX\_KEY**: `string` = `"GCTI2"`

#### Source

[chain-api/src/types/TokenInstance.ts:266](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L266)

***

### MIN\_UNICODE\_RUNE\_VALUE

> **`static`** **MIN\_UNICODE\_RUNE\_VALUE**: `string` = `"\u0000"`

#### Inherited from

[`ChainObject`](ChainObject.md).[`MIN_UNICODE_RUNE_VALUE`](ChainObject.md#min-unicode-rune-value)

#### Source

[chain-api/src/types/ChainObject.ts:41](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L41)

## Methods

### GetCompositeKeyString()

> **GetCompositeKeyString**(): `string`

#### Source

[chain-api/src/types/TokenInstance.ts:272](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L272)

***

### getCompositeKey()

> **getCompositeKey**(): `string`

#### Inherited from

[`ChainObject`](ChainObject.md).[`getCompositeKey`](ChainObject.md#getcompositekey)

#### Source

[chain-api/src/types/ChainObject.ts:77](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L77)

***

### serialize()

> **serialize**(): `string`

#### Inherited from

[`ChainObject`](ChainObject.md).[`serialize`](ChainObject.md#serialize)

#### Source

[chain-api/src/types/ChainObject.ts:50](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L50)

***

### toPlainObject()

> **toPlainObject**(): `Record`\<`string`, `unknown`\>

#### Inherited from

[`ChainObject`](ChainObject.md).[`toPlainObject`](ChainObject.md#toplainobject)

#### Source

[chain-api/src/types/ChainObject.ts:66](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L66)

***

### validate()

> **validate**(): `Promise`\<`ValidationError`[]\>

#### Inherited from

[`ChainObject`](ChainObject.md).[`validate`](ChainObject.md#validate)

#### Source

[chain-api/src/types/ChainObject.ts:54](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L54)

***

### validateOrReject()

> **validateOrReject**(): `Promise`\<`void`\>

#### Inherited from

[`ChainObject`](ChainObject.md).[`validateOrReject`](ChainObject.md#validateorreject)

#### Source

[chain-api/src/types/ChainObject.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L58)

***

### CreateCompositeKey()

> **`static`** **CreateCompositeKey**(`token`): `string`

#### Parameters

▪ **token**: [`TokenInstanceKeyProperties`](../interfaces/TokenInstanceKeyProperties.md)

#### Source

[chain-api/src/types/TokenInstance.ts:288](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L288)

***

### GetCompositeKeyFromString()

> **`static`** **GetCompositeKeyFromString**(`tokenCid`): `string`

#### Parameters

▪ **tokenCid**: `string`

#### Source

[chain-api/src/types/TokenInstance.ts:298](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L298)

***

### GetFungibleInstanceFromClass()

> **`static`** **GetFungibleInstanceFromClass**(`token`): `string`

#### Parameters

▪ **token**: [`TokenClassKeyProperties`](../interfaces/TokenClassKeyProperties.md)

#### Source

[chain-api/src/types/TokenInstance.ts:277](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L277)

***

### buildInstanceKeyList()

> **`static`** **buildInstanceKeyList**(`token`): [`string`, `string`, `string`, `string`, `string`]

#### Parameters

▪ **token**: [`TokenInstanceKeyProperties`](../interfaces/TokenInstanceKeyProperties.md)

#### Source

[chain-api/src/types/TokenInstance.ts:310](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L310)

***

### buildInstanceKeyObject()

> **`static`** **buildInstanceKeyObject**(`token`): `Promise`\<[`TokenInstanceKey`](TokenInstanceKey.md)\>

#### Parameters

▪ **token**: [`TokenInstanceKeyProperties`](../interfaces/TokenInstanceKeyProperties.md)

#### Source

[chain-api/src/types/TokenInstance.ts:318](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L318)

***

### deserialize()

> **`static`** **deserialize**\<`T`\>(`constructor`, `object`): `T`

#### Type parameters

▪ **T**

#### Parameters

▪ **constructor**: [`ClassConstructor`](../interfaces/ClassConstructor.md)\<[`Inferred`](../type-aliases/Inferred.md)\<`T`, [`ChainObject`](ChainObject.md)\>\>

▪ **object**: `string` \| `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]

#### Inherited from

[`ChainObject`](ChainObject.md).[`deserialize`](ChainObject.md#deserialize)

#### Source

[chain-api/src/types/ChainObject.ts:70](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L70)

***

### getCompositeKeyFromParts()

> **`static`** **getCompositeKeyFromParts**(`indexKey`, `parts`): `string`

#### Parameters

▪ **indexKey**: `string`

▪ **parts**: `unknown`[]

#### Inherited from

[`ChainObject`](ChainObject.md).[`getCompositeKeyFromParts`](ChainObject.md#getcompositekeyfromparts)

#### Source

[chain-api/src/types/ChainObject.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L99)

***

### getStringKeyFromParts()

> **`static`** **getStringKeyFromParts**(`parts`): `string`

#### Parameters

▪ **parts**: `string`[]

#### Inherited from

[`ChainObject`](ChainObject.md).[`getStringKeyFromParts`](ChainObject.md#getstringkeyfromparts)

#### Source

[chain-api/src/types/ChainObject.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L119)

***

### isFungible()

> **`static`** **isFungible**(`instanceId`): `boolean`

#### Parameters

▪ **instanceId**: `BigNumber`

#### Source

[chain-api/src/types/TokenInstance.ts:336](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L336)

***

### isNFT()

> **`static`** **isNFT**(`instanceId`): `boolean`

#### Parameters

▪ **instanceId**: `BigNumber`

#### Source

[chain-api/src/types/TokenInstance.ts:340](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenInstance.ts#L340)
