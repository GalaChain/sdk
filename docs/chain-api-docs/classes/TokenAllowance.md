**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenAllowance

# Class: TokenAllowance

## Contents

- [Extends](TokenAllowance.md#extends)
- [Constructors](TokenAllowance.md#constructors)
  - [new TokenAllowance()](TokenAllowance.md#new-tokenallowance)
- [Properties](TokenAllowance.md#properties)
  - [additionalKey](TokenAllowance.md#additionalkey)
  - [allowanceType](TokenAllowance.md#allowancetype)
  - [category](TokenAllowance.md#category)
  - [collection](TokenAllowance.md#collection)
  - [created](TokenAllowance.md#created)
  - [expires](TokenAllowance.md#expires)
  - [grantedBy](TokenAllowance.md#grantedby)
  - [grantedTo](TokenAllowance.md#grantedto)
  - [instance](TokenAllowance.md#instance)
  - [quantity](TokenAllowance.md#quantity)
  - [quantitySpent](TokenAllowance.md#quantityspent)
  - [type](TokenAllowance.md#type)
  - [uses](TokenAllowance.md#uses)
  - [usesSpent](TokenAllowance.md#usesspent)
  - [COMPOSITEKEY\_NS](TokenAllowance.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](TokenAllowance.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](TokenAllowance.md#id-sub-split-char)
  - [INDEX\_KEY](TokenAllowance.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](TokenAllowance.md#min-unicode-rune-value)
- [Methods](TokenAllowance.md#methods)
  - [getCompositeKey()](TokenAllowance.md#getcompositekey)
  - [serialize()](TokenAllowance.md#serialize)
  - [toPlainObject()](TokenAllowance.md#toplainobject)
  - [validate()](TokenAllowance.md#validate)
  - [validateOrReject()](TokenAllowance.md#validateorreject)
  - [deserialize()](TokenAllowance.md#deserialize)
  - [getCompositeKeyFromParts()](TokenAllowance.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](TokenAllowance.md#getstringkeyfromparts)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new TokenAllowance()

> **new TokenAllowance**(): [`TokenAllowance`](TokenAllowance.md)

#### Inherited from

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenAllowance.ts:46](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L46)

***

### allowanceType

> **allowanceType**: [`AllowanceType`](../enumerations/AllowanceType.md)

#### Source

[chain-api/src/types/TokenAllowance.ts:57](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L57)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenAllowance.ts:38](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L38)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenAllowance.ts:34](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L34)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/TokenAllowance.ts:67](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L67)

***

### expires

> **expires**: `number`

#### Source

[chain-api/src/types/TokenAllowance.ts:81](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L81)

***

### grantedBy

> **grantedBy**: `string`

#### Source

[chain-api/src/types/TokenAllowance.ts:62](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L62)

***

### grantedTo

> **grantedTo**: `string`

#### Source

[chain-api/src/types/TokenAllowance.ts:30](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L30)

***

### instance

> **instance**: `BigNumber`

#### Source

[chain-api/src/types/TokenAllowance.ts:53](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L53)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenAllowance.ts:86](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L86)

***

### quantitySpent

> **quantitySpent**: `BigNumber`

#### Source

[chain-api/src/types/TokenAllowance.ts:91](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L91)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenAllowance.ts:42](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L42)

***

### uses

> **uses**: `BigNumber`

#### Source

[chain-api/src/types/TokenAllowance.ts:72](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L72)

***

### usesSpent

> **usesSpent**: `BigNumber`

#### Source

[chain-api/src/types/TokenAllowance.ts:77](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L77)

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

> **`static`** **INDEX\_KEY**: `string` = `"GCTA"`

#### Source

[chain-api/src/types/TokenAllowance.ts:26](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenAllowance.ts#L26)

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
