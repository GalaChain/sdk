**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > getObjectsByKeys

# Function: getObjectsByKeys()

> **getObjectsByKeys**\<`T`\>(`ctx`, `constructor`, `objectIds`): `Promise`\<`T`[]\>

Gets objects by keys and returns them in the same order as in `projectIds` parameter.
If getting at least one object fails, throws an exception.

## Type parameters

▪ **T** extends `ChainObject`

## Parameters

▪ **ctx**: [`GalaChainContext`](../classes/GalaChainContext.md)

▪ **constructor**: `ClassConstructor`\<`Inferred`\<`T`, `ChainObject`\>\>

▪ **objectIds**: `string`[]

## Source

[chaincode/src/utils/state.ts:179](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/utils/state.ts#L179)
