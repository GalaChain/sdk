**@gala-chain/test** ∙ [API](../exports.md)

***

[API](../exports.md) > TestClients

# Variable: TestClients

> **`const`** **TestClients**: `object`

## Type declaration

### create

> **create**: (`user`?) => `Promise`\<[`ChainClients`](../type-aliases/ChainClients.md)\<[`DefaultChainClientOptions`](../interfaces/DefaultChainClientOptions.md)\>\>\<`T`\>(`user`?, `opts`?) => `Promise`\<[`ChainClients`](../type-aliases/ChainClients.md)\<`T`\>\>\<`T`\>(`opts`) => `Promise`\<[`ChainClients`](../type-aliases/ChainClients.md)\<`T`\>\>

#### Parameters

▪ **user?**: `string` \| `ChainUser`

#### Type parameters

▪ **T** extends `ChainClientOptions`

#### Parameters

▪ **user?**: `string` \| `ChainUser`

▪ **opts?**: `T`

#### Type parameters

▪ **T** extends `ChainClientOptions`

#### Parameters

▪ **opts**: `T`

### createForAdmin

> **createForAdmin**: \<`T`\>(`opts`?) => `Promise`\<[`AdminChainClients`](../type-aliases/AdminChainClients.md)\<`T`\>\>

#### Type parameters

▪ **T** extends `ChainClientOptions`

#### Parameters

▪ **opts?**: `T`

## Source

[chain-test/src/e2e/TestClients.ts:200](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/e2e/TestClients.ts#L200)
