**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > HFClientBuilder

# Class: HFClientBuilder

## Contents

- [Extends](HFClientBuilder.md#extends)
- [Constructors](HFClientBuilder.md#constructors)
  - [new HFClientBuilder(orgMsp, adminId, adminSecret, connectionProfile)](HFClientBuilder.md#new-hfclientbuilderorgmsp-adminid-adminsecret-connectionprofile)
- [Properties](HFClientBuilder.md#properties)
  - [asLocalhost](HFClientBuilder.md#aslocalhost)
  - [caClient](HFClientBuilder.md#caclient)
  - [connectionProfile](HFClientBuilder.md#connectionprofile)
  - [orgMsp](HFClientBuilder.md#orgmsp)
  - [useServiceDiscovery](HFClientBuilder.md#useservicediscovery)
- [Methods](HFClientBuilder.md#methods)
  - [buildConnectedGateway()](HFClientBuilder.md#buildconnectedgateway)
  - [forContract()](HFClientBuilder.md#forcontract)

## Extends

- [`ChainClientBuilder`](ChainClientBuilder.md)

## Constructors

### new HFClientBuilder(orgMsp, adminId, adminSecret, connectionProfile)

> **new HFClientBuilder**(`orgMsp`, `adminId`, `adminSecret`, `connectionProfile`): [`HFClientBuilder`](HFClientBuilder.md)

#### Parameters

▪ **orgMsp**: `string`

▪ **adminId**: `string`

▪ **adminSecret**: `string`

▪ **connectionProfile**: `Record`\<`string`, `unknown`\>

#### Overrides

[`ChainClientBuilder`](ChainClientBuilder.md).[`constructor`](ChainClientBuilder.md#constructors)

#### Source

[hf/HFClientBuilder.ts:24](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClientBuilder.ts#L24)

## Properties

### asLocalhost

> **`readonly`** **asLocalhost**: `boolean`

#### Source

[hf/HFClientBuilder.ts:21](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClientBuilder.ts#L21)

***

### caClient

> **`private`** **`readonly`** **caClient**: [`CAClient`](CAClient.md)

#### Source

[hf/HFClientBuilder.ts:22](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClientBuilder.ts#L22)

***

### connectionProfile

> **`private`** **`readonly`** **connectionProfile**: `Record`\<`string`, `unknown`\>

#### Source

[hf/HFClientBuilder.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClientBuilder.ts#L28)

***

### orgMsp

> **`readonly`** **orgMsp**: `string`

#### Source

[hf/HFClientBuilder.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClientBuilder.ts#L25)

***

### useServiceDiscovery

> **`readonly`** **useServiceDiscovery**: `boolean`

#### Source

[hf/HFClientBuilder.ts:20](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClientBuilder.ts#L20)

## Methods

### buildConnectedGateway()

> **`private`** **buildConnectedGateway**(`userId`): `Promise`\<`Gateway`\>

#### Parameters

▪ **userId**: `string`

#### Source

[hf/HFClientBuilder.ts:66](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClientBuilder.ts#L66)

***

### forContract()

> **forContract**(`cfg`): [`HFClient`](HFClient.md)

#### Parameters

▪ **cfg**: [`ContractConfig`](../interfaces/ContractConfig.md)

#### Overrides

[`ChainClientBuilder`](ChainClientBuilder.md).[`forContract`](ChainClientBuilder.md#abstract-forcontract)

#### Source

[hf/HFClientBuilder.ts:54](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/hf/HFClientBuilder.ts#L54)
