# Create, Read, Update, Delete

GalaChain provides a set of utility functions that build on Hyperledger Fabric's state management to provide an improved developer experience. These functions handle validation, serialization, and caching to ensure atomicity guarantees for each transaction.

## Core Operations

### Creating and Updating Objects

The `putChainObject` function handles both creation and updates of chain objects. It validates the object, serializes it, and queues it for writing to the World State.

```typescript
// Define a chain object
class GameMove extends ChainObject {
  @ChainKey(0)
  gameId: string;

  @ChainKey(1)
  moveNumber: number;

  piece: string;
  from: string;
  to: string;
  player: string;
}

// Create and store a new move
const move = new GameMove({
  gameId: "game_123",
  moveNumber: 1,
  piece: "P",
  from: "e2",
  to: "e4",
  player: "white"
});

await putChainObject(ctx, move);
```

### Reading Objects

#### Single Object Lookup

Use `getObjectByKey` to fetch a specific object using its composite key:

```typescript
// Fetch a specific move
const moveKey = GameMove.getCompositeKeyFromParts(GameMove.INDEX_KEY, ["game_123", 1]);
const move = await getObjectByKey(ctx, GameMove, moveKey);
console.log(move.piece, move.from, move.to); // "P" "e2" "e4"
```

#### Query Multiple Objects

Use `getObjectsByPartialCompositeKey` to query objects using partial keys:

```typescript
// Get all moves for a specific game
const moves = await getObjectsByPartialCompositeKey(
  ctx,
  "GameMove",
  ["game_123"],
  GameMove
);

// For large result sets, use pagination
const { results: paginatedMoves, metadata } = await getObjectsByPartialCompositeKeyWithPagination(
  ctx,
  "GameMove",
  ["game_123"],
  GameMove,
  undefined, // bookmark
  10 // limit
);
```

### Deleting Objects

Use `deleteChainObject` to remove an object from the World State:

```typescript
// Delete a specific move
const moveKey = GameMove.getCompositeKeyFromParts(GameMove.INDEX_KEY, ["game_123", 1]);
await deleteChainObject(ctx, moveKey);
```

## The GalaChainStubCache

GalaChain implements a transactional cache through the `GalaChainStub` class. This cache ensures:

1. **Read Consistency**: Once an object is read within a transaction, subsequent reads return the same value unless explicitly modified.

2. **Write Atomicity**: All changes are queued and only written to the World State when the transaction successfully completes.

3. **Performance**: Frequently accessed objects are cached to reduce ledger reads.

Example of how the cache works:

```typescript
// First read fetches from World State
const move1 = await getObjectByKey(ctx, GameMove, GameMove.getCompositeKeyFromParts(GameMove.INDEX_KEY, ["game_123", 1]));

// Second read uses cached value
const move2 = await getObjectByKey(ctx, GameMove, GameMove.getCompositeKeyFromParts(GameMove.INDEX_KEY, ["game_123", 1]));

// Modify the move
move1.piece = "N";
await putChainObject(ctx, move1);

// Subsequent reads will see the modified value
const move3 = await getObjectByKey(ctx, GameMove, GameMove.getCompositeKeyFromParts(GameMove.INDEX_KEY, ["game_123", 1]));
console.log(move3.piece); // "N"

// Changes are only written to World State when the transaction commits
// If the transaction fails, no changes are persisted
```

## Best Practices

1. **Use Composite Keys**: Structure your composite keys to support efficient querying patterns.

2. **Pagination for Large Results**: Always use the paginated version of queries when dealing with potentially large result sets.

3. **Validation**: Implement proper validation in your chain objects using class-validator decorators.

4. **Error Handling**: Handle potential errors like `ObjectNotFoundError` and `ValidationFailedError`.

5. **Atomic Operations**: Take advantage of the transactional nature of the cache to ensure data consistency.
