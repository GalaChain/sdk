**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > ChainClientBuilder

# Class: `abstract` ChainClientBuilder

## Contents

- [Extended By](ChainClientBuilder.md#extended-by)
- [Constructors](ChainClientBuilder.md#constructors)
  - [new ChainClientBuilder()](ChainClientBuilder.md#new-chainclientbuilder)
- [Methods](ChainClientBuilder.md#methods)
  - [`abstract` forContract()](ChainClientBuilder.md#abstract-forcontract)

## Extended By

- [`HFClientBuilder`](HFClientBuilder.md)
- [`RestApiClientBuilder`](RestApiClientBuilder.md)

## Constructors

### new ChainClientBuilder()

> **new ChainClientBuilder**(): [`ChainClientBuilder`](ChainClientBuilder.md)

## Methods

### `abstract` forContract()

> **`abstract`** **forContract**(`config`): [`ChainClient`](ChainClient.md)

#### Parameters

▪ **config**: [`ContractConfig`](../interfaces/ContractConfig.md)

#### Source

[generic/ChainClientBuilder.ts:19](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/generic/ChainClientBuilder.ts#L19)
