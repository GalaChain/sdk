**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > RangedChainObject

# Class: `abstract` RangedChainObject

## Contents

- [Extended By](RangedChainObject.md#extended-by)
- [Constructors](RangedChainObject.md#constructors)
  - [new RangedChainObject()](RangedChainObject.md#new-rangedchainobject)
- [Methods](RangedChainObject.md#methods)
  - [getRangedKey()](RangedChainObject.md#getrangedkey)
  - [serialize()](RangedChainObject.md#serialize)
  - [toPlainObject()](RangedChainObject.md#toplainobject)
  - [validate()](RangedChainObject.md#validate)
  - [validateOrReject()](RangedChainObject.md#validateorreject)
  - [deserialize()](RangedChainObject.md#deserialize)
  - [getRangedKeyFromParts()](RangedChainObject.md#getrangedkeyfromparts)
  - [getStringKeyFromParts()](RangedChainObject.md#getstringkeyfromparts)

## Extended By

- [`TokenBurnCounter`](TokenBurnCounter.md)
- [`TokenMintAllowanceRequest`](TokenMintAllowanceRequest.md)
- [`TokenMintRequest`](TokenMintRequest.md)

## Constructors

### new RangedChainObject()

> **new RangedChainObject**(): [`RangedChainObject`](RangedChainObject.md)

## Methods

### getRangedKey()

> **getRangedKey**(): `string`

#### Source

[chain-api/src/types/RangedChainObject.ts:63](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L63)

***

### serialize()

> **serialize**(): `string`

#### Source

[chain-api/src/types/RangedChainObject.ts:36](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L36)

***

### toPlainObject()

> **toPlainObject**(): `Record`\<`string`, `unknown`\>

#### Source

[chain-api/src/types/RangedChainObject.ts:52](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L52)

***

### validate()

> **validate**(): `Promise`\<`ValidationError`[]\>

#### Source

[chain-api/src/types/RangedChainObject.ts:40](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L40)

***

### validateOrReject()

> **validateOrReject**(): `Promise`\<`void`\>

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

#### Source

[chain-api/src/types/RangedChainObject.ts:56](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L56)

***

### getRangedKeyFromParts()

> **`static`** **getRangedKeyFromParts**(`indexKey`, `parts`): `string`

#### Parameters

▪ **indexKey**: `string`

▪ **parts**: `unknown`[]

#### Source

[chain-api/src/types/RangedChainObject.ts:83](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L83)

***

### getStringKeyFromParts()

> **`static`** **getStringKeyFromParts**(`parts`): `string`

#### Parameters

▪ **parts**: `string`[]

#### Source

[chain-api/src/types/RangedChainObject.ts:100](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/RangedChainObject.ts#L100)
