**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > TokenHold

# Class: TokenHold

## Contents

- [Constructors](TokenHold.md#constructors)
  - [new TokenHold(params)](TokenHold.md#new-tokenholdparams)
- [Properties](TokenHold.md#properties)
  - [created](TokenHold.md#created)
  - [createdBy](TokenHold.md#createdby)
  - [expires](TokenHold.md#expires)
  - [instanceId](TokenHold.md#instanceid)
  - [lockAuthority](TokenHold.md#lockauthority)
  - [name](TokenHold.md#name)
  - [quantity](TokenHold.md#quantity)
  - [DEFAULT\_EXPIRES](TokenHold.md#default-expires)
- [Methods](TokenHold.md#methods)
  - [isExpired()](TokenHold.md#isexpired)
  - [matches()](TokenHold.md#matches)
  - [createValid()](TokenHold.md#createvalid)

## Constructors

### new TokenHold(params)

> **new TokenHold**(`params`?): [`TokenHold`](TokenHold.md)

#### Parameters

▪ **params?**: `object`

▪ **params.created?**: `number`

▪ **params.createdBy?**: `string`

▪ **params.expires?**: `number`

▪ **params.instanceId?**: `BigNumber`

▪ **params.lockAuthority?**: `string`

▪ **params.name?**: `string`

▪ **params.quantity?**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:475](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L475)

## Properties

### created

> **`readonly`** **created**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:455](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L455)

***

### createdBy

> **`readonly`** **createdBy**: `string`

#### Source

[chain-api/src/types/TokenBalance.ts:442](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L442)

***

### expires

> **`readonly`** **expires**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:459](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L459)

***

### instanceId

> **`readonly`** **instanceId**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:447](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L447)

***

### lockAuthority

> **lockAuthority**?: `string`

#### Source

[chain-api/src/types/TokenBalance.ts:473](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L473)

***

### name

> **`readonly`** **name**?: `string`

#### Source

[chain-api/src/types/TokenBalance.ts:463](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L463)

***

### quantity

> **`readonly`** **quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:451](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L451)

***

### DEFAULT\_EXPIRES

> **`static`** **`readonly`** **DEFAULT\_EXPIRES**: `0` = `0`

#### Source

[chain-api/src/types/TokenBalance.ts:439](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L439)

## Methods

### isExpired()

> **isExpired**(`currentTime`): `boolean`

#### Parameters

▪ **currentTime**: `number`

#### Source

[chain-api/src/types/TokenBalance.ts:522](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L522)

***

### matches()

> **matches**(`instanceId`, `name`): `boolean`

#### Parameters

▪ **instanceId**: `BigNumber`

▪ **name**: `undefined` \| `string`

#### Source

[chain-api/src/types/TokenBalance.ts:518](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L518)

***

### createValid()

> **`static`** **createValid**(`params`): `Promise`\<[`TokenHold`](TokenHold.md)\>

#### Parameters

▪ **params**: `object`

▪ **params.created**: `number`

▪ **params.createdBy**: `string`

▪ **params.expires**: `undefined` \| `number`

▪ **params.instanceId**: `BigNumber`

▪ **params.lockAuthority**: `undefined` \| `string`

▪ **params.name**: `undefined` \| `string`

▪ **params.quantity**: `BigNumber`

#### Source

[chain-api/src/types/TokenBalance.ts:499](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/TokenBalance.ts#L499)
