**@gala-chain/test** ∙ [API](../exports.md)

***

[API](../exports.md) > currency

# Variable: currency

> **currency**: `object`

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
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### allowanceType
>
> > **allowanceType**: `number` = `4`
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
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
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
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
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
>
> ##### inUseHolds
>
> > **inUseHolds**: `never`[] = `[]`
>
> ##### instanceIds
>
> > **instanceIds**: `never`[] = `[]`
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
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
>

### tokenBurn

> **tokenBurn**: `CreateInstanceFn`\<`TokenBurn`\>

### tokenBurnAllowance

> **tokenBurnAllowance**: `CreateInstanceFn`\<`TokenAllowance`\>

### tokenBurnAllowancePlain

> **tokenBurnAllowancePlain**: (`txUnixTime`) => `object`

#### Parameters

▪ **txUnixTime**: `number`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### allowanceType
>
> > **allowanceType**: `number` = `6`
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
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
> > **grantedBy**: `string` = `users.testUser1Id`
>
> ##### grantedTo
>
> > **grantedTo**: `string` = `users.testUser2Id`
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
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
>
> ##### uses
>
> > **uses**: `BigNumber`
>
> ##### usesSpent
>
> > **usesSpent**: `BigNumber`
>

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
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### burnedBy
>
> > **burnedBy**: `string` = `users.testUser1Id`
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
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
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
>

### tokenBurnPlain

> **tokenBurnPlain**: (`txUnixTime`) => `object`

#### Parameters

▪ **txUnixTime**: `number`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### burnedBy
>
> > **burnedBy**: `string` = `users.testUser1Id`
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
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
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
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
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
>
> ##### type
>
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
>

### tokenClassPlain

> **tokenClassPlain**: () => `object` = `tokenClassPlain`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### authorities
>
> > **authorities**: `string`[]
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
>
> ##### decimals
>
> > **decimals**: `number` = `10`
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
> > **isNonFungible**: `boolean` = `false`
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
> > **name**: `string` = `"AUTOMATEDTESTCOIN"`
>
> ##### network
>
> > **network**: `string` = `GC_NETWORK_ID`
>
> ##### symbol
>
> > **symbol**: `string` = `"AUTC"`
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
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
>

### tokenInstance

> **tokenInstance**: `CreateInstanceFn`\<`TokenInstance`\>

### tokenInstanceKey

> **tokenInstanceKey**: `CreateInstanceFn`\<`TokenInstanceKey`\>

### tokenInstanceKeyPlain

> **tokenInstanceKeyPlain**: () => `object`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
>
> ##### instance
>
> > **instance**: `BigNumber`
>
> ##### type
>
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
>

### tokenInstancePlain

> **tokenInstancePlain**: () => `object`

#### Returns

> ##### additionalKey
>
> > **additionalKey**: `string` = `process.env.GALA_TOKEN_CLASS_ADDITIONAL_KEY`
>
> ##### category
>
> > **category**: `string` = `process.env.GALA_TOKEN_CLASS_CATEGORY`
>
> ##### collection
>
> > **collection**: `string` = `process.env.GALA_TOKEN_CLASS_COLLECTION`
>
> ##### instance
>
> > **instance**: `BigNumber`
>
> ##### isNonFungible
>
> > **isNonFungible**: `boolean` = `false`
>
> ##### type
>
> > **type**: `string` = `process.env.GALA_TOKEN_CLASS_TYPE`
>

## Source

[chain-test/src/data/currency.ts:125](https://github.com/GalaChain/sdk/blob/bcbbb18/chain-test/src/data/currency.ts#L125)
