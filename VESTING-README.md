# Vesting Tokens

The vesting token feature allows for the creation of tokens with time-based vesting schedules. This enables scenarios like token distribution events where tokens are gradually unlocked over time according to predefined schedules.

## Key Concepts

### Vesting Schedule
- **Start Date**: The timestamp when the vesting period begins
- **Cliff Period**: An initial period (in days) during which no tokens vest
- **Vesting Days**: The number of days over which tokens will linearly vest after the cliff period
- **Vesting Name**: A identifier for the vesting schedule (e.g. "SuperTokenTGE")

### Allocations
Each vesting token can have multiple allocations, which specify:
- **Name**: Identifier for this specific allocation
- **Owner**: The wallet address receiving the allocation
- **Quantity**: Amount of tokens allocated
- **Cliff**: Number of days before vesting begins for this allocation
- **Vesting Days**: Number of days over which tokens vest after cliff period

## Creating a Vesting Token

To create a vesting token, you'll need to provide:

1. Token Class details (standard token parameters)
2. Vesting schedule parameters
3. Array of allocations

Example:

``` typescript
const vestingTokenDto = {
    tokenClass: {
        // Standard token parameters
        network: "GC",
        decimals: 8,
        maxSupply: new BigNumber(1000000000),
        // ... other token parameters
    },
    startDate: currentTimestamp + (60 * 1000), // starts in 1 minute
    vestingName: "SuperTokenTGE",
    allocations: [
        {
            name: "team",
            owner: "0x123...",
            quantity: new BigNumber(800000000),
            cliff: 90, // 90 day cliff
            vestingDays: 365 // vests over 1 year after cliff
        },
        {
            name: "advisors",
            owner: "0x456...",
            quantity: new BigNumber(200000000),
            cliff: 30, // 30 day cliff
            vestingDays: 180 // vests over 6 months after cliff
        }
    ]
}
```

## How Vesting Works

1. When a vesting token is created:
   - A new token class is created
   - Tokens are minted to allocation owners
   - Vesting locks are applied to the tokens

2. During the cliff period:
   - 100% of tokens remain locked
   - No tokens can be transferred

3. During the vesting period:
   - Tokens gradually unlock linearly over the vesting days
   - The daily unlocked amount is: `tokensPerDay = totalTokens / vestingDays`
   - Unlocked tokens become transferable, burnable, etc.

4. After vesting completes:
   - All tokens become fully unlocked (lock expires)
   - Tokens can be freely transferred, burned, etc.

## Querying Vesting Status

You can fetch vesting token information using the `FetchVestingTokens` method, which returns:
- The vesting token configuration
- Current balance and lock status for each allocation

## Important Notes

1. The sum of all allocation quantities must exactly match the token's max supply

2. Each allocation can have its own cliff and vesting schedule

3. Vesting is enforced through token locks that:
   - Cannot be removed except through the vesting schedule
   - Are automatically calculated based on the current time
   - Linear vesting is calculated using: `unlockedAmount = (timeSinceStart / totalVestingTime) * totalTokens`

4. Once created, vesting schedules cannot be modified

## Example Vesting Scenarios

### Immediate Release with No Vesting

``` typescript
{
    name: "immediate",
    owner: "0x789...",
    quantity: new BigNumber(100),
    cliff: 0,
    vestingDays: 0
}
```

### 3 Month Cliff + 1 Year Vesting

``` typescript
{
    name: "standard",
    owner: "0x789...",
    quantity: new BigNumber(100),
    cliff: 90, // 90 days
    vestingDays: 365
}
```
### 1 Week Cliff + 1 Month Vesting

``` typescript
{
    name: "short",
    owner: "0x789...",
    quantity: new BigNumber(100),
    cliff: 7, // 7 days
    vestingDays: 30
}
```
