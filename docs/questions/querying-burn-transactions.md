### Question

How can I query burn transactions in GalaChain?

### Answer

GalaChain provides built-in functionality to query burn transactions through the `fetchBurns` function. This allows you to retrieve `TokenBurn` entries from the chain's World State using various filtering parameters.

#### Basic Usage

```typescript
import { FetchBurnsDto, TokenBurn } from '@gala-chain/api';

// Create a fetch burns request
const dto = await createValidDTO(FetchBurnsDto, {
  burnedBy: 'user123' // Required: the identity key of the user who performed the burns
}).signed(privateKey);

// Query burns through the contract
const response = await contract.FetchBurns(ctx, dto);
```

#### Filtering Options

You can filter burn transactions using these parameters:

- `burnedBy` (required): Identity key of the user who performed the burn
- `collection`: Filter by token collection
- `category`: Filter by token category
- `type`: Filter by token type
- `additionalKey`: Filter by additional key
- `instance`: Filter by specific token instance
- `created`: Filter by creation timestamp

#### Example with Filters

```typescript
const dto = await createValidDTO(FetchBurnsDto, {
  burnedBy: 'user123',
  collection: 'MyCollection',
  category: 'Items',
  type: 'Weapon'
}).signed(privateKey);
```

#### Important Notes

1. Results are sorted by ascending creation date (oldest first)
2. The query uses the `TokenBurn` class's `@ChainKeys` for filtering, which are ordered and cannot be skipped
3. Broad queries with many results could exceed the configured maximum and throw an error
4. Use more specific filters to limit the result set for better performance

#### Example Response

```typescript
// Successful response will contain an array of TokenBurn objects
GalaChainResponse.Success([
  {
    burnedBy: 'user123',
    collection: 'MyCollection',
    category: 'Items',
    type: 'Weapon',
    instance: '1',
    created: 1234567890,
    quantity: new BigNumber('1')
  },
  // ... more burn records
]);
```

For tracking total burns over time, you can also use the `TokenBurnCounter` class which maintains aggregated burn statistics. The burn counters are automatically updated when tokens are burned using the SDK's `burnTokens` function.