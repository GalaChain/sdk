**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > HFClient

# Class: HFClient

## Contents

- [Extends](HFClient.md#extends)
- [Constructors](HFClient.md#constructors)
  - [new HFClient(resolvedBuilder, userId, contractConfig, createContractPromise)](HFClient.md#new-hfclientresolvedbuilder-userid-contractconfig-createcontractpromise)
- [Properties](HFClient.md#properties)
  - [builder](HFClient.md#builder)
  - [contractConfig](HFClient.md#contractconfig)
  - [contractPromise](HFClient.md#contractpromise)
  - [createContractPromise](HFClient.md#createcontractpromise)
  - [orgMsp](HFClient.md#orgmsp)
  - [resolvedBuilder](HFClient.md#resolvedbuilder)
  - [userId](HFClient.md#userid)
- [Accessors](HFClient.md#accessors)
  - [contract](HFClient.md#contract)
- [Methods](HFClient.md#methods)
  - [disconnect()](HFClient.md#disconnect)
  - [evaluateTransaction()](HFClient.md#evaluatetransaction)
  - [extendAPI()](HFClient.md#extendapi)
  - [forUser()](HFClient.md#foruser)
  - [submitTransaction()](HFClient.md#submittransaction)

## Extends

- [`ChainClient`](ChainClient.md)

## Constructors

### new HFClient(resolvedBuilder, userId, contractConfig, createContractPromise)

> **new HFClient**(`resolvedBuilder`, `userId`, `contractConfig`, `createContractPromise`): [`HFClient`](HFClient.md)

#### Parameters

▪ **resolvedBuilder**: [`HFClientBuilder`](HFClientBuilder.md)

▪ **userId**: `string`

▪ **contractConfig**: [`ContractConfig`](../interfaces/ContractConfig.md)

▪ **createContractPromise**: (`userId`) => `Promise`\<`object`\>

#### Overrides

[`ChainClient`](ChainClient.md).[`constructor`](ChainClient.md#constructors)

#### Source

[hf/HFClient.ts:24](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L24)

## Properties

### builder

> **`readonly`** **builder**: `Promise`\<[`ChainClientBuilder`](ChainClientBuilder.md)\>

#### Inherited from

[`ChainClient`](ChainClient.md).[`builder`](ChainClient.md#builder)

#### Source

[generic/ChainClient.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L28)

***

### contractConfig

> **`readonly`** **contractConfig**: [`ContractConfig`](../interfaces/ContractConfig.md)

#### Inherited from

[`ChainClient`](ChainClient.md).[`contractConfig`](ChainClient.md#contractconfig)

#### Source

[generic/ChainClient.ts:30](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L30)

***

### contractPromise

> **`private`** **contractPromise**: `undefined` \| `Promise`\<`object`\>

#### Source

[hf/HFClient.ts:22](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L22)

***

### createContractPromise

> **`private`** **`readonly`** **createContractPromise**: (`userId`) => `Promise`\<`object`\>

#### Parameters

▪ **userId**: `string`

#### Source

[hf/HFClient.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L28)

***

### orgMsp

> **`readonly`** **orgMsp**: `string`

#### Inherited from

[`ChainClient`](ChainClient.md).[`orgMsp`](ChainClient.md#orgmsp)

#### Source

[generic/ChainClient.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L31)

***

### resolvedBuilder

> **`private`** **resolvedBuilder**: [`HFClientBuilder`](HFClientBuilder.md)

#### Source

[hf/HFClient.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L25)

***

### userId

> **`readonly`** **userId**: `string`

#### Inherited from

[`ChainClient`](ChainClient.md).[`userId`](ChainClient.md#userid)

#### Source

[generic/ChainClient.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L29)

## Accessors

### contract

> **`get`** **contract**(): `Promise`\<`Contract`\>

#### Source

[hf/HFClient.ts:41](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L41)

## Methods

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

#### Overrides

[`ChainClient`](ChainClient.md).[`disconnect`](ChainClient.md#abstract-disconnect)

#### Source

[hf/HFClient.ts:49](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L49)

***

### evaluateTransaction()

> **evaluateTransaction**\<`T`\>(`method`, `dtoOrResp`?, `resp`?): `Promise`\<`GalaChainResponse`\<`T`\>\>

#### Type parameters

▪ **T**

#### Parameters

▪ **method**: `string`

▪ **dtoOrResp?**: `ChainCallDTO` \| [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

▪ **resp?**: [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

#### Overrides

[`ChainClient`](ChainClient.md).[`evaluateTransaction`](ChainClient.md#abstract-evaluatetransaction)

#### Source

[hf/HFClient.ts:78](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L78)

***

### extendAPI()

> **extendAPI**\<`T`\>(`apiHandlerFn`): [`HFClient`](HFClient.md) & `T`

#### Type parameters

▪ **T** extends `object`

#### Parameters

▪ **apiHandlerFn**: (`_`) => `T`

#### Inherited from

[`ChainClient`](ChainClient.md).[`extendAPI`](ChainClient.md#extendapi)

#### Source

[generic/ChainClient.ts:65](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L65)

***

### forUser()

> **forUser**(`userId`): [`ChainClient`](ChainClient.md)

#### Parameters

▪ **userId**: `string`

#### Overrides

[`ChainClient`](ChainClient.md).[`forUser`](ChainClient.md#abstract-foruser)

#### Source

[hf/HFClient.ts:37](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L37)

***

### submitTransaction()

> **submitTransaction**\<`T`\>(`method`, `dtoOrResp`?, `resp`?): `Promise`\<`GalaChainResponse`\<`T`\>\>

#### Type parameters

▪ **T**

#### Parameters

▪ **method**: `string`

▪ **dtoOrResp?**: `ChainCallDTO` \| [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

▪ **resp?**: [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

#### Overrides

[`ChainClient`](ChainClient.md).[`submitTransaction`](ChainClient.md#abstract-submittransaction)

#### Source

[hf/HFClient.ts:59](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClient.ts#L59)
