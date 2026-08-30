### Question


What's the proper way to handle data deletion in chaincode?


### Answer


In GalaChain, data deletion should be handled carefully since blockchain is an append-only ledger. Here's how to properly handle data deletion:

1. Using `deleteChainObject`:
```typescript
@Submit()
async function deleteGameItem(
  ctx: GalaChainContext,
  params: { itemId: string }
): Promise<void> {
  // First, verify the item exists
  const key = ChainObject.getCompositeKeyFromParts(
    GameItem.INDEX_KEY,
    [params.itemId]
  );
  const item = await getObjectByKey(ctx, GameItem, key);
  
  if (!item) {
    throw new Error('Item not found');
  }

  // Delete the item
  await deleteChainObject(ctx, item);
}
```

2. Implementing Soft Deletion:
```typescript
export class GameItem extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly itemId: string;

  public readonly name: string;
  public readonly deleted: boolean;

  // Helper method for soft deletion
  public markDeleted(): GameItem {
    return new GameItem({
      ...this,
      deleted: true
    });
  }
}

@Submit()
async function softDeleteItem(
  ctx: GalaChainContext,
  params: { itemId: string }
): Promise<void> {
  const key = ChainObject.getCompositeKeyFromParts(
    GameItem.INDEX_KEY,
    [params.itemId]
  );
  const item = await getObjectByKey(ctx, GameItem, key);

  if (!item) {
    throw new Error('Item not found');
  }

  // Mark as deleted and update
  const deletedItem = item.markDeleted();
  await putChainObject(ctx, deletedItem);
}

// Query that excludes deleted items
async function getActiveItems(
  ctx: GalaChainContext
): Promise<GameItem[]> {
  const items = await getObjectsByPartialCompositeKey(
    ctx,
    GameItem.INDEX_KEY,
    []
  );
  return items.filter(item => !item.deleted);
}
```

3. Handling Related Data:
```typescript
@Submit()
async function deleteItemWithRelations(
  ctx: GalaChainContext,
  params: { itemId: string }
): Promise<void> {
  // Delete main item
  const item = await getObjectByKey(
    ctx,
    GameItem,
    ChainObject.getCompositeKeyFromParts(GameItem.INDEX_KEY, [params.itemId])
  );

  if (!item) {
    throw new Error('Item not found');
  }

  // Delete related metadata
  const metadata = await getObjectByKey(
    ctx,
    ItemMetadata,
    ChainObject.getCompositeKeyFromParts(ItemMetadata.INDEX_KEY, [params.itemId])
  );

  if (metadata) {
    await deleteChainObject(ctx, metadata);
  }

  // Delete the main item last
  await deleteChainObject(ctx, item);
}
```

Best Practices:
- Consider soft deletion for data that might need to be referenced
- Always verify object existence before deletion
- Handle related data deletion in a consistent order
- Document deletion policies and procedures
- Implement access control for deletion operations

Key Points:
- Use `deleteChainObject` for permanent removal
- Implement soft deletion when history is important
- Handle cascading deletes carefully
- Consider implementing recovery mechanisms
- Remember that blockchain history remains

Security Considerations:
- Validate permissions before deletion
- Log deletion operations for audit
- Consider impact on related data
- Implement proper error handling
- Test deletion scenarios thoroughly