**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > parseValidDTO

# Function: parseValidDTO()

> **parseValidDTO**\<`T`\>(`constructor`, `jsonStringOrObj`): `Promise`\<`T`\>

Parses JSON string and creates a Promise with valid DTO. Throws exception in case of validation errors.

## Type parameters

▪ **T** extends [`ChainCallDTO`](../classes/ChainCallDTO.md)

## Parameters

▪ **constructor**: [`ClassConstructor`](../interfaces/ClassConstructor.md)\<[`Inferred`](../type-aliases/Inferred.md)\<`T`, [`ChainCallDTO`](../classes/ChainCallDTO.md)\>\>

▪ **jsonStringOrObj**: `string` \| `Record`\<`string`, `unknown`\>

## Source

[chain-api/src/types/dtos.ts:50](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L50)
