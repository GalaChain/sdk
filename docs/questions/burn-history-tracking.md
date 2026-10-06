### Question


How do I track burn history in GalaChain?


### Answer


GalaChain automatically tracks burn history through the built-in `TokenBurn` and `TokenBurnCounter` objects that are written to the chain during burn operations. Here's how to use them:

1. Token Burn Records:
When using the `burnTokens` function, each burn operation creates a `TokenBurn` record:

```typescript
import { TokenBurn } from '@gala-chain/api';

// TokenBurn objects are automatically created and contain:
export class TokenBurn extends ChainObject {
  @ChainKey({ position: 0 })
  public burnedBy: UserAlias;    // Who performed the burn

  @ChainKey({ position: 1 })
  public collection: string;      // Token collection

  @ChainKey({ position: 2 })
  public category: string;        // Token category

  @ChainKey({ position: 3 })
  public type: string;           // Token type

  @ChainKey({ position: 4 })
  public additionalKey: string;   // Additional identifier

  @ChainKey({ position: 5 })
  public instance: string;       // Token instance

  public quantity: BigNumber;    // Amount burned
}
```

2. Burn Counter Tracking:
The SDK also maintains `TokenBurnCounter` objects to track burn statistics:

```typescript
import { TokenBurnCounter } from '@gala-chain/api';

// TokenBurnCounter tracks burn statistics:
export class TokenBurnCounter extends RangedChainObject {
  @ChainKey({ position: 0 })
  public collection: string;      // Token collection

  @ChainKey({ position: 1 })
  public category: string;        // Token category

  @ChainKey({ position: 2 })
  public type: string;           // Token type

  @ChainKey({ position: 3 })
  public additionalKey: string;   // Additional identifier

  @ChainKey({ position: 4 })
  public timeKey: string;        // Time period for the counter

  @ChainKey({ position: 5 })
  public burnedBy: UserAlias;    // Who performed the burns

  public quantity: BigNumber;    // Total amount burned in this period
}
```

3. Viewing Burn History:
You can track burn history in several ways:

a) Using the Block Explorer:
- Navigate to the block explorer for your GalaChain network
- Search for `TokenBurn` objects using the following filters:
  * Collection
  * Category
  * Type
  * Instance (for NFTs)
  * BurnedBy (user who performed the burn)
- View burn details including:
  * Quantity burned
  * Timestamp
  * Transaction ID

b) Using TokenBurnCounter Statistics:
- Search for `TokenBurnCounter` objects to view aggregated statistics
- Filter by:
  * Collection/Category/Type
  * Time period
  * Burning user
- View statistics including:
  * Total quantity burned
  * Burn frequency
  * Time-based trends

Best Practices:
- Regularly monitor burn activity through the block explorer
- Use the time period filters to analyze burn patterns
- Track both individual burns and aggregated statistics
- Keep records of significant burn events
- Monitor burn rates for different token types

Key Points:
- All burns are automatically tracked by the SDK
- No custom implementation needed - use the block explorer
- Both individual burns and statistics are available
- Data is permanently stored on chain
- Historical data can be analyzed at any time

Note: All operations in GalaChain must be executed sequentially to ensure deterministic behavior. Never use Promise.all or other parallel execution methods, as they can lead to non-deterministic results across multiple chaincode executions.