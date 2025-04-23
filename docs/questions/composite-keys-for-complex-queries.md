### Question


How can I use composite keys for complex queries in chaincode?


### Answer


Composite keys in GalaChain enable efficient querying by combining multiple fields into a single key. Here's how to use them effectively:

1. Design your composite key structure:
```typescript
export class TokenBalance extends ChainObject {
  @Exclude()
  public static readonly INDEX_KEY = 'GCTB';

  @ChainKey({ position: 0 })
  @IsUserAlias()
  public readonly owner: UserAlias;  // Primary query field

  @ChainKey({ position: 1 })
  @IsString()
  public readonly tokenClass: string;  // Secondary query field

  @ChainKey({ position: 2 })
  @IsString()
  public readonly tokenInstance: string;  // Tertiary query field

  @Min(0)
  public readonly quantity: BigNumber;
}
```

2. Query using partial composite keys for flexible filtering:
```typescript
// Query all balances for an owner
async function getOwnerBalances(
  ctx: GalaChainContext,
  owner: UserAlias
): Promise<TokenBalance[]> {
  return getObjectsByPartialCompositeKey(
    ctx,
    TokenBalance.INDEX_KEY,
    [owner]  // Just the first key part
  );
}

// Query balances for specific token class
async function getOwnerTokenClassBalances(
  ctx: GalaChainContext,
  owner: UserAlias,
  tokenClass: string
): Promise<TokenBalance[]> {
  return getObjectsByPartialCompositeKey(
    ctx,
    TokenBalance.INDEX_KEY,
    [owner, tokenClass]  // First two key parts
  );
}

// Query specific token instance balance
async function getSpecificBalance(
  ctx: GalaChainContext,
  owner: UserAlias,
  tokenClass: string,
  tokenInstance: string
): Promise<TokenBalance[]> {
  return getObjectsByPartialCompositeKey(
    ctx,
    TokenBalance.INDEX_KEY,
    [owner, tokenClass, tokenInstance]  // All key parts
  );
}
```

3. Create composite keys manually when needed:
```typescript
// Create a complete composite key
const completeKey = ChainObject.getCompositeKeyFromParts(
  TokenBalance.INDEX_KEY,
  [owner, tokenClass, tokenInstance]
);

// Use for direct lookups
const balance = await getObjectByKey(ctx, TokenBalance, completeKey);
```

Key concepts:
- Order matters: Chain keys must be queried in order (can't skip positions)
- Progressive filtering: Add more key parts for more specific queries
- Performance: Composite keys enable fast range queries and prefix scans
- Uniqueness: Complete composite keys must be unique within a class

Best practices:
- Order chain keys from most to least frequently queried
- Use meaningful key parts that support your query patterns
- Keep key parts short to minimize storage overhead
- Consider index size impact when designing composite keys
- Document the composite key structure in class comments