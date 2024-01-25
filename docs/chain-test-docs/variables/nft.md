**@gala-chain/test** ∙ [API](../exports.md)

***

[API](../exports.md) > nft

# Variable: nft

> **nft**: `object`

## Type declaration

### tokenAllowance

> **tokenAllowance**: `CreateInstanceFn`\<`TokenAllowance`\>

### tokenAllowancePlain

> **tokenAllowancePlain**: (`txUnixTime`) => `object`

#### Parameters

▪ **txUnixTime**: `number`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### allowanceType
>
> > **allowanceType**: `number` = `1`
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### created
>
> > **created**: `number` = `txUnixTime`
>
> ##### expires
>
> > **expires**: `number` = `0`
>
> ##### grantedBy
>
> > **grantedBy**: `string` = `users.testUser2Id`
>
> ##### grantedTo
>
> > **grantedTo**: `string` = `users.testUser1Id`
>
> ##### instance
>
> > **instance**: `BigNumber`
>
> ##### quantity
>
> > **quantity**: `BigNumber`
>
> ##### quantitySpent
>
> > **quantitySpent**: `BigNumber`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>
> ##### uses
>
> > **uses**: `BigNumber`
>
> ##### usesSpent
>
> > **usesSpent**: `BigNumber`
>

### tokenBalance

> **tokenBalance**: `CreateInstanceFn`\<`TokenBalance`\>

### tokenBalancePlain

> **tokenBalancePlain**: () => `object`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### inUseHolds
>
> > **inUseHolds**: `never`[] = `[]`
>
> ##### instanceIds
>
> > **instanceIds**: `BigNumber`[]
>
> ##### lockedHolds
>
> > **lockedHolds**: `never`[] = `[]`
>
> ##### owner
>
> > **owner**: `string` = `users.testUser1Id`
>
> ##### quantity
>
> > **quantity**: `BigNumber`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>

### tokenBurn

> **tokenBurn**: `CreateInstanceFn`\<`TokenBurn`\>

### tokenBurnCounterPlain

> **tokenBurnCounterPlain**: (`txUnixTime`, `timeKey`, `epoch`, `totalKnownBurnsCount`) => `object`

#### Parameters

▪ **txUnixTime**: `number`

▪ **timeKey**: `string`

▪ **epoch**: `string`

▪ **totalKnownBurnsCount**: `BigNumber`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### burnedBy
>
> > **burnedBy**: `string` = `users.testUser1Id`
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### created
>
> > **created**: `number` = `txUnixTime`
>
> ##### epoch
>
> > **epoch**: `string`
>
> ##### instance
>
> > **instance**: `BigNumber`
>
> ##### quantity
>
> > **quantity**: `BigNumber`
>
> ##### timeKey
>
> > **timeKey**: `string`
>
> ##### totalKnownBurnsCount
>
> > **totalKnownBurnsCount**: `BigNumber`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>

### tokenBurnPlain

> **tokenBurnPlain**: (`txUnixTime`) => `object`

#### Parameters

▪ **txUnixTime**: `number`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### burnedBy
>
> > **burnedBy**: `string` = `users.testUser1Id`
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### created
>
> > **created**: `number` = `txUnixTime`
>
> ##### instance
>
> > **instance**: `BigNumber`
>
> ##### quantity
>
> > **quantity**: `BigNumber`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>

### tokenClass

> **tokenClass**: `CreateInstanceFn`\<`TokenClass`\>

### tokenClassKey

> **tokenClassKey**: `CreateInstanceFn`\<`TokenClassKey`\>

### tokenClassKeyPlain

> **tokenClassKeyPlain**: () => `object`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>

### tokenClassPlain

> **tokenClassPlain**: () => `object`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### authorities
>
> > **authorities**: `string`[]
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### decimals
>
> > **decimals**: `number` = `0`
>
> ##### description
>
> > **description**: `string` = `"Generated via automated test suite."`
>
> ##### image
>
> > **image**: `string` = `"https://app.gala.games/test-image-placeholder-url.png"`
>
> ##### isNonFungible
>
> > **isNonFungible**: `boolean` = `true`
>
> ##### maxCapacity
>
> > **maxCapacity**: `BigNumber`
>
> ##### maxSupply
>
> > **maxSupply**: `BigNumber`
>
> ##### name
>
> > **name**: `string` = `"TestElixirNft"`
>
> ##### network
>
> > **network**: `string` = `GC_NETWORK_ID`
>
> ##### symbol
>
> > **symbol**: `string` = `"GALAXR"`
>
> ##### totalBurned
>
> > **totalBurned**: `BigNumber`
>
> ##### totalMintAllowance
>
> > **totalMintAllowance**: `BigNumber`
>
> ##### totalSupply
>
> > **totalSupply**: `BigNumber`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>

### tokenInstance1

> **tokenInstance1**: `CreateInstanceFn`\<`TokenInstance`\>

### tokenInstance1Key

> **tokenInstance1Key**: `CreateInstanceFn`\<`TokenInstanceKey`\>

### tokenInstance1KeyPlain

> **tokenInstance1KeyPlain**: () => `object`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### instance
>
> > **instance**: `BigNumber`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>

### tokenInstance1Plain

> **tokenInstance1Plain**: () => `object`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### instance
>
> > **instance**: `BigNumber`
>
> ##### isNonFungible
>
> > **isNonFungible**: `boolean` = `true`
>
> ##### owner
>
> > **owner**: `string` = `users.testUser1Id`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>

### tokenMintAllowance

> **tokenMintAllowance**: `CreateInstanceFn`\<`TokenAllowance`\>

### tokenMintAllowancePlain

> **tokenMintAllowancePlain**: (`txUnixTime`) => `object`

#### Parameters

▪ **txUnixTime**: `number`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `"Elixir"`
>
> ##### allowanceType
>
> > **allowanceType**: `number` = `4`
>
> ##### category
>
> > **category**: `string` = `"Item"`
>
> ##### collection
>
> > **collection**: `string` = `"TEST"`
>
> ##### created
>
> > **created**: `number` = `txUnixTime`
>
> ##### expires
>
> > **expires**: `number` = `0`
>
> ##### grantedBy
>
> > **grantedBy**: `string` = `users.testAdminId`
>
> ##### grantedTo
>
> > **grantedTo**: `string` = `users.testAdminId`
>
> ##### instance
>
> > **instance**: `BigNumber`
>
> ##### quantity
>
> > **quantity**: `BigNumber`
>
> ##### quantitySpent
>
> > **quantitySpent**: `BigNumber`
>
> ##### type
>
> > **type**: `string` = `"Potion"`
>
> ##### uses
>
> > **uses**: `BigNumber`
>
> ##### usesSpent
>
> > **usesSpent**: `BigNumber`
>

## Source

[chain-test/src/data/nft.ts:127](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/data/nft.ts#L127)
