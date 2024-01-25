**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > createAndSignValidDTO

# Function: createAndSignValidDTO()

> **createAndSignValidDTO**\<`T`\>(`constructor`, `plain`, `privateKey`): `Promise`\<`T`\>

Creates valid signed DTO object from provided plain object. Throws exception in case of validation errors.

## Type parameters

▪ **T** extends [`ChainCallDTO`](../classes/ChainCallDTO.md)

## Parameters

▪ **constructor**: [`ClassConstructor`](../interfaces/ClassConstructor.md)\<`T`\>

▪ **plain**: [`NonFunctionProperties`](../type-aliases/NonFunctionProperties.md)\<`T`\>

▪ **privateKey**: `string`

## Returns

## Deprecated

Use `(await createValidDTO(...)).signed(...)` instead

## Source

[chain-api/src/types/dtos.ts:82](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/types/dtos.ts#L82)
