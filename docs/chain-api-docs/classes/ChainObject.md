**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > ChainObject

# Class: `abstract` ChainObject

## Contents

- [Extended By](ChainObject.md#extended-by)
- [Constructors](ChainObject.md#constructors)
  - [new ChainObject()](ChainObject.md#new-chainobject)
- [Properties](ChainObject.md#properties)
  - [COMPOSITEKEY\_NS](ChainObject.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](ChainObject.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](ChainObject.md#id-sub-split-char)
  - [MIN\_UNICODE\_RUNE\_VALUE](ChainObject.md#min-unicode-rune-value)
- [Methods](ChainObject.md#methods)
  - [getCompositeKey()](ChainObject.md#getcompositekey)
  - [serialize()](ChainObject.md#serialize)
  - [toPlainObject()](ChainObject.md#toplainobject)
  - [validate()](ChainObject.md#validate)
  - [validateOrReject()](ChainObject.md#validateorreject)
  - [deserialize()](ChainObject.md#deserialize)
  - [getCompositeKeyFromParts()](ChainObject.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](ChainObject.md#getstringkeyfromparts)

## Extended By

- [`PublicKey`](PublicKey.md)
- [`UserProfile`](UserProfile.md)
- [`TokenInstance`](TokenInstance.md)
- [`TokenClass`](TokenClass.md)
- [`TokenAllowance`](TokenAllowance.md)
- [`TokenBalance`](TokenBalance.md)
- [`TokenClaim`](TokenClaim.md)
- [`TokenBurn`](TokenBurn.md)
- [`TokenMintAllowance`](TokenMintAllowance.md)
- [`TokenMintFulfillment`](TokenMintFulfillment.md)

## Constructors

### new ChainObject()

> **new ChainObject**(): [`ChainObject`](ChainObject.md)

## Properties

### COMPOSITEKEY\_NS

> **`static`** **COMPOSITEKEY\_NS**: `string` = `"\x00"`

#### Source

[chain-api/src/types/ChainObject.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L43)

***

### ID\_SPLIT\_CHAR

> **`static`** **ID\_SPLIT\_CHAR**: `string` = `"$"`

#### Source

[chain-api/src/types/ChainObject.ts:46](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L46)

***

### ID\_SUB\_SPLIT\_CHAR

> **`static`** **ID\_SUB\_SPLIT\_CHAR**: `string` = `"|"`

#### Source

[chain-api/src/types/ChainObject.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L48)

***

### MIN\_UNICODE\_RUNE\_VALUE

> **`static`** **MIN\_UNICODE\_RUNE\_VALUE**: `string` = `"\u0000"`

#### Source

[chain-api/src/types/ChainObject.ts:41](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L41)

## Methods

### getCompositeKey()

> **getCompositeKey**(): `string`

#### Source

[chain-api/src/types/ChainObject.ts:77](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L77)

***

### serialize()

> **serialize**(): `string`

#### Source

[chain-api/src/types/ChainObject.ts:50](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L50)

***

### toPlainObject()

> **toPlainObject**(): `Record`\<`string`, `unknown`\>

#### Source

[chain-api/src/types/ChainObject.ts:66](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L66)

***

### validate()

> **validate**(): `Promise`\<`ValidationError`[]\>

#### Source

[chain-api/src/types/ChainObject.ts:54](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L54)

***

### validateOrReject()

> **validateOrReject**(): `Promise`\<`void`\>

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

#### Source

[chain-api/src/types/ChainObject.ts:70](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L70)

***

### getCompositeKeyFromParts()

> **`static`** **getCompositeKeyFromParts**(`indexKey`, `parts`): `string`

#### Parameters

▪ **indexKey**: `string`

▪ **parts**: `unknown`[]

#### Source

[chain-api/src/types/ChainObject.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L99)

***

### getStringKeyFromParts()

> **`static`** **getStringKeyFromParts**(`parts`): `string`

#### Parameters

▪ **parts**: `string`[]

#### Source

[chain-api/src/types/ChainObject.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L119)
