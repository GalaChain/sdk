**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > RestApiClientBuilder

# Class: RestApiClientBuilder

## Contents

- [Extends](RestApiClientBuilder.md#extends)
- [Constructors](RestApiClientBuilder.md#constructors)
  - [new RestApiClientBuilder(restApiUrl, orgMsp, credentials, restApiConfig)](RestApiClientBuilder.md#new-restapiclientbuilderrestapiurl-orgmsp-credentials-restapiconfig)
- [Properties](RestApiClientBuilder.md#properties)
  - [credentials](RestApiClientBuilder.md#credentials)
  - [orgMsp](RestApiClientBuilder.md#orgmsp)
  - [restApiConfig](RestApiClientBuilder.md#restapiconfig)
  - [restApiUrl](RestApiClientBuilder.md#restapiurl)
  - [isRestApiInitializedAndHealthy](RestApiClientBuilder.md#isrestapiinitializedandhealthy)
  - [restApiConfigReversed](RestApiClientBuilder.md#restapiconfigreversed)
- [Methods](RestApiClientBuilder.md#methods)
  - [ensureInitializedRestApi()](RestApiClientBuilder.md#ensureinitializedrestapi)
  - [forContract()](RestApiClientBuilder.md#forcontract)

## Extends

- [`ChainClientBuilder`](ChainClientBuilder.md)

## Constructors

### new RestApiClientBuilder(restApiUrl, orgMsp, credentials, restApiConfig)

> **new RestApiClientBuilder**(`restApiUrl`, `orgMsp`, `credentials`, `restApiConfig`): [`RestApiClientBuilder`](RestApiClientBuilder.md)

#### Parameters

▪ **restApiUrl**: `string`

▪ **orgMsp**: `string`

▪ **credentials**: `RestApiAdminCredentials`

▪ **restApiConfig**: `RestApiConfig`

#### Overrides

[`ChainClientBuilder`](ChainClientBuilder.md).[`constructor`](ChainClientBuilder.md#constructors)

#### Source

[rest-api/RestApiClient.ts:145](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L145)

## Properties

### credentials

> **`private`** **`readonly`** **credentials**: `RestApiAdminCredentials`

#### Source

[rest-api/RestApiClient.ts:148](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L148)

***

### orgMsp

> **`readonly`** **orgMsp**: `string`

#### Source

[rest-api/RestApiClient.ts:147](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L147)

***

### restApiConfig

> **`readonly`** **restApiConfig**: `RestApiConfig`

#### Source

[rest-api/RestApiClient.ts:149](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L149)

***

### restApiUrl

> **`readonly`** **restApiUrl**: `string`

#### Source

[rest-api/RestApiClient.ts:146](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L146)

***

### isRestApiInitializedAndHealthy

> **`static`** **isRestApiInitializedAndHealthy**: `Record`\<`string`, `boolean`\> = `{}`

#### Source

[rest-api/RestApiClient.ts:142](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L142)

***

### restApiConfigReversed

> **`static`** **restApiConfigReversed**: `Record`\<`string`, `object`\> = `{}`

#### Source

[rest-api/RestApiClient.ts:143](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L143)

## Methods

### ensureInitializedRestApi()

> **`private`** **ensureInitializedRestApi**(): `Promise`\<`void`\>

#### Source

[rest-api/RestApiClient.ts:154](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L154)

***

### forContract()

> **forContract**(`config`): [`RestApiClient`](RestApiClient.md)

#### Parameters

▪ **config**: [`ContractConfig`](../interfaces/ContractConfig.md)

#### Overrides

[`ChainClientBuilder`](ChainClientBuilder.md).[`forContract`](ChainClientBuilder.md#abstract-forcontract)

#### Source

[rest-api/RestApiClient.ts:197](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/rest-api/RestApiClient.ts#L197)
