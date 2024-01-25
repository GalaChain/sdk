**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenClaim

# Class: TokenClaim

## Contents

- [Extends](TokenClaim.md#extends)
- [Constructors](TokenClaim.md#constructors)
  - [new TokenClaim()](TokenClaim.md#new-tokenclaim)
- [Properties](TokenClaim.md#properties)
  - [action](TokenClaim.md#action)
  - [additionalKey](TokenClaim.md#additionalkey)
  - [allowanceCreated](TokenClaim.md#allowancecreated)
  - [category](TokenClaim.md#category)
  - [claimSequence](TokenClaim.md#claimsequence)
  - [collection](TokenClaim.md#collection)
  - [created](TokenClaim.md#created)
  - [instance](TokenClaim.md#instance)
  - [issuerKey](TokenClaim.md#issuerkey)
  - [ownerKey](TokenClaim.md#ownerkey)
  - [quantity](TokenClaim.md#quantity)
  - [type](TokenClaim.md#type)
  - [COMPOSITEKEY\_NS](TokenClaim.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](TokenClaim.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](TokenClaim.md#id-sub-split-char)
  - [INDEX\_KEY](TokenClaim.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](TokenClaim.md#min-unicode-rune-value)
- [Methods](TokenClaim.md#methods)
  - [getCompositeKey()](TokenClaim.md#getcompositekey)
  - [serialize()](TokenClaim.md#serialize)
  - [toPlainObject()](TokenClaim.md#toplainobject)
  - [validate()](TokenClaim.md#validate)
  - [validateOrReject()](TokenClaim.md#validateorreject)
  - [deserialize()](TokenClaim.md#deserialize)
  - [getCompositeKeyFromParts()](TokenClaim.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](TokenClaim.md#getstringkeyfromparts)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new TokenClaim()

> **new TokenClaim**(): [`TokenClaim`](TokenClaim.md)

#### Inherited from

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

## Properties

### action

> **action**: [`AllowanceType`](../enumerations/AllowanceType.md)

#### Source

[chain-api/src/types/TokenClaim.ts:69](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L69)

***

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenClaim.ts:59](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L59)

***

### allowanceCreated

> **allowanceCreated**: `number`

#### Source

[chain-api/src/types/TokenClaim.ts:79](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L79)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenClaim.ts:51](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L51)

***

### claimSequence

> **claimSequence**: `BigNumber`

#### Source

[chain-api/src/types/TokenClaim.ts:85](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L85)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenClaim.ts:47](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L47)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/TokenClaim.ts:89](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L89)

***

### instance

> **instance**: `BigNumber`

#### Source

[chain-api/src/types/TokenClaim.ts:65](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L65)

***

### issuerKey

> **issuerKey**: `string`

#### Source

[chain-api/src/types/TokenClaim.ts:74](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L74)

***

### ownerKey

> **ownerKey**: `string`

#### Source

[chain-api/src/types/TokenClaim.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L43)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenClaim.ts:94](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L94)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenClaim.ts:55](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L55)

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

> **`static`** **INDEX\_KEY**: `string` = `"GCTC"`

#### Source

[chain-api/src/types/TokenClaim.ts:38](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClaim.ts#L38)

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
