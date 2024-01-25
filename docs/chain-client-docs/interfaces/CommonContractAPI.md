**@gala-chain/client** ∙ [API](../exports.md)

***

[API](../exports.md) > CommonContractAPI

# Interface: CommonContractAPI

## Contents

- [Extends](CommonContractAPI.md#extends)
- [Methods](CommonContractAPI.md#methods)
  - [GetChaincodeVersion()](CommonContractAPI.md#getchaincodeversion)
  - [GetContractAPI()](CommonContractAPI.md#getcontractapi)
  - [GetObjectByKey()](CommonContractAPI.md#getobjectbykey)
  - [GetObjectHistory()](CommonContractAPI.md#getobjecthistory)

## Extends

- `Record`\<`string`, `unknown`\>

## Methods

### GetChaincodeVersion()

> **GetChaincodeVersion**(): `Promise`\<`GalaChainResponse`\<`string`\>\>

#### Source

[api/CommonContractAPI.ts:26](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/CommonContractAPI.ts#L26)

***

### GetContractAPI()

> **GetContractAPI**(): `Promise`\<`GalaChainResponse`\<`ContractAPI`\>\>

#### Source

[api/CommonContractAPI.ts:27](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/CommonContractAPI.ts#L27)

***

### GetObjectByKey()

> **GetObjectByKey**(`key`): `Promise`\<`GalaChainResponse`\<`Record`\<`string`, `unknown`\>\>\>

#### Parameters

▪ **key**: `string`

#### Source

[api/CommonContractAPI.ts:28](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/CommonContractAPI.ts#L28)

***

### GetObjectHistory()

> **GetObjectHistory**(`key`): `Promise`\<`GalaChainResponse`\<`Record`\<`string`, `unknown`\>\>\>

#### Parameters

▪ **key**: `string`

#### Source

[api/CommonContractAPI.ts:29](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-client/src/api/CommonContractAPI.ts#L29)
