**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > PublicKey

# Class: PublicKey

## Contents

- [Extends](PublicKey.md#extends)
- [Constructors](PublicKey.md#constructors)
  - [new PublicKey()](PublicKey.md#new-publickey)
- [Properties](PublicKey.md#properties)
  - [publicKey](PublicKey.md#publickey)
  - [COMPOSITEKEY\_NS](PublicKey.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](PublicKey.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](PublicKey.md#id-sub-split-char)
  - [MIN\_UNICODE\_RUNE\_VALUE](PublicKey.md#min-unicode-rune-value)
- [Methods](PublicKey.md#methods)
  - [getCompositeKey()](PublicKey.md#getcompositekey)
  - [serialize()](PublicKey.md#serialize)
  - [toPlainObject()](PublicKey.md#toplainobject)
  - [validate()](PublicKey.md#validate)
  - [validateOrReject()](PublicKey.md#validateorreject)
  - [deserialize()](PublicKey.md#deserialize)
  - [getCompositeKeyFromParts()](PublicKey.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](PublicKey.md#getstringkeyfromparts)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new PublicKey()

> **new PublicKey**(): [`PublicKey`](PublicKey.md)

#### Inherited from

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

## Properties

### publicKey

> **publicKey**: `string`

#### Source

[chain-api/src/types/PublicKey.ts:23](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/PublicKey.ts#L23)

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
