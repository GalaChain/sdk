**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > getObjectsByPartialCompositeKey

# Function: getObjectsByPartialCompositeKey()

> **getObjectsByPartialCompositeKey**\<`T`\>(`ctx`, `objectType`, `attributes`, `constructor`, `muteQueryLimitError`): `Promise`\<`T`[]\>

## Type parameters

▪ **T** extends `ChainObject`

## Parameters

▪ **ctx**: [`GalaChainContext`](../classes/GalaChainContext.md)

▪ **objectType**: `string`

▪ **attributes**: `string`[]

▪ **constructor**: `ClassConstructor`\<`Inferred`\<`T`, `ChainObject`\>\>

▪ **muteQueryLimitError**: `boolean`

## Source

[chaincode/src/utils/state.ts:65](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/utils/state.ts#L65)
