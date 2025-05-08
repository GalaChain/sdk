### Question


How do I implement data versioning in chaincode?


### Answer


Data versioning in GalaChain leverages Hyperledger Fabric's built-in versioning capabilities while providing additional patterns for version management. Here's how to work with versioned data:

1. Using Schema Versions:
```typescript
export class GameAsset extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly assetId: string;

  public readonly schemaVersion: number = 2;

  // Version 1 fields
  public readonly name: string;
  public readonly type: string;

  // Version 2 fields
  @IsOptional()
  public readonly attributes?: AssetAttributes;

  // Version handling
  public static fromPreviousVersion(old: any): GameAsset {
    if (!old.schemaVersion || old.schemaVersion === 1) {
      return new GameAsset({
        ...old,
        schemaVersion: 2,
        attributes: {
          // Map old fields to new structure
          level: 1,
          rarity: 'common'
        }
      });
    }
    return old as GameAsset;
  }
}
```

2. Accessing Version History:
```typescript
@Query()
async function getAssetHistory(
  ctx: GalaChainContext,
  params: { assetId: string }
): Promise<any[]> {
  const key = ChainObject.getCompositeKeyFromParts(
    GameAsset.INDEX_KEY,
    [params.assetId]
  );
  
  // Access Fabric's history functionality
  const iterator = await ctx.stub.getHistoryForKey(key);
  const results = [];
  
  try {
    let result = await iterator.next();
    while (!result.done) {
      const { timestamp, value } = result.value;
      if (value) {
        const historicalData = JSON.parse(value.toString());
        results.push({
          timestamp,
          value: historicalData
        });
      }
      result = await iterator.next();
    }
  } finally {
    await iterator.close();
  }
  
  return results;
}
```

3. Version-Aware Updates:
```typescript
@Submit()
async function updateAsset(
  ctx: GalaChainContext,
  params: { assetId: string, updates: Partial<GameAsset> }
): Promise<GameAsset> {
  const key = ChainObject.getCompositeKeyFromParts(
    GameAsset.INDEX_KEY,
    [params.assetId]
  );
  
  const currentAsset = await getObjectByKey(ctx, GameAsset, key);
  if (!currentAsset) {
    throw new Error('Asset not found');
  }

  // Handle version differences
  const baseAsset = GameAsset.fromPreviousVersion(currentAsset);
  
  // Apply updates
  const updatedAsset = new GameAsset({
    ...baseAsset,
    ...params.updates,
    schemaVersion: 2  // Ensure latest version
  });

  await putChainObject(ctx, updatedAsset);
  return updatedAsset;
}
```

Best Practices:
- Track schema versions explicitly
- Provide migration paths between versions
- Handle version differences in queries
- Document version changes
- Test version compatibility

Key Points:
- Hyperledger Fabric maintains transaction history
- Use schemaVersion for data structure changes
- Implement version migration methods
- Access history through Fabric's APIs
- Consider version compatibility in updates

Version Management Tips:
- Keep version changes backward compatible when possible
- Implement clear upgrade paths
- Test version migrations thoroughly
- Document version differences
- Monitor version distribution in production