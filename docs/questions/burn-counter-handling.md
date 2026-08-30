### Question

How do I handle burn counters in GalaChain?

### Answer

GalaChain automatically manages burn counters through the `TokenBurnCounter` system. Here's how to work with burn counters:

#### 1. Understanding TokenBurnCounter

The `TokenBurnCounter` is a ranged chain object that tracks burn quantities for tokens. It includes:
- Token instance properties (collection, category, type, additionalKey)
- Burn metadata (burnedBy, timeKey, quantity)
- Total known burns count

#### 2. Automatic Counter Management

When using the `burnTokens` function, GalaChain automatically:
1. Creates or updates the `TokenBurnCounter` for each burn operation
2. Maintains the total known burns count
3. Ensures transaction atomicity

```typescript
// Example burn operation - counters are handled automatically
const dto = await createValidSubmitDTO(BurnTokensDto, {
  tokenInstances: [{ tokenInstanceKey, quantity: burnQty }]
}).signed(privateKey);

const response = await contract.BurnTokens(ctx, dto);
```

#### 3. Querying Burn Counts

To fetch the total known burn count for a token:

```typescript
const params: FetchBurnCounterParams = {
  collection: "my-collection",
  category: "currency",
  type: "gold",
  additionalKey: "season1"
};

const totalBurns = await fetchKnownBurnCount(ctx, params);
```

#### 4. Counter Properties

Each `TokenBurnCounter` includes:
- `quantity`: The amount burned in this specific counter
- `totalKnownBurnsCount`: Running total of all burns for this token
- `referenceId`: Unique identifier for the burn counter
- `timeKey`: Timestamp-based key for ordering

#### Key Points

1. **Automatic Updates**:
   - Counters are automatically created and updated
   - No manual counter management is needed
   - Updates are atomic with burn operations

2. **Time-Based Tracking**:
   - Counters use time-based keys for ordering
   - Historical burn data is preserved
   - Queries can be filtered by time periods

3. **Deterministic Behavior**:
   - Counter updates follow GalaChain's deterministic execution model
   - Sequential processing ensures consistency
   - Atomic updates prevent race conditions

4. **Query Considerations**:
   - Use specific parameters to limit query scope
   - Consider pagination for large result sets
   - Filter by time periods when needed

Remember that burn counters are managed automatically by the SDK - there's no need to manually create or update them when performing burn operations.