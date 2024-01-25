**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenMintFulfillment

# Class: TokenMintFulfillment

## Contents

- [Extends](TokenMintFulfillment.md#extends)
- [Constructors](TokenMintFulfillment.md#constructors)
  - [new TokenMintFulfillment()](TokenMintFulfillment.md#new-tokenmintfulfillment)
- [Properties](TokenMintFulfillment.md#properties)
  - [additionalKey](TokenMintFulfillment.md#additionalkey)
  - [category](TokenMintFulfillment.md#category)
  - [collection](TokenMintFulfillment.md#collection)
  - [created](TokenMintFulfillment.md#created)
  - [id](TokenMintFulfillment.md#id)
  - [owner](TokenMintFulfillment.md#owner)
  - [quantity](TokenMintFulfillment.md#quantity)
  - [requestCreated](TokenMintFulfillment.md#requestcreated)
  - [requestor](TokenMintFulfillment.md#requestor)
  - [state](TokenMintFulfillment.md#state)
  - [type](TokenMintFulfillment.md#type)
  - [COMPOSITEKEY\_NS](TokenMintFulfillment.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](TokenMintFulfillment.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](TokenMintFulfillment.md#id-sub-split-char)
  - [INDEX\_KEY](TokenMintFulfillment.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](TokenMintFulfillment.md#min-unicode-rune-value)
- [Methods](TokenMintFulfillment.md#methods)
  - [getCompositeKey()](TokenMintFulfillment.md#getcompositekey)
  - [serialize()](TokenMintFulfillment.md#serialize)
  - [toPlainObject()](TokenMintFulfillment.md#toplainobject)
  - [validate()](TokenMintFulfillment.md#validate)
  - [validateOrReject()](TokenMintFulfillment.md#validateorreject)
  - [deserialize()](TokenMintFulfillment.md#deserialize)
  - [getCompositeKeyFromParts()](TokenMintFulfillment.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](TokenMintFulfillment.md#getstringkeyfromparts)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new TokenMintFulfillment()

> **new TokenMintFulfillment**(): [`TokenMintFulfillment`](TokenMintFulfillment.md)

#### Inherited from

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:39](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L39)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L31)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L27)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:64](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L64)

***

### id

> **id**: `string`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:61](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L61)

***

### owner

> **owner**: `string`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:50](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L50)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:55](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L55)

***

### requestCreated

> **requestCreated**: `number`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:47](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L47)

***

### requestor

> **requestor**: `string`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L43)

***

### state

> **state**: [`TokenMintStatus`](../enumerations/TokenMintStatus.md)

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L58)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:35](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L35)

***

### COMPOSITEKEY\_NS

> **`static`** **COMPOSITEKEY\_NS**: `string` = `"\x00"`

#### Inherited from

[`ChainObject`](ChainObject.md).[`COMPOSITEKEY_NS`](ChainObject.md#compositekey-ns)

#### Source

[chain-api/src/types/ChainObject.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L43)

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

> **`static`** **INDEX\_KEY**: `string` = `"GCTMF"`

#### Source

[chain-api/src/types/TokenMintFulfillment.ts:24](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintFulfillment.ts#L24)

***

### MIN\_UNICODE\_RUNE\_VALUE

> **`static`** **MIN\_UNICODE\_RUNE\_VALUE**: `string` = `"\u0000"`

#### Inherited from

[`ChainObject`](ChainObject.md).[`MIN_UNICODE_RUNE_VALUE`](ChainObject.md#min-unicode-rune-value)

#### Source

[chain-api/src/types/ChainObject.ts:41](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L41)

## Methods

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
