**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > UniqueTransaction

# Class: UniqueTransaction

## Contents

- [Extends](UniqueTransaction.md#extends)
- [Constructors](UniqueTransaction.md#constructors)
  - [new UniqueTransaction()](UniqueTransaction.md#new-uniquetransaction)
- [Properties](UniqueTransaction.md#properties)
  - [created](UniqueTransaction.md#created)
  - [transactionId](UniqueTransaction.md#transactionid)
  - [uniqueKey](UniqueTransaction.md#uniquekey)
  - [COMPOSITEKEY\_NS](UniqueTransaction.md#compositekey-ns)
  - [ID\_SPLIT\_CHAR](UniqueTransaction.md#id-split-char)
  - [ID\_SUB\_SPLIT\_CHAR](UniqueTransaction.md#id-sub-split-char)
  - [INDEX\_KEY](UniqueTransaction.md#index-key)
  - [MIN\_UNICODE\_RUNE\_VALUE](UniqueTransaction.md#min-unicode-rune-value)
- [Methods](UniqueTransaction.md#methods)
  - [getCompositeKey()](UniqueTransaction.md#getcompositekey)
  - [serialize()](UniqueTransaction.md#serialize)
  - [toPlainObject()](UniqueTransaction.md#toplainobject)
  - [validate()](UniqueTransaction.md#validate)
  - [validateOrReject()](UniqueTransaction.md#validateorreject)
  - [deserialize()](UniqueTransaction.md#deserialize)
  - [getCompositeKeyFromParts()](UniqueTransaction.md#getcompositekeyfromparts)
  - [getStringKeyFromParts()](UniqueTransaction.md#getstringkeyfromparts)

## Extends

- `ChainObject`

## Constructors

### new UniqueTransaction()

> **new UniqueTransaction**(): [`UniqueTransaction`](UniqueTransaction.md)

#### Inherited from

ChainObject.constructor

## Properties

### created

> **created**: `number`

#### Source

[chaincode/src/services/UniqueTransaction.ts:35](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransaction.ts#L35)

***

### transactionId

> **transactionId**: `string`

#### Source

[chaincode/src/services/UniqueTransaction.ts:39](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransaction.ts#L39)

***

### uniqueKey

> **uniqueKey**: `string`

#### Source

[chaincode/src/services/UniqueTransaction.ts:32](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransaction.ts#L32)

***

### COMPOSITEKEY\_NS

> **`static`** **COMPOSITEKEY\_NS**: `string` = `"\x00"`

#### Inherited from

ChainObject.COMPOSITEKEY\_NS

#### Source

[chain-api/src/types/ChainObject.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L43)

***

### ID\_SPLIT\_CHAR

> **`static`** **ID\_SPLIT\_CHAR**: `string` = `"$"`

#### Inherited from

ChainObject.ID\_SPLIT\_CHAR

#### Source

[chain-api/src/types/ChainObject.ts:46](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L46)

***

### ID\_SUB\_SPLIT\_CHAR

> **`static`** **ID\_SUB\_SPLIT\_CHAR**: `string` = `"|"`

#### Inherited from

ChainObject.ID\_SUB\_SPLIT\_CHAR

#### Source

[chain-api/src/types/ChainObject.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L48)

***

### INDEX\_KEY

> **`static`** **INDEX\_KEY**: `string` = `"UNTX"`

#### Source

[chaincode/src/services/UniqueTransaction.ts:22](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/services/UniqueTransaction.ts#L22)

***

### MIN\_UNICODE\_RUNE\_VALUE

> **`static`** **MIN\_UNICODE\_RUNE\_VALUE**: `string` = `"\u0000"`

#### Inherited from

ChainObject.MIN\_UNICODE\_RUNE\_VALUE

#### Source

[chain-api/src/types/ChainObject.ts:41](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L41)

## Methods

### getCompositeKey()

> **getCompositeKey**(): `string`

#### Inherited from

ChainObject.getCompositeKey

#### Source

[chain-api/src/types/ChainObject.ts:77](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L77)

***

### serialize()

> **serialize**(): `string`

#### Inherited from

ChainObject.serialize

#### Source

[chain-api/src/types/ChainObject.ts:50](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L50)

***

### toPlainObject()

> **toPlainObject**(): `Record`\<`string`, `unknown`\>

#### Inherited from

ChainObject.toPlainObject

#### Source

[chain-api/src/types/ChainObject.ts:66](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L66)

***

### validate()

> **validate**(): `Promise`\<`ValidationError`[]\>

#### Inherited from

ChainObject.validate

#### Source

[chain-api/src/types/ChainObject.ts:54](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L54)

***

### validateOrReject()

> **validateOrReject**(): `Promise`\<`void`\>

#### Inherited from

ChainObject.validateOrReject

#### Source

[chain-api/src/types/ChainObject.ts:58](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L58)

***

### deserialize()

> **`static`** **deserialize**\<`T`\>(`constructor`, `object`): `T`

#### Type parameters

▪ **T**

#### Parameters

▪ **constructor**: `ClassConstructor`\<`Inferred`\<`T`, `ChainObject`\>\>

▪ **object**: `string` \| `Record`\<`string`, `unknown`\> \| `Record`\<`string`, `unknown`\>[]

#### Inherited from

ChainObject.deserialize

#### Source

[chain-api/src/types/ChainObject.ts:70](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L70)

***

### getCompositeKeyFromParts()

> **`static`** **getCompositeKeyFromParts**(`indexKey`, `parts`): `string`

#### Parameters

▪ **indexKey**: `string`

▪ **parts**: `unknown`[]

#### Inherited from

ChainObject.getCompositeKeyFromParts

#### Source

[chain-api/src/types/ChainObject.ts:99](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L99)

***

### getStringKeyFromParts()

> **`static`** **getStringKeyFromParts**(`parts`): `string`

#### Parameters

▪ **parts**: `string`[]

#### Inherited from

ChainObject.getStringKeyFromParts

#### Source

[chain-api/src/types/ChainObject.ts:119](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/ChainObject.ts#L119)
