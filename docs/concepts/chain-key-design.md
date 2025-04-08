# Chain Key Design

## Introduction to GalaChain Chain Keys

In GalaChain, the `@ChainKey` decorator is a powerful feature for defining structured composite keys that organize data in the underlying LevelDB key-value store. These composite keys enable efficient querying and data retrieval patterns within your blockchain application.

## What Are Chain Keys?

Chain Keys are ordered collections of property values that together form a unique composite key for storing state data. They leverage Hyperledger Fabric's native composite key capabilities but provide a structured, type-safe approach through GalaChain's decorators.

## Basic Usage

```typescript
import { ChainObject, ChainKey } from '@galachain/sdk';

export class PlayerInventoryItem extends ChainObject {
  public static INDEX_KEY = "EGPII"; // e.g. PII
  
  @ChainKey({ position: 0 }) // The broadest category (always start with 0)
  public playerType: string;
  
  @ChainKey({ position: 1 }) // Second level of specificity
  public playerId: string;
  
  @ChainKey({ position: 2 }) // Third level of specificity
  public itemCategory: string;
  
  @ChainKey({ position: 3 }) // Most specific identifier
  public itemId: string;
  
  // Non-key properties
  public quantity: number;
  public lastUpdated: number;
}
```

## Key Design Principles

### 0. Index Keys defined on Classes group ledger entries (rows) by Class

The `INDEX_KEY` should be defined on each class that extends `ChainObject`. Each 
class **must** have a unique key that differentiates it from other classes. 

This key will 
prefix the composite key of all instances of a given class and ensure they are arranged in 
an adjacent keyspace within the World State Ledger index, facilitating range queries. 

Convention prefixes `INDEX_KEY` values in the GalaChain SDK with "GC" for "GalaChain", generally followed by 2-4 additional capital letters based on the TypeScript class name. 

For custom packages, chaincode, and smart contracts consider prefixing all your `INDEX_KEY` strings with a specific prefix based on your project, and following a similar convention to keep index keys unique. 

### 1. Order of Specificity

Chain keys must be arranged from least specific (broadest) to most specific:

```
General → Specific → More Specific → Most Specific
```

**Good Example:**
```typescript
INDEX_KEY = "EGABC";
@ChainKey({ position: 1 }) public seasonId: string;    // More specific
@ChainKey({ position: 2 }) public playerId: string;    // Even more specific
@ChainKey({ position: 3 }) public assetId: string;     // Most specific
```

**Poor Example:**
```typescript
INDEX_KEY = "a";
// Don't do this - ordering from specific to general
@ChainKey({ position: 0 }) public assetId: string;     // Too specific first
@ChainKey({ position: 1 }) public playerId: string;
@ChainKey({ position: 2 }) public seasonId: string;
@ChainKey({ position: 3 }) public gameId: string;      // Too general last
```

### 2. Query Progression

Partial key queries must follow the established order. You cannot skip keys in the sequence.

```typescript
import { getObjectsByPartialCompositeKey } from "gala-chain/chaincode";

// This works - querying by gameId only
const gameItems = await getObjectsByPartialCompositeKey(
  ctx,
  GameItem.INDEX_KEY,
  ["game123"],
  GameItem
);

// This works - querying by gameId and seasonId
const seasonItems = await getObjectsByPartialCompositeKey(
  ctx,
  GameItem.INDEX_KEY,
  ["game123", "season456"],
  GameItem
);

// This works - querying by gameId and seasonId
const playerSeasonItems = await getObjectsByPartialCompositeKey(
  ctx,
  GameItem.INDEX_KEY,
  ["game123", "season456"],
  GameItem
);

// This works - querying by gameId, seasonId, playerId, and itemId
const playerItemSeasonItems = await getObjectsByPartialCompositeKey(
  ctx,
  GameItem.INDEX_KEY,
  ["game123", "season456", "player789", "item987"],
  GameItem
);

// This works - querying by gameId, seasonId, playerId, itemId, and timestamp
const playerItemSeasonTimestampItems = await getObjectsByPartialCompositeKey(
  ctx,
  GameItem.INDEX_KEY,
  ["game123", "season456", "player789", "item987", "timestamp123"],
  GameItem
);

For organizing collections of related objects:

```typescript
export class UserAsset extends ChainObject {
  @ChainKey({ position: 0 }) public collection: string = 'user-assets';
  @ChainKey({ position: 1 }) public userId: string;
  @ChainKey({ position: 2 }) public assetId: string;
  
  // Asset properties
  public quantity: number;
}

// Usage:
const allUserAssets = await ctx.store.query(UserAsset, { 
  collection: 'user-assets' 
});
const userAssets = await ctx.store.query(UserAsset, { 
  collection: 'user-assets', 
  userId: 'user123' 
});
```

### Time-Based Organization

For time-series data or events:

```typescript
export class GameEvent extends ChainObject {
  @ChainKey({ position: 0 }) public eventType: string;
  @IsString()
  @Length(4)
  @ChainKey({ position: 1 }) public year: string;
  @IsString()
  @Length(2)
  @ChainKey({ position: 2 }) public month: string;
  @IsString()
  @Length(2)
  @ChainKey({ position: 3 }) public day: string;
  @ChainKey({ position: 4 }) public eventId: string;
  
  // Event data
  public data: any;
}
```

Chain keys are always serialized to a string when generating composite keys, 
so when working with numeric fields like dates, expect a string of a specific 
length related to the number of digits you require. To support lexigraphic sorting, 
be sure to pad the start of the value with "0". 

```typescript
// Query all login events from October 2023
const octoberLogins = await ctx.store.query(GameEvent, {
  eventType: 'login',
  year: '2023',
  month: '10'
});
```

### Hierarchical Data

For parent-child relationships:

```typescript
export class NestedItem extends ChainObject {
  @ChainKey({ position: 0 }) public readonly rootType: string;
  @ChainKey({ position: 1 }) public readonly parentId: string | null;
  @ChainKey({ position: 2 }) public readonly itemId: string;
  
  // Item data
  public name: string;
  public data: any;
}

// Query all top-level items (no parent)
const rootItems = await ctx.store.query(NestedItem, {
  rootType: 'folder',
  parentId: null
});

// Query all children of a specific parent
const childItems = await ctx.store.query(NestedItem, {
  rootType: 'folder',
  parentId: 'parent123'
});
```

## Common Pitfalls to Avoid

1. **Skipping Key Indexes**: Always use sequential numbers starting with 0.
   ```typescript
   // Incorrect
   @ChainKey({position: 0}) public readonly type: string;
   @ChainKey({position: 2}) public readonly id: string; // Gap will cause issues
   
   // Correct
   @ChainKey({position: 0}) public readonly type: string;
   @ChainKey({position: 1}) public readonly id: string;
   ```
   
   
2. **Assigning Mutable properties as Chain Key Values**: Avoid using properties that change as chain keys. Changing a chain key would effectively represent a new entity. If you need to change one of the key properties of a given entry in the ledger, be sure to delete the old object.

3. **Ensure uniqueness, avoid accidental key collisions**: The `putChainObject` can overwrite existing objects when a key already exists. Ensuring uniqueness of individual entries of a 
class can be aided by assigning a timestamp or transaction id as the final ChainKey value. Be sure not to use `Date.now()`, as this value can vary across peers and chaincode simulations. Use `ctx.txUnixTime` or `ctx.stub.getTxID()` which guarantee the same value across peers. 

4. **Using Non-Deterministic Values**: To emphasize the previous point: Chaincode execution **must** be deterministic and arrive at the same outcome across multiple simulations on disparate peers. Timestamps generated based on a peer's clock (e.g. Date.now()) or random values are not supported in chaincode execution and attempting to generate them during chaincode exeuction will lead to conflicting results and failed transactions. To introduce a non-deterministic value into chaincode execution, a trusted oracle should be used to generate randomness in a cryptographically secure manner, and that input would need to be provided as a trusted (signed) value alongside other transaction inputs. This topic is outside the scope of the current document on chain key design. 

## Performance Considerations

- **Query Patterns**: Design keys based on your most common query patterns
- **Key Length**: Keep key component values reasonably short
- **Key Distribution**: Avoid keys that create "hot spots" in your data
- **Index Size**: Remember that each key combination creates entries in the state database

## Conclusion

Effective `@ChainKey` design is crucial for GalaChain application performance and usability. By following the principle of arranging keys from general to specific and understanding the query limitations, you can create efficient data structures that support your application's needs while maintaining optimal blockchain performance.

Remember that once you've deployed your data model, changing key structures typically requires data migration, so invest time in proper key design during your initial development phase.
