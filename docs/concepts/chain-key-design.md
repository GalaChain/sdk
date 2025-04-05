# Chain Key Design

## Introduction to GalaChain Chain Keys

In GalaChain, the `@ChainKey` decorator is a powerful feature for defining structured composite keys that organize data in the underlying LevelDB key-value store. These composite keys enable efficient querying and data retrieval patterns within your blockchain application.

## What Are Chain Keys?

Chain Keys are ordered collections of property values that together form a unique composite key for storing state data. They leverage Hyperledger Fabric's native composite key capabilities but provide a structured, type-safe approach through GalaChain's decorators.

## Basic Usage

```typescript
import { ChainObject, ChainKey } from '@galachain/sdk';

export class PlayerInventoryItem extends ChainObject {
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

### 1. Order of Specificity

Chain keys must be arranged from least specific (broadest) to most specific:

```
General → Specific → More Specific → Most Specific
```

**Good Example:**
```typescript
@ChainKey({ position: 1 }) public seasonId: string;    // More specific
@ChainKey({ position: 2 }) public playerId: string;    // Even more specific
@ChainKey({ position: 3 }) public assetId: string;     // Most specific
```

**Poor Example:**
```typescript
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
  @ChainKey({ position: 1 }) public year: number;
  @ChainKey({ position: 2 }) public month: number;
  @ChainKey({ position: 3 }) public day: number;
  @ChainKey({ position: 4 }) public eventId: string;
  
  // Event data
  public data: any;
}

// Query all login events from October 2023
const octoberLogins = await ctx.store.query(GameEvent, {
  eventType: 'login',
  year: 2023,
  month: 10
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
   
   
2. **Assigning Mutable properties as Chain Key Values**: Avoid using properties that change as chain keys. Changing a chain key would effectively represent a new entity.

4. **Using Non-Deterministic Values**: Timestamps or random values make poor chain keys. However, placing values like these at the end of a sequence of chain keys can be a useful strategy to ensure data integrity and prevent collisions.

## Performance Considerations

- **Query Patterns**: Design keys based on your most common query patterns
- **Key Length**: Keep key component values reasonably short
- **Key Distribution**: Avoid keys that create "hot spots" in your data
- **Index Size**: Remember that each key combination creates entries in the state database

## Conclusion

Effective `@ChainKey` design is crucial for GalaChain application performance and usability. By following the principle of arranging keys from general to specific and understanding the query limitations, you can create efficient data structures that support your application's needs while maintaining optimal blockchain performance.

Remember that once you've deployed your data model, changing key structures typically requires data migration, so invest time in proper key design during your initial development phase.
