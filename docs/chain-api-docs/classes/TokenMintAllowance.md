**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenMintAllowance

# Class: TokenMintAllowance

## Contents

- [Extends](TokenMintAllowance.md#extends)
- [Constructors](TokenMintAllowance.md#constructors)
  - [new TokenMintAllowance()](TokenMintAllowance.md#new-tokenmintallowance)
- [Properties](TokenMintAllowance.md#properties)
  - [additionalKey](TokenMintAllowance.md#additionalkey)
  - [category](TokenMintAllowance.md#category)
  - [collection](TokenMintAllowance.md#collection)
  - [created](TokenMintAllowance.md#created)
  - [grantedBy](TokenMintAllowance.md#grantedby)
  - [grantedTo](TokenMintAllowance.md#grantedto)
  - [quantity](TokenMintAllowance.md#quantity)
  - [reqId](TokenMintAllowance.md#reqid)
  - [totalKnownMintAllowancesAtRequest](TokenMintAllowance.md#totalknownmintallowancesatrequest)
  - [type](TokenMintAllowance.md#type)
  - [COMPOSITEKEY\_NS](TokenMintAllowance.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](TokenMintAllowance.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](TokenMintAllowance.md#id-sub-split-char)
  - [INDEX\_KEY](TokenMintAllowance.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](TokenMintAllowance.md#min-unicode-rune-value)
- [Methods](TokenMintAllowance.md#methods)
  - [getCompositeKey()](TokenMintAllowance.md#getcompositekey)
  - [serialize()](TokenMintAllowance.md#serialize)
  - [toPlainObject()](TokenMintAllowance.md#toplainobject)
  - [validate()](TokenMintAllowance.md#validate)
  - [validateOrReject()](TokenMintAllowance.md#validateorreject)
  - [deserialize()](TokenMintAllowance.md#deserialize)
  - [getCompositeKeyFromParts()](TokenMintAllowance.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](TokenMintAllowance.md#getstringkeyfromparts)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new TokenMintAllowance()

> **new TokenMintAllowance**(): [`TokenMintAllowance`](TokenMintAllowance.md)

#### Inherited from

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:40](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L40)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:32](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L32)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L28)

***

### created

> **created**: `number`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:56](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L56)

***

### grantedBy

> **grantedBy**: `string`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L48)

***

### grantedTo

> **grantedTo**: `string`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L52)

***

### quantity

> **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:62](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L62)

***

### reqId

> **reqId**: `string`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:59](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L59)

***

### totalKnownMintAllowancesAtRequest

> **totalKnownMintAllowancesAtRequest**: `BigNumber`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:44](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L44)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:36](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L36)

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

> **`static`** **INDEX\_KEY**: `string` = `"GCTMA"`

#### Source

[chain-api/src/types/TokenMintAllowance.ts:24](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenMintAllowance.ts#L24)

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
