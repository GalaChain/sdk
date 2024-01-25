**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenBalance

# Class: TokenBalance

## Contents

- [Extends](TokenBalance.md#extends)
- [Constructors](TokenBalance.md#constructors)
  - [new TokenBalance(params)](TokenBalance.md#new-tokenbalanceparams)
- [Properties](TokenBalance.md#properties)
  - [additionalKey](TokenBalance.md#additionalkey)
  - [category](TokenBalance.md#category)
  - [collection](TokenBalance.md#collection)
  - [inUseHolds](TokenBalance.md#inuseholds)
  - [instanceIds](TokenBalance.md#instanceids)
  - [lockedHolds](TokenBalance.md#lockedholds)
  - [owner](TokenBalance.md#owner)
  - [quantity](TokenBalance.md#quantity)
  - [type](TokenBalance.md#type)
  - [COMPOSITEKEY\_NS](TokenBalance.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](TokenBalance.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](TokenBalance.md#id-sub-split-char)
  - [INDEX\_KEY](TokenBalance.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](TokenBalance.md#min-unicode-rune-value)
- [Methods](TokenBalance.md#methods)
  - [cleanupExpiredHolds()](TokenBalance.md#cleanupexpiredholds)
  - [clearHolds()](TokenBalance.md#clearholds)
  - [containsAnyNftInstanceId()](TokenBalance.md#containsanynftinstanceid)
  - [containsInstance()](TokenBalance.md#containsinstance)
  - [ensureCanAddInstance()](TokenBalance.md#ensurecanaddinstance)
  - [ensureCanAddQuantity()](TokenBalance.md#ensurecanaddquantity)
  - [ensureCanLockInstance()](TokenBalance.md#ensurecanlockinstance)
  - [ensureCanReleaseInstance()](TokenBalance.md#ensurecanreleaseinstance)
  - [ensureCanRemoveInstance()](TokenBalance.md#ensurecanremoveinstance)
  - [ensureCanSubtractQuantity()](TokenBalance.md#ensurecansubtractquantity)
  - [ensureCanUnlockInstance()](TokenBalance.md#ensurecanunlockinstance)
  - [ensureCanUseInstance()](TokenBalance.md#ensurecanuseinstance)
  - [ensureContainsNoNftInstances()](TokenBalance.md#ensurecontainsnonftinstances)
  - [ensureInstanceIsInBalance()](TokenBalance.md#ensureinstanceisinbalance)
  - [ensureInstanceIsNft()](TokenBalance.md#ensureinstanceisnft)
  - [ensureInstanceIsNotLocked()](TokenBalance.md#ensureinstanceisnotlocked)
  - [ensureInstanceIsNotLockedWithTheSameName()](TokenBalance.md#ensureinstanceisnotlockedwiththesamename)
  - [ensureInstanceIsNotUsed()](TokenBalance.md#ensureinstanceisnotused)
  - [ensureIsValidQuantityForFungible()](TokenBalance.md#ensureisvalidquantityforfungible)
  - [ensureQuantityIsSpendable()](TokenBalance.md#ensurequantityisspendable)
  - [findInUseHold()](TokenBalance.md#findinusehold)
  - [findLockedHold()](TokenBalance.md#findlockedhold)
  - [getCompositeKey()](TokenBalance.md#getcompositekey)
  - [getNftInstanceCount()](TokenBalance.md#getnftinstancecount)
  - [getNftInstanceIds()](TokenBalance.md#getnftinstanceids)
  - [getQuantityTotal()](TokenBalance.md#getquantitytotal)
  - [getUnexpiredInUseHolds()](TokenBalance.md#getunexpiredinuseholds)
  - [getUnexpiredLockedHolds()](TokenBalance.md#getunexpiredlockedholds)
  - [isInstanceInUse()](TokenBalance.md#isinstanceinuse)
  - [isInstanceLocked()](TokenBalance.md#isinstancelocked)
  - [isInstanceSpendable()](TokenBalance.md#isinstancespendable)
  - [serialize()](TokenBalance.md#serialize)
  - [toPlainObject()](TokenBalance.md#toplainobject)
  - [validate()](TokenBalance.md#validate)
  - [validateOrReject()](TokenBalance.md#validateorreject)
  - [deserialize()](TokenBalance.md#deserialize)
  - [getCompositeKeyFromParts()](TokenBalance.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](TokenBalance.md#getstringkeyfromparts)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new TokenBalance(params)

> **new TokenBalance**(`params`?): [`TokenBalance`](TokenBalance.md)

#### Parameters

▪ **params?**: `object`

▪ **params.additionalKey?**: `string`

▪ **params.category?**: `string`

▪ **params.collection?**: `string`

▪ **params.owner?**: `string`

▪ **params.type?**: `string`

#### Overrides

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

#### Source

[chain-api/src/types/TokenBalance.ts:108](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L108)

## Properties

### additionalKey

> **`readonly`** **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenBalance.ts:106](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L106)

***

### category

> **`readonly`** **category**: `string`

#### Source

[chain-api/src/types/TokenBalance.ts:98](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L98)

***

### collection

> **`readonly`** **collection**: `string`

#### Source

[chain-api/src/types/TokenBalance.ts:94](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L94)

***

### inUseHolds

> **`private`** **inUseHolds**?: [`TokenHold`](TokenHold.md)[]

#### Source

[chain-api/src/types/TokenBalance.ts:146](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L146)

***

### instanceIds

> **`private`** **instanceIds**?: `BigNumber`[]

Token instance IDs for NFTs. It is also used to determine if the balance is
for fungible or non-fungible tokens. If the array is undefined, then the
balance is for fungible tokens.

#### Source

[chain-api/src/types/TokenBalance.ts:136](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L136)

***

### lockedHolds

> **`private`** **lockedHolds**?: [`TokenHold`](TokenHold.md)[]

#### Source

[chain-api/src/types/TokenBalance.ts:141](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L141)

***

### owner

> **`readonly`** **owner**: `string`

#### Source

[chain-api/src/types/TokenBalance.ts:90](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L90)

***

### quantity

> **`private`** **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:150](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L150)

***

### type

> **`readonly`** **type**: `string`

#### Source

[chain-api/src/types/TokenBalance.ts:102](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L102)

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

> **`static`** **`readonly`** **INDEX\_KEY**: `"GCTB"` = `"GCTB"`

#### Source

[chain-api/src/types/TokenBalance.ts:86](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L86)

***

### MIN\_UNICODE\_RUNE\_VALUE

> **`static`** **MIN\_UNICODE\_RUNE\_VALUE**: `string` = `"\u0000"`

#### Inherited from

[`ChainObject`](ChainObject.md).[`MIN_UNICODE_RUNE_VALUE`](ChainObject.md#min-unicode-rune-value)

#### Source

[chain-api/src/types/ChainObject.ts:41](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L41)

## Methods

### cleanupExpiredHolds()

> **cleanupExpiredHolds**(`currentTime`): [`TokenBalance`](TokenBalance.md)

#### Parameters

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:312](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L312)

***

### clearHolds()

> **clearHolds**(`instanceId`, `currentTime`): `void`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:267](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L267)

***

### containsAnyNftInstanceId()

> **containsAnyNftInstanceId**(): `boolean`

#### Source

[chain-api/src/types/TokenBalance.ts:296](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L296)

***

### containsInstance()

> **`private`** **containsInstance**(`instanceId`): `boolean`

#### Parameters

▪ **instanceId**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:318](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L318)

***

### ensureCanAddInstance()

> **ensureCanAddInstance**(`instanceId`): `object`

#### Parameters

▪ **instanceId**: `BigNumber`

#### Returns

> ##### add()
>

#### Source

[chain-api/src/types/TokenBalance.ts:160](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L160)

***

### ensureCanAddQuantity()

> **ensureCanAddQuantity**(`quantity`): `object`

#### Parameters

▪ **quantity**: `BigNumber`

#### Returns

> ##### add()
>

#### Source

[chain-api/src/types/TokenBalance.ts:375](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L375)

***

### ensureCanLockInstance()

> **ensureCanLockInstance**(`hold`): `object`

#### Parameters

▪ **hold**: [`TokenHold`](TokenHold.md)

#### Returns

> ##### lock()
>

#### Source

[chain-api/src/types/TokenBalance.ts:203](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L203)

***

### ensureCanReleaseInstance()

> **ensureCanReleaseInstance**(`instanceId`, `name`, `currentTime`): `object`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **name**: `undefined` \| `string`

▪ **currentTime**: `number`

#### Returns

> ##### release()
>

#### Source

[chain-api/src/types/TokenBalance.ts:248](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L248)

***

### ensureCanRemoveInstance()

> **ensureCanRemoveInstance**(`instanceId`, `currentTime`): `object`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **currentTime**: `number`

#### Returns

> ##### remove()
>

#### Source

[chain-api/src/types/TokenBalance.ts:186](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L186)

***

### ensureCanSubtractQuantity()

> **ensureCanSubtractQuantity**(`quantity`): `object`

#### Parameters

▪ **quantity**: `BigNumber`

#### Returns

> ##### subtract()
>

#### Source

[chain-api/src/types/TokenBalance.ts:386](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L386)

***

### ensureCanUnlockInstance()

> **ensureCanUnlockInstance**(`instanceId`, `name`, `currentTime`): `object`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **name**: `undefined` \| `string`

▪ **currentTime**: `number`

#### Returns

> ##### unlock()
>

#### Source

[chain-api/src/types/TokenBalance.ts:216](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L216)

***

### ensureCanUseInstance()

> **ensureCanUseInstance**(`hold`): `object`

#### Parameters

▪ **hold**: [`TokenHold`](TokenHold.md)

#### Returns

> ##### use()
>

#### Source

[chain-api/src/types/TokenBalance.ts:235](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L235)

***

### ensureContainsNoNftInstances()

> **`private`** **ensureContainsNoNftInstances**(): `void`

#### Source

[chain-api/src/types/TokenBalance.ts:418](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L418)

***

### ensureInstanceIsInBalance()

> **`private`** **ensureInstanceIsInBalance**(`instanceId`): `void`

#### Parameters

▪ **instanceId**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:337](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L337)

***

### ensureInstanceIsNft()

> **`private`** **ensureInstanceIsNft**(`instanceId`): `void`

#### Parameters

▪ **instanceId**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:330](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L330)

***

### ensureInstanceIsNotLocked()

> **`private`** **ensureInstanceIsNotLocked**(`instanceId`, `currentTime`): `void`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:354](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L354)

***

### ensureInstanceIsNotLockedWithTheSameName()

> **`private`** **ensureInstanceIsNotLockedWithTheSameName**(`instanceId`, `name`, `currentTime`): `void`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **name**: `undefined` \| `string`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:343](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L343)

***

### ensureInstanceIsNotUsed()

> **`private`** **ensureInstanceIsNotUsed**(`instanceId`, `currentTime`): `void`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:361](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L361)

***

### ensureIsValidQuantityForFungible()

> **`private`** **ensureIsValidQuantityForFungible**(`quantity`): `void`

#### Parameters

▪ **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:428](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L428)

***

### ensureQuantityIsSpendable()

> **`private`** **ensureQuantityIsSpendable**(`quantity`): `void`

#### Parameters

▪ **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:398](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L398)

***

### findInUseHold()

> **findInUseHold**(`instanceId`, `name`, `currentTime`): `undefined` \| [`TokenHold`](TokenHold.md)

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **name**: `undefined` \| `string`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:287](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L287)

***

### findLockedHold()

> **findLockedHold**(`instanceId`, `name`, `currentTime`): `undefined` \| [`TokenHold`](TokenHold.md)

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **name**: `undefined` \| `string`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:278](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L278)

***

### getCompositeKey()

> **getCompositeKey**(): `string`

#### Inherited from

[`ChainObject`](ChainObject.md).[`getCompositeKey`](ChainObject.md#getcompositekey)

#### Source

[chain-api/src/types/ChainObject.ts:77](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L77)

***

### getNftInstanceCount()

> **getNftInstanceCount**(): `number`

#### Source

[chain-api/src/types/TokenBalance.ts:156](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L156)

***

### getNftInstanceIds()

> **getNftInstanceIds**(): `BigNumber`[]

#### Source

[chain-api/src/types/TokenBalance.ts:308](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L308)

***

### getQuantityTotal()

> **getQuantityTotal**(): `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:370](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L370)

***

### getUnexpiredInUseHolds()

> **getUnexpiredInUseHolds**(`currentTime`): [`TokenHold`](TokenHold.md)[]

#### Parameters

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:414](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L414)

***

### getUnexpiredLockedHolds()

> **getUnexpiredLockedHolds**(`currentTime`): [`TokenHold`](TokenHold.md)[]

#### Parameters

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:410](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L410)

***

### isInstanceInUse()

> **`private`** **isInstanceInUse**(`instanceId`, `currentTime`): `boolean`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:326](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L326)

***

### isInstanceLocked()

> **`private`** **isInstanceLocked**(`instanceId`, `currentTime`): `boolean`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:322](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L322)

***

### isInstanceSpendable()

> **isInstanceSpendable**(`instanceId`, `currentTime`): `boolean`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:300](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L300)

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
