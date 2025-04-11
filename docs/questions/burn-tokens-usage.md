### Question


How do I implement token burns in GalaChain?


### Answer


GalaChain provides built-in mechanisms for burning tokens through the `TokenBurn` class and `burnTokens` function. Here's how to use them:

1. The `TokenBurn` Class:
GalaChain provides a built-in `TokenBurn` class in `@gala-chain/api` that tracks token burns:

```typescript
import { TokenBurn } from '@gala-chain/api';

// TokenBurn class structure
export class TokenBurn extends ChainObject {
  @ChainKey({ position: 0 })
  public burnedBy: UserAlias;  // Who performed the burn

  @ChainKey({ position: 1 })
  public collection: string;    // Token collection

  @ChainKey({ position: 2 })
  public category: string;      // Token category

  @ChainKey({ position: 3 })
  public type: string;         // Token type

  @ChainKey({ position: 4 })
  public additionalKey: string; // Additional identifier

  @ChainKey({ position: 5 })
  public instance: string;     // Token instance

  public quantity: BigNumber;  // Amount burned
}
```

2. Using the `burnTokens` Function:
GalaChain provides a `burnTokens` function in the chaincode library that handles token burns:

```typescript
import { burnTokens, BurnTokenQuantity } from '@gala-chain/chaincode';

// Example usage in your chaincode
async function burnMyTokens(ctx: GalaChainContext, owner: UserAlias, toBurn: BurnTokenQuantity[]) {
  const burns = await burnTokens(ctx, {
    owner,           // Owner of the tokens to burn
    toBurn,         // Array of tokens to burn
    preValidated: false  // Set to true if you've already validated allowances
  });
  return burns;  // Returns array of TokenBurn objects
}
```

3. Contract Implementation Example:
The GalaChain token contract provides a built-in `BurnTokens` method that you can use or reference:

```typescript
import { BurnTokensDto, TokenBurn } from '@gala-chain/api';

@Submit({
  in: BurnTokensDto,
  out: { arrayOf: TokenBurn }
})
public async BurnTokens(ctx: GalaChainContext, dto: BurnTokensDto): Promise<TokenBurn[]> {
  return burnTokens(ctx, {
    owner: await resolveUserAlias(ctx, dto.owner ?? ctx.callingUser),
    toBurn: dto.toBurn,
    preValidated: false
  });
}
```

Best Practices:
- Always validate token ownership before burning
- Use sequential operations for multiple burns
- Handle errors gracefully
- Track burn history
- Emit burn events

Key Points:
- Burns are permanent and irreversible
- Burns require proper authorization
- Burns update token balances
- Burns create audit records
- Burns may require allowances

Burn Tips:
- Verify token ownership
- Check burn allowances
- Use proper error handling
- Monitor burn patterns
- Keep burn records
