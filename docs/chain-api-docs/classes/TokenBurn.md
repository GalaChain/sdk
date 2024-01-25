**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenBurn

# Class: TokenBurn

## Contents

- [Extends](TokenBurn.md#extends)
- [Constructors](TokenBurn.md#constructors)
  - [new TokenBurn()](TokenBurn.md#new-tokenburn)
- [Properties](TokenBurn.md#properties)
  - [additionalKey](TokenBurn.md#additionalkey)
  - [burnedBy](TokenBurn.md#burnedby)
  - [category](TokenBurn.md#category)
  - [collection](TokenBurn.md#collection)
  - [created](TokenBurn.md#created)
  - [instance](TokenBurn.md#instance)
  - [quantity](TokenBurn.md#quantity)
  - [type](TokenBurn.md#type)
  - [COMPOSITEKEY\_NS](TokenBurn.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](TokenBurn.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](TokenBurn.md#id-sub-split-char)
  - [INDEX\_KEY](TokenBurn.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](TokenBurn.md#min-unicode-rune-value)
- [Methods](TokenBurn.md#methods)
  - [getCompositeKey()](TokenBurn.md#getcompositekey)
  - [serialize()](TokenBurn.md#serialize)
  - [toPlainObject()](TokenBurn.md#toplainobject)
  - [validate()](TokenBurn.md#validate)
  - [validateOrReject()](TokenBurn.md#validateorreject)
  - [deserialize()](TokenBurn.md#deserialize)
  - [getCompositeKeyFromParts()](TokenBurn.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](TokenBurn.md#getstringkeyfromparts)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new TokenBurn()

> **new TokenBurn**(): [`TokenBurn`](TokenBurn.md)

#### Inherited from

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenBurn.ts:45](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L45)

***

### burnedBy

> **burnedBy**: `string`

#### Source

[chain-api/src/types/TokenBurn.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L29)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenBurn.ts:37](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L37)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenBurn.ts:33](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L33)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/TokenBurn.ts:57](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L57)

***

### instance

> **instance**: `BigNumber`

#### Source

[chain-api/src/types/TokenBurn.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L52)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenBurn.ts:62](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L62)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenBurn.ts:41](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L41)

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

> **`static`** **INDEX\_KEY**: `string` = `"GCTBR"`

#### Source

[chain-api/src/types/TokenBurn.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBurn.ts#L25)

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
