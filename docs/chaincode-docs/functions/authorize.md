**@gala-chain/chaincode** ∙ [API](../exports.md)

***

[API](../exports.md) > authorize

# Function: authorize()

> **authorize**(`ctx`, `dto`, `legacyCAUser`): `Promise`\<`object`\>

## Parameters

▪ **ctx**: [`GalaChainContext`](../classes/GalaChainContext.md)

▪ **dto**: `undefined` \| `ChainCallDTO`

▪ **legacyCAUser**: `string`

fallback user alias to use then the new flow is not applicable

## Returns

User alias of the calling user.

## Source

[chaincode/src/contracts/authorize.ts:54](https://github.com/GalaChain/sdk/blob/bcbbb18/chaincode/src/contracts/authorize.ts#L54)
