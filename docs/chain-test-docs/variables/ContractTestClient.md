**@gala-chain/test** ∙ [API](../exports.md)

***

[API](../exports.md) > ContractTestClient

# Variable: ContractTestClient

> **`const`** **ContractTestClient**: `object`

## Type declaration

### createForCurator

> **createForCurator**: (`user`, `contract`) => `ChainClient` & `CommonContractAPI` & `ChainUserAPI` = `createForCurator`

#### Parameters

▪ **user**: `ChainUser`

▪ **contract**: `ContractConfig`

### createForPartner

> **createForPartner**: (`user`, `contract`) => `ChainClient` & `CommonContractAPI` & `ChainUserAPI` = `createForPartner`

#### Parameters

▪ **user**: `ChainUser`

▪ **contract**: `ContractConfig`

### createForUser

> **createForUser**: (`user`, `contract`) => `ChainClient` & `CommonContractAPI` & `ChainUserAPI` = `createForUser`

#### Parameters

▪ **user**: `ChainUser`

▪ **contract**: `ContractConfig`

### getBuilder

> **getBuilder**: (`params`) => `ChainClientBuilder` = `getBuilder`

#### Parameters

▪ **params**: `TestClientParams`

## Source

[chain-test/src/e2e/ContractTestClient.ts:185](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/e2e/ContractTestClient.ts#L185)
