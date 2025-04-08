# Facts, Not Objects

When modeling data structures on GalaChain, it's important to adopt a specific mindset. This mindset prioritizes modeling chain entries as facts about digital objects rather than entire objects as single entries. This fundamental principle shapes how we structure and manage data on the blockchain.

For background on this approach in blockchain systems, see the [Hyperledger Fabric documentation on Ledgers, Facts, and States](https://hyperledger-fabric.readthedocs.io/en/release-2.5/ledger/ledger.html#ledgers-facts-and-states).

## Understanding Facts

A fact is an immutable record of something that happened. The current state of any asset can be determined by examining its related facts, as stored in the World State in the Ledger.

### Flexible Data Modeling

Rather than all aspects of an object being written to a single entry, specific facts about this object might be spread across several entries. This approach differs from other options in key ways:

- **Document Stores**: In MongoDB, you might store a large, complex nested structure as a single document
- **Relational DBs**: Traditional SQL databases often normalize data across many related tables
- **GalaChain**: Facts can be organized flexibly - either consolidated or distributed - based on your use case, query requirements, and data model.

Consider a digital representation of a chess games, and the moves of the two players:

### ❌ Monolithic Object Storage (Not Recommended)

```json
{
  "id": "game_123",
  "white": "player_456",
  "black": "player_789",
  "metadata": {
    "event": "World Chess Championship",
    "round": 1,
    "attributes": {
      "timeControl": "90min + 30sec",
      "location": "London",
      "started": "2025-04-01T10:00:00Z"
    }
  },
  "history": {
    "started": "2025-04-01T10:00:00Z",
    "moves": [
      {
        "moveNumber": 1,
        "piece": "P",
        "from": "e2",
        "to": "e4",
        "player": "white",
        "timestamp": "2025-04-01T10:05:00Z"
      },
      {
        "moveNumber": 1,
        "piece": "P",
        "from": "e7",
        "to": "e5",
        "player": "black",
        "timestamp": "2025-04-01T10:07:00Z"
      },
      {
        "moveNumber": 2,
        "piece": "N",
        "from": "g1",
        "to": "f3",
        "player": "white",
        "timestamp": "2025-04-01T10:10:00Z"
      },
      {
        "moveNumber": 2,
        "piece": "N",
        "from": "b8",
        "to": "c6",
        "player": "black",
        "timestamp": "2025-04-01T10:12:00Z"
      },
      {
        "moveNumber": 3,
        "piece": "B",
        "from": "f1",
        "to": "c4",
        "player": "white",
        "timestamp": "2025-04-01T10:15:00Z"
      }
    ]
  },
  "lastModified": "2025-04-01T10:15:00Z"
}
```

In the above example, it might be tempting to simply store all the moves in a single object, but this approach has several drawbacks. By storing each move as a separate fact, we can take advantage of the flexibility of the fact-based model. For example, we can easily query for all moves made by a particular player, or all moves made in a particular position. Additionally, we can easily add new moves to the game without having to modify the existing data structure.

### ✅ Distributed Facts (Recommended)

```json
[
  {
    "type": "ChessMove",
    "gameId": "game_123",
    "timestamp": "2025-04-01T10:05:00Z",
    "moveNumber": 1,
    "piece": "P",
    "from": "e2",
    "to": "e4",
    "player": "white",
    "position": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3"
  },
  {
    "type": "ChessMove",
    "gameId": "game_123",
    "timestamp": "2025-04-01T10:07:00Z",
    "moveNumber": 1,
    "piece": "P",
    "from": "e7",
    "to": "e5",
    "player": "black",
    "position": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6"
  },
  {
    "type": "ChessMove",
    "gameId": "game_123",
    "timestamp": "2025-04-01T10:10:00Z",
    "moveNumber": 2,
    "piece": "N",
    "from": "g1",
    "to": "f3",
    "player": "white",
    "position": "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -"
  },
  {
    "type": "ChessMove",
    "gameId": "game_123",
    "timestamp": "2025-04-01T10:12:00Z",
    "moveNumber": 2,
    "piece": "N",
    "from": "b8",
    "to": "c6",
    "player": "black",
    "position": "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -"
  },
  {
    "type": "ChessMove",
    "gameId": "game_123",
    "timestamp": "2025-04-01T10:15:00Z",
    "moveNumber": 3,
    "piece": "B",
    "from": "f1",
    "to": "c4",
    "player": "white",
    "position": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq -"
  }
]
```

In the above example, we see that moves are stored separately as individual facts. This approach allows for more flexibility and scalability in managing and querying chess games. Depending on how we design our `ChainKey` properties, we can optimize for different query patterns without changing the underlying data.

## Why Facts Matter

1. **Verifiable History**: Changes to specific facts about an entity's state are recorded over time, creating an immutable audit trail that can be independently verified. Smaller entries representing specific facts are easier to manage and query, reducing the risk of data corruption or loss.

2. **Flexible Querying**: Because facts can be stored and organized flexibly, you can optimize for different query patterns without changing the underlying data.

3. **Improved Observability**: By breaking down complex state changes into smaller, more manageable facts, it can be easier for downstream systems to watch for changes in specific events or conditions. 

4. **Scalability**: Separating objects into multiple facts can help avoid [MVCC_READ_CONFLICTS](./mvcc_read_conflicts) and improve performance under high load.

## Best Practices

1. **Atomic Facts**: Each fact should represent one clear, indivisible truth. Consider splitting complex state changes into multiple facts when it makes sense.

2. **Contextual Organization**: Group related facts together when they're commonly queried together, but don't be afraid to split them when they have different lifecycles or access patterns.

3. **Clear Types**: Use descriptive, consistent fact types that indicate their purpose and content. This helps with both organization and querying.

4. **Temporal Awareness**: Include accurate timestamps and consider the temporal relationships between facts when designing your data model.

5. **Separate Concerns**: Separate frequently-read from frequently-written facts. Some facts are immutable or change very rarely. Others may be facts about a current state, or a transitory condition. Modeling these separately can improve performance and query efficiency.

## Implementation Strategies

When building on GalaChain, you have flexibility in how you structure your facts:

### Consolidated Facts
Use when data is tightly coupled and usually accessed together:
```json
{
  "type": "ItemCreated",
  "itemId": "sword_123",
  "metadata": {
    "name": "Excalibur",
    "attributes": { "damage": 100 }
  }
}
```

### Distributed Facts
Use when data has different lifecycles or access patterns:
```json
[
  {
    "type": "ItemRegistered",
    "itemId": "sword_123",
    "timestamp": "2025-04-01T10:00:00Z"
  },
  {
    "type": "ItemAttributesSet",
    "itemId": "sword_123",
    "attributes": { "damage": 100 },
    "timestamp": "2025-04-01T10:00:01Z"
  }
]
```

Choose the approach that best fits your specific use case. The flexibility of GalaChain's fact-based storage lets you optimize for your application's needs while maintaining the benefits of blockchain's immutability and auditability.
