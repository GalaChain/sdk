**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > verifyAndUseAllowances

# Function: verifyAndUseAllowances()

> **verifyAndUseAllowances**(`ctx`, `grantedBy`, `tokenInstanceKey`, `quantity`, `tokenInstance`, `authorizedOnBehalf`, `actionType`, `useAllowancesArr`): `Promise`\<`boolean`\>

## Parameters

▪ **ctx**: [`GalaChainContext`](../classes/GalaChainContext.md)

▪ **grantedBy**: `string`

▪ **tokenInstanceKey**: `TokenInstanceKey`

▪ **quantity**: `BigNumber`

▪ **tokenInstance**: `TokenInstance`

▪ **authorizedOnBehalf**: `string`

▪ **actionType**: `AllowanceType`

▪ **useAllowancesArr**: `string`[]

## Source

[chaincode/src/allowances/verifyAndUseAllowances.ts:25](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/allowances/verifyAndUseAllowances.ts#L25)
