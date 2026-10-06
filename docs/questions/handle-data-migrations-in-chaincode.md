### Question


How can I handle data migrations in chaincode?


### Answer


When modifying data structures in GalaChain chaincode, particularly classes that extend `ChainObject`, you have several strategies to handle existing on-chain data. Here's how to approach data migrations:

1. Backward Compatible Changes:
```typescript
import { ChainObject, ChainKey, IsOptional } from '@gala-chain/api';

// Original version
export class GameItem extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly itemId: string;

  public readonly name: string;
}

// Updated version with backward compatibility
export class GameItem extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly itemId: string;

  public readonly name: string;

  @IsOptional()  // Makes the new field optional
  public readonly rarity?: string;  // Won't break existing records

  public getRarity(): string {
    return this.rarity ?? 'common';  // Provide default for old records
  }
}
```

2. Data Migration Method:
```typescript
@Submit()
async function migrateGameItems(
  ctx: GalaChainContext,
  params: { batchSize: number }
): Promise<void> {
  let bookmark = '';
  
  do {
    // Get a batch of items
    const { results, metadata } = await getObjectsByPartialCompositeKeyWithPagination(
      ctx,
      GameItem.INDEX_KEY,
      [],  // Empty array to get all items
      GameItem,
      params.batchSize,
      bookmark
    );

    // Update each item
    for (const item of results) {
      const updatedItem = new GameItem({
        ...item,
        rarity: calculateRarityFromStats(item),  // Set new field
      });

      await putChainObject(ctx, updatedItem);
    }

    bookmark = metadata.bookmark;
  } while (bookmark);
}
```

3. Schema Version Tracking:
```typescript
export class GameItem extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly itemId: string;

  public readonly schemaVersion: number = 2;  // Track version

  public readonly name: string;
  public readonly rarity: string;

  public static fromLegacy(old: any): GameItem {
    if (!old.schemaVersion || old.schemaVersion === 1) {
      return new GameItem({
        ...old,
        rarity: 'common',  // Default value for legacy data
        schemaVersion: 2
      });
    }
    return old as GameItem;
  }
}

// Use in queries
async function getItem(ctx: GalaChainContext, itemId: string): Promise<GameItem> {
  const item = await getObjectByKey(
    ctx,
    GameItem,
    ChainObject.getCompositeKeyFromParts(GameItem.INDEX_KEY, [itemId])
  );
  return GameItem.fromLegacy(item);
}
```

Best Practices:
- Always make new fields optional when possible
- Provide default values for backward compatibility
- Consider implementing migration methods for large-scale updates
- Test migrations thoroughly in development environment
- Document data model changes and migration procedures

Key Points:
- Use `@IsOptional()` for new fields to maintain compatibility
- Implement migration methods for non-compatible changes
- Consider batching for large-scale migrations
- Track schema versions to handle multiple migrations
- Always validate migrated data before saving

Migration Strategy Checklist:
1. Assess impact of data model changes
2. Choose appropriate migration strategy
3. Implement and test migration code
4. Plan migration execution timing
5. Monitor migration progress and validate results