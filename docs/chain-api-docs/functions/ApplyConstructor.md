**@gala-chain/api** ∙ [API](../exports.md)

***

[API](../exports.md) > ApplyConstructor

# Function: ApplyConstructor()

> **ApplyConstructor**\<`ClassInstance`, `ConstructorSignature`, `SerializedType`\>(`Constructor`, `fromTransformer`, `toTransformer`): () => (`target`, `propertyKey`) => `void`

## Type parameters

▪ **ClassInstance**

▪ **ConstructorSignature**

▪ **SerializedType**

## Parameters

▪ **Constructor**: `ClassConstructor`\<`ConstructorSignature`\>

▪ **fromTransformer**: (`propertyValue`) => `ClassInstance`

▪ **toTransformer**: (`classInstance`) => `SerializedType`

## Returns

> > (): (`target`, `propertyKey`) => `void`
>
> ### Returns
>
> > > (`target`, `propertyKey`): `void`
> >
> > #### Parameters
> >
> > ▪ **target**: `Object`
> >
> > ▪ **propertyKey**: `string` \| `symbol`
> >
> > #### Source
> >
> > [chain-api/src/utils/transform-decorators.ts:43](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/transform-decorators.ts#L43)
> >
>
> ### Source
>
> [chain-api/src/utils/transform-decorators.ts:31](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/transform-decorators.ts#L31)
>

## Source

[chain-api/src/utils/transform-decorators.ts:26](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-api/src/utils/transform-decorators.ts#L26)
