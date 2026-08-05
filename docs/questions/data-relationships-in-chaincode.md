### Question


What's the best way to handle data relationships in chaincode?


### Answer


GalaChain provides several patterns for managing relationships between data objects. Here's how to implement different types of relationships:

1. Reference by Key:
```typescript
export class GameItem extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly itemId: string;

  // Reference to owner
  @IsUserAlias()
  public readonly ownerId: string;

  // Reference to item class
  public readonly itemClassId: string;

  // Helper method to get owner
  public async getOwner(
    ctx: GalaChainContext
  ): Promise<UserProfile> {
    const key = ChainObject.getCompositeKeyFromParts(
      UserProfile.INDEX_KEY,
      [this.ownerId]
    );
    return getObjectByKey(ctx, UserProfile, key);
  }

  // Helper method to get item class
  public async getItemClass(
    ctx: GalaChainContext
  ): Promise<ItemClass> {
    const key = ChainObject.getCompositeKeyFromParts(
      ItemClass.INDEX_KEY,
      [this.itemClassId]
    );
    return getObjectByKey(ctx, ItemClass, key);
  }
}
```

2. Shared Key Structure:
```typescript
// Token class definition
export class TokenClass extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly collection: string;

  @ChainKey({ position: 1 })
  public readonly category: string;

  @ChainKey({ position: 2 })
  public readonly type: string;

  @ChainKey({ position: 3 })
  public readonly additionalKey: string;

  // Class-specific properties
  public readonly maxSupply: number;
  public readonly metadata: TokenMetadata;
}

// Token balance sharing same key structure
export class TokenBalance extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly collection: string;

  @ChainKey({ position: 1 })
  public readonly category: string;

  @ChainKey({ position: 2 })
  public readonly type: string;

  @ChainKey({ position: 3 })
  public readonly additionalKey: string;

  @ChainKey({ position: 4 })
  @IsUserAlias()
  public readonly owner: string;

  // Balance-specific properties
  public readonly balance: number;
}

// Query method using shared key structure
async function getTokenBalancesByClass(
  ctx: GalaChainContext,
  tokenClass: TokenClass
): Promise<TokenBalance[]> {
  return getObjectsByPartialCompositeKey(
    ctx,
    TokenBalance.INDEX_KEY,
    [
      tokenClass.collection,
      tokenClass.category,
      tokenClass.type,
      tokenClass.additionalKey
    ]
  );
}
```

3. One-to-Many Relationships:
```typescript
export class Inventory extends ChainObject {
  @ChainKey({ position: 0 })
  @IsUserAlias()
  public readonly userId: string;

  public readonly items: string[];  // Array of item IDs

  // Helper method to get all items
  public async getItems(
    ctx: GalaChainContext
  ): Promise<GameItem[]> {
    const items: GameItem[] = [];
    
    for (const itemId of this.items) {
      const key = ChainObject.getCompositeKeyFromParts(
        GameItem.INDEX_KEY,
        [itemId]
      );
      const item = await getObjectByKey(ctx, GameItem, key);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }
}
```

4. Many-to-Many Relationships:
```typescript
export class TeamMembership extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly teamId: string;

  @ChainKey({ position: 1 })
  @IsUserAlias()
  public readonly userId: string;

  public readonly role: string;
}

// Query team members
async function getTeamMembers(
  ctx: GalaChainContext,
  teamId: string
): Promise<TeamMembership[]> {
  return getObjectsByPartialCompositeKey(
    ctx,
    TeamMembership.INDEX_KEY,
    [teamId]
  );
}

// Query user's teams
async function getUserTeams(
  ctx: GalaChainContext,
  userId: string
): Promise<Team[]> {
  const memberships = await getObjectsByPartialCompositeKey(
    ctx,
    TeamMembership.INDEX_KEY,
    []
  );
  
  const userMemberships = memberships.filter(
    m => m.userId === userId
  );

  const teams: Team[] = [];
  for (const membership of userMemberships) {
    const team = await getObjectByKey(
      ctx,
      Team,
      ChainObject.getCompositeKeyFromParts(
        Team.INDEX_KEY,
        [membership.teamId]
      )
    );
    if (team) {
      teams.push(team);
    }
  }

  return teams;
}
```

Best Practices:
- Use consistent key structures for related objects
- Implement helper methods for relationship navigation
- Consider query performance when designing relationships
- Validate references before saving
- Document relationship patterns

Key Points:
- Objects can reference others via key properties
- Shared key structures enable efficient querying
- Helper methods simplify relationship traversal
- Consider denormalization for performance
- Maintain referential integrity

Design Considerations:
- Balance normalization vs query performance
- Plan for relationship changes
- Consider index impact
- Handle missing references
- Document relationship patterns