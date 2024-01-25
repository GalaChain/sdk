**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > getObjectsByPartialCompositeKeyWithPagination

# Function: getObjectsByPartialCompositeKeyWithPagination()

> **getObjectsByPartialCompositeKeyWithPagination**\<`T`\>(`ctx`, `objectType`, `attributes`, `constructor`, `bookmark`, `limit`): `Promise`\<`object`\>

## Type parameters

▪ **T** extends `ChainObject`

## Parameters

▪ **ctx**: [`GalaChainContext`](../classes/GalaChainContext.md)

▪ **objectType**: `string`

▪ **attributes**: `string`[]

▪ **constructor**: `ClassConstructor`\<`Inferred`\<`T`, `ChainObject`\>\>

▪ **bookmark**: `undefined` \| `string`

▪ **limit**: `number`= `TOTAL_RESULTS_LIMIT`

## Source

[chaincode/src/utils/state.ts:100](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/utils/state.ts#L100)
