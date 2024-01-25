**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > RestApiClient

# Class: RestApiClient

## Contents

- [Extends](RestApiClient.md#extends)
- [Constructors](RestApiClient.md#constructors)
  - [new RestApiClient(builder, contractConfig, credentials, orgMsp)](RestApiClient.md#new-restapiclientbuilder-contractconfig-credentials-orgmsp)
- [Properties](RestApiClient.md#properties)
  - [builder](RestApiClient.md#builder)
  - [contractConfig](RestApiClient.md#contractconfig)
  - [credentials](RestApiClient.md#credentials)
  - [orgMsp](RestApiClient.md#orgmsp)
  - [restApiUrl](RestApiClient.md#restapiurl)
  - [userId](RestApiClient.md#userid)
- [Methods](RestApiClient.md#methods)
  - [disconnect()](RestApiClient.md#disconnect)
  - [evaluateTransaction()](RestApiClient.md#evaluatetransaction)
  - [extendAPI()](RestApiClient.md#extendapi)
  - [forUser()](RestApiClient.md#foruser)
  - [isReady()](RestApiClient.md#isready)
  - [post()](RestApiClient.md#post)
  - [submitTransaction()](RestApiClient.md#submittransaction)

## Extends

- [`ChainClient`](ChainClient.md)

## Constructors

### new RestApiClient(builder, contractConfig, credentials, orgMsp)

> **new RestApiClient**(`builder`, `contractConfig`, `credentials`, `orgMsp`): [`RestApiClient`](RestApiClient.md)

#### Parameters

▪ **builder**: `Promise`\<[`RestApiClientBuilder`](RestApiClientBuilder.md)\>

▪ **contractConfig**: [`ContractConfig`](../interfaces/ContractConfig.md)

▪ **credentials**: `RestApiAdminCredentials`

▪ **orgMsp**: `string`

#### Overrides

[`ChainClient`](ChainClient.md).[`constructor`](ChainClient.md#constructors)

#### Source

[rest-api/RestApiClient.ts:66](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L66)

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

### credentials

> **`private`** **`readonly`** **credentials**: `RestApiAdminCredentials`

#### Source

[rest-api/RestApiClient.ts:69](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L69)

***

### orgMsp

> **`readonly`** **orgMsp**: `string`

#### Inherited from

[`ChainClient`](ChainClient.md).[`orgMsp`](ChainClient.md#orgmsp)

#### Source

[generic/ChainClient.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L31)

***

### restApiUrl

> **`private`** **`readonly`** **restApiUrl**: `Promise`\<`string`\>

#### Source

[rest-api/RestApiClient.ts:64](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L64)

***

### userId

> **`readonly`** **userId**: `string`

#### Inherited from

[`ChainClient`](ChainClient.md).[`userId`](ChainClient.md#userid)

#### Source

[generic/ChainClient.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClient.ts#L29)

## Methods

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

#### Overrides

[`ChainClient`](ChainClient.md).[`disconnect`](ChainClient.md#abstract-disconnect)

#### Source

[rest-api/RestApiClient.ts:82](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L82)

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

[rest-api/RestApiClient.ts:97](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L97)

***

### extendAPI()

> **extendAPI**\<`T`\>(`apiHandlerFn`): [`RestApiClient`](RestApiClient.md) & `T`

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

> **forUser**(): [`ChainClient`](ChainClient.md)

#### Overrides

[`ChainClient`](ChainClient.md).[`forUser`](ChainClient.md#abstract-foruser)

#### Source

[rest-api/RestApiClient.ts:131](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L131)

***

### isReady()

> **isReady**(): `Promise`\<`true`\>

#### Source

[rest-api/RestApiClient.ts:76](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L76)

***

### post()

> **post**\<`T`\>(`path`, `dtoOrResp`?, `resp`?): `Promise`\<`GalaChainResponse`\<`T`\>\>

#### Type parameters

▪ **T**

#### Parameters

▪ **path**: `string`

▪ **dtoOrResp?**: `ChainCallDTO` \| [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

▪ **resp?**: [`ClassType`](../type-aliases/ClassType.md)\<`Inferred`\<`T`\>\>

#### Source

[rest-api/RestApiClient.ts:107](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L107)

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

[rest-api/RestApiClient.ts:87](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L87)
