### Question


What's the difference between burning NFTs and fungible tokens?


### Answer


GalaChain provides built-in mechanisms for burning both NFTs and fungible tokens through the same core types and functions, but with some key differences in how they're handled:

1. Token Burn Structure:
Both NFTs and fungible tokens use the `TokenBurn` class from `@gala-chain/api`:

```typescript
import { TokenBurn } from '@gala-chain/api';

// TokenBurn class structure - used for both NFTs and fungibles
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

2. Burn Quantity Specification:
When burning tokens, you specify the burn details using `BurnTokenQuantity`:

```typescript
import { BurnTokenQuantity, TokenInstanceKey } from '@gala-chain/api';

// For NFTs - quantity is always 1
const nftBurn: BurnTokenQuantity = {
  tokenInstanceKey: new TokenInstanceKey({
    collection: 'my-nfts',
    category: 'characters',
    type: 'hero',
    additionalKey: '',
    instance: '123'  // Specific NFT instance
  }),
  quantity: new BigNumber(1)
};

// For fungible tokens - quantity can be any positive number
const fungibleBurn: BurnTokenQuantity = {
  tokenInstanceKey: new TokenInstanceKey({
    collection: 'game-currency',
    category: 'coins',
    type: 'gold',
    additionalKey: '',
    instance: '0'  // Usually '0' for fungibles
  }),
  quantity: new BigNumber(1000)
};
```

3. Using the burnTokens Function:
The same `burnTokens` function is used for both types:

```typescript
import { burnTokens } from '@gala-chain/chaincode';

// Example usage in your chaincode
async function burnTokens(ctx: GalaChainContext, params: {
  owner: UserAlias,
  toBurn: BurnTokenQuantity[]
}) {
  const burns = await burnTokens(ctx, {
    owner: params.owner,
    toBurn: params.toBurn,
    preValidated: false
  });
  return burns;  // Returns array of TokenBurn objects
}
```

Key Differences:
1. Instance Handling:
   - NFTs: Each token has a unique instance ID that must be specified
   - Fungibles: Use instance '0' as they are interchangeable

2. Quantity Handling:
   - NFTs: Always burn quantity of 1 (the entire token)
   - Fungibles: Can burn any positive quantity up to the balance

3. Balance Impact:
   - NFTs: Balance goes to 0 and token instance is removed
   - Fungibles: Balance is reduced by burn amount

Best Practices:
- Use the built-in `TokenBurn` class for consistent burn tracking
- Leverage the `burnTokens` function for standardized burn operations
- Always validate token ownership before burning
- Set appropriate burn quantities (1 for NFTs)
- Track burn events for auditing

Key Points:
- Both NFTs and fungibles use the same core types and functions
- The main difference is in how instances and quantities are handled
- The `TokenBurn` class tracks all burns consistently
- The `burnTokens` function handles validation automatically
- Burns are permanent and irreversible

Note: All operations in GalaChain must be executed sequentially to ensure deterministic behavior. Never use Promise.all or other parallel execution methods, as they can lead to non-deterministic results across multiple chaincode executions.