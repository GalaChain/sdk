**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenClass

# Class: TokenClass

## Contents

- [Extends](TokenClass.md#extends)
- [Constructors](TokenClass.md#constructors)
  - [new TokenClass()](TokenClass.md#new-tokenclass)
- [Properties](TokenClass.md#properties)
  - [additionalKey](TokenClass.md#additionalkey)
  - [authorities](TokenClass.md#authorities)
  - [category](TokenClass.md#category)
  - [collection](TokenClass.md#collection)
  - [contractAddress](TokenClass.md#contractaddress)
  - [decimals](TokenClass.md#decimals)
  - [description](TokenClass.md#description)
  - [image](TokenClass.md#image)
  - [isNonFungible](TokenClass.md#isnonfungible)
  - [knownMintAllowanceSupply](TokenClass.md#knownmintallowancesupply)
  - [knownMintSupply](TokenClass.md#knownmintsupply)
  - [maxCapacity](TokenClass.md#maxcapacity)
  - [maxSupply](TokenClass.md#maxsupply)
  - [metadataAddress](TokenClass.md#metadataaddress)
  - [name](TokenClass.md#name)
  - [network](TokenClass.md#network)
  - [rarity](TokenClass.md#rarity)
  - [symbol](TokenClass.md#symbol)
  - [totalBurned](TokenClass.md#totalburned)
  - [totalMintAllowance](TokenClass.md#totalmintallowance)
  - [totalSupply](TokenClass.md#totalsupply)
  - [type](TokenClass.md#type)
  - [COMPOSITEKEY\_NS](TokenClass.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](TokenClass.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](TokenClass.md#id-sub-split-char)
  - [INDEX\_KEY](TokenClass.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](TokenClass.md#min-unicode-rune-value)
- [Methods](TokenClass.md#methods)
  - [getCompositeKey()](TokenClass.md#getcompositekey)
  - [getKey()](TokenClass.md#getkey)
  - [serialize()](TokenClass.md#serialize)
  - [toPlainObject()](TokenClass.md#toplainobject)
  - [updatedWith()](TokenClass.md#updatedwith)
  - [validate()](TokenClass.md#validate)
  - [validateOrReject()](TokenClass.md#validateorreject)
  - [buildClassKeyList()](TokenClass.md#buildclasskeylist)
  - [buildClassKeyObject()](TokenClass.md#buildclasskeyobject)
  - [buildTokenClassCompositeKey()](TokenClass.md#buildtokenclasscompositekey)
  - [deserialize()](TokenClass.md#deserialize)
  - [getCompositeKeyFromParts()](TokenClass.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](TokenClass.md#getstringkeyfromparts)

## Extends

- [`ChainObject`](ChainObject.md)

## Constructors

### new TokenClass()

> **new TokenClass**(): [`TokenClass`](TokenClass.md)

#### Inherited from

[`ChainObject`](ChainObject.md).[`constructor`](ChainObject.md#constructors)

## Properties

### additionalKey

> **additionalKey**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:105](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L105)

***

### authorities

> **authorities**: `string`[]

#### Source

[chain-api/src/types/TokenClass.ts:135](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L135)

***

### category

> **category**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:97](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L97)

***

### collection

> **collection**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:93](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L93)

***

### contractAddress

> **contractAddress**?: `string`

#### Source

[chain-api/src/types/TokenClass.ts:153](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L153)

***

### decimals

> **decimals**: `number`

#### Source

[chain-api/src/types/TokenClass.ts:118](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L118)

***

### description

> **description**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L148)

***

### image

> **image**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:163](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L163)

***

### isNonFungible

> **isNonFungible**: `boolean`

#### Source

[chain-api/src/types/TokenClass.ts:126](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L126)

***

### knownMintAllowanceSupply

> **knownMintAllowanceSupply**?: `BigNumber`

#### Source

[chain-api/src/types/TokenClass.ts:179](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L179)

***

### knownMintSupply

> **knownMintSupply**?: `BigNumber`

#### Source

[chain-api/src/types/TokenClass.ts:191](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L191)

***

### maxCapacity

> **maxCapacity**: `BigNumber`

#### Source

[chain-api/src/types/TokenClass.ts:131](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L131)

***

### maxSupply

> **maxSupply**: `BigNumber`

#### Source

[chain-api/src/types/TokenClass.ts:123](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L123)

***

### metadataAddress

> **metadataAddress**?: `string`

#### Source

[chain-api/src/types/TokenClass.ts:158](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L158)

***

### name

> **name**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:140](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L140)

***

### network

> **network**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:109](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L109)

***

### rarity

> **rarity**?: `string`

#### Source

[chain-api/src/types/TokenClass.ts:168](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L168)

***

### symbol

> **symbol**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:144](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L144)

***

### totalBurned

> **totalBurned**: `BigNumber`

#### Source

[chain-api/src/types/TokenClass.ts:172](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L172)

***

### totalMintAllowance

> **totalMintAllowance**: `BigNumber`

#### Source

[chain-api/src/types/TokenClass.ts:175](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L175)

***

### totalSupply

> **totalSupply**: `BigNumber`

Total supply of tokens minted for class.

#### Deprecated

2023-05-30, replaced with knownMintSupply for high-throughput implementation.

#### Source

[chain-api/src/types/TokenClass.ts:187](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L187)

***

### type

> **type**: `string`

#### Source

[chain-api/src/types/TokenClass.ts:101](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L101)

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

> **`static`** **INDEX\_KEY**: `string` = `"GCTI"`

#### Source

[chain-api/src/types/TokenClass.ts:86](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L86)

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

### getKey()

> **getKey**(): `Promise`\<[`TokenClassKey`](TokenClassKey.md)\>

#### Source

[chain-api/src/types/TokenClass.ts:194](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L194)

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

### updatedWith()

> **updatedWith**(`toUpdate`): [`TokenClass`](TokenClass.md)

Returns new token class object updated with properties that are allowed to be updated

#### Parameters

▪ **toUpdate**: `ToUpdate`

#### Source

[chain-api/src/types/TokenClass.ts:236](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L236)

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

### buildClassKeyList()

> **`static`** **buildClassKeyList**(`tokenClassKey`): [`string`, `string`, `string`, `string`]

#### Parameters

▪ **tokenClassKey**: [`TokenClassKeyProperties`](../interfaces/TokenClassKeyProperties.md)

#### Source

[chain-api/src/types/TokenClass.ts:198](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L198)

***

### buildClassKeyObject()

> **`static`** **buildClassKeyObject**(`token`): `Promise`\<[`TokenClassKey`](TokenClassKey.md)\>

#### Parameters

▪ **token**: [`TokenClassKeyProperties`](../interfaces/TokenClassKeyProperties.md)

#### Source

[chain-api/src/types/TokenClass.ts:216](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L216)

***

### buildTokenClassCompositeKey()

> **`static`** **buildTokenClassCompositeKey**(`tokenClassKey`): `string`

#### Parameters

▪ **tokenClassKey**: [`TokenClassKeyProperties`](../interfaces/TokenClassKeyProperties.md)

#### Source

[chain-api/src/types/TokenClass.ts:206](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenClass.ts#L206)

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
