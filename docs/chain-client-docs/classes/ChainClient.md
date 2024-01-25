**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > ChainClient

# Class: `abstract` ChainClient

## Contents

- [Extended By](ChainClient.md#extended-by)
- [Constructors](ChainClient.md#constructors)
  - [new ChainClient(builder, userId, contractConfig, orgMsp)](ChainClient.md#new-chainclientbuilder-userid-contractconfig-orgmsp)
- [Properties](ChainClient.md#properties)
  - [builder](ChainClient.md#builder)
  - [contractConfig](ChainClient.md#contractconfig)
  - [orgMsp](ChainClient.md#orgmsp)
  - [userId](ChainClient.md#userid)
- [Methods](ChainClient.md#methods)
  - [`abstract` disconnect()](ChainClient.md#abstract-disconnect)
  - [`abstract` evaluateTransaction()](ChainClient.md#abstract-evaluatetransaction)
  - [extendAPI()](ChainClient.md#extendapi)
  - [`abstract` forUser()](ChainClient.md#abstract-foruser)
  - [`abstract` submitTransaction()](ChainClient.md#abstract-submittransaction)

## Extended By

- [`HFClient`](HFClient.md)
- [`RestApiClient`](RestApiClient.md)

## Constructors

### new ChainClient(builder, userId, contractConfig, orgMsp)

> **`protected`** **new ChainClient**(`builder`, `userId`, `contractConfig`, `orgMsp`): [`ChainClient`](ChainClient.md)

#### Parameters

▪ **builder**: `Promise`\<[`ChainClientBuilder`](ChainClientBuilder.md)\>

▪ **userId**: `string`

▪ **contractConfig**: [`ContractConfig`](../interfaces/ContractConfig.md)

▪ **orgMsp**: `string`

#### Source

[generic/ChainClient.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L27)

## Properties

### builder

> **`readonly`** **builder**: `Promise`\<[`ChainClientBuilder`](ChainClientBuilder.md)\>

#### Source

[generic/ChainClient.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L28)

***

### contractConfig

> **`readonly`** **contractConfig**: [`ContractConfig`](../interfaces/ContractConfig.md)

#### Source

[generic/ChainClient.ts:30](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L30)

***

### orgMsp

> **`readonly`** **orgMsp**: `string`

#### Source

[generic/ChainClient.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L31)

***

### userId

> **`readonly`** **userId**: `string`

#### Source

[generic/ChainClient.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L29)

## Methods

### `abstract` disconnect()

> **`abstract`** **disconnect**(): `Promise`\<`void`\>

#### Source

[generic/ChainClient.ts:61](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L61)

***

### `abstract` evaluateTransaction()

#### evaluateTransaction(method)

> **`abstract`** **evaluateTransaction**(`method`): `Promise`\<`GalaChainResponse`\<`unknown`\>\>

##### Parameters

▪ **method**: `string`

##### Source

[generic/ChainClient.ts:46](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L46)

#### evaluateTransaction(method, dto)

> **`abstract`** **evaluateTransaction**(`method`, `dto`): `Promise`\<`GalaChainResponse`\<`unknown`\>\>

##### Parameters

▪ **method**: `string`

▪ **dto**: `ChainCallDTO`

##### Source

[generic/ChainClient.ts:48](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L48)

#### evaluateTransaction(method, resp)

> **`abstract`** **evaluateTransaction**\<`T`\>(`method`, `resp`): `Promise`\<`GalaChainResponse`\<`T`\>\>

##### Type parameters

▪ **T**

##### Parameters

▪ **method**: `string`

▪ **resp**: [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

##### Source

[generic/ChainClient.ts:50](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L50)

#### evaluateTransaction(method, dto, resp)

> **`abstract`** **evaluateTransaction**\<`T`\>(`method`, `dto`, `resp`): `Promise`\<`GalaChainResponse`\<`T`\>\>

##### Type parameters

▪ **T**

##### Parameters

▪ **method**: `string`

▪ **dto**: `ChainCallDTO`

▪ **resp**: [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

##### Source

[generic/ChainClient.ts:55](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L55)

***

### extendAPI()

> **extendAPI**\<`T`\>(`apiHandlerFn`): [`ChainClient`](ChainClient.md) & `T`

#### Type parameters

▪ **T** extends `object`

#### Parameters

▪ **apiHandlerFn**: (`_`) => `T`

#### Source

[generic/ChainClient.ts:65](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L65)

***

### `abstract` forUser()

> **`abstract`** **forUser**(`userId`): [`ChainClient`](ChainClient.md)

#### Parameters

▪ **userId**: `string`

#### Source

[generic/ChainClient.ts:63](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L63)

***

### `abstract` submitTransaction()

#### submitTransaction(method)

> **`abstract`** **submitTransaction**(`method`): `Promise`\<`GalaChainResponse`\<`unknown`\>\>

##### Parameters

▪ **method**: `string`

##### Source

[generic/ChainClient.ts:34](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L34)

#### submitTransaction(method, dto)

> **`abstract`** **submitTransaction**(`method`, `dto`): `Promise`\<`GalaChainResponse`\<`unknown`\>\>

##### Parameters

▪ **method**: `string`

▪ **dto**: `ChainCallDTO`

##### Source

[generic/ChainClient.ts:36](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L36)

#### submitTransaction(method, resp)

> **`abstract`** **submitTransaction**\<`T`\>(`method`, `resp`): `Promise`\<`GalaChainResponse`\<`T`\>\>

##### Type parameters

▪ **T**

##### Parameters

▪ **method**: `string`

▪ **resp**: [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

##### Source

[generic/ChainClient.ts:38](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L38)

#### submitTransaction(method, dto, resp)

> **`abstract`** **submitTransaction**\<`T`\>(`method`, `dto`, `resp`): `Promise`\<`GalaChainResponse`\<`T`\>\>

##### Type parameters

▪ **T**

##### Parameters

▪ **method**: `string`

▪ **dto**: `ChainCallDTO`

▪ **resp**: [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

##### Source

[generic/ChainClient.ts:40](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L40)
