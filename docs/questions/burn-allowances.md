### Question


How do I handle burn allowances in GalaChain?


### Answer


GalaChain provides built-in mechanisms for managing burn allowances through the `TokenAllowance` class and `grantAllowance` function. Here's how to use them:

1. The `TokenAllowance` Class:
GalaChain provides a built-in `TokenAllowance` class in `@gala-chain/api` that tracks token allowances, including burn permissions:

```typescript
import { TokenAllowance, AllowanceType } from '@gala-chain/api';

// TokenAllowance class structure
export class TokenAllowance extends ChainObject {
  @ChainKey({ position: 0 })
  public grantedTo: UserAlias;    // Who received the allowance

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

  public allowanceType: AllowanceType;  // BURN, TRANSFER, etc.
  public quantity: BigNumber;    // Amount allowed
  public uses: BigNumber;        // Number of times allowance can be used
  public expires: number;        // When the allowance expires
}
```

2. Using the `grantAllowance` Function:
GalaChain provides a `grantAllowance` function in the chaincode library to create allowances:

```typescript
import { grantAllowance, GrantAllowanceQuantity, AllowanceType } from '@gala-chain/chaincode';

// Example usage in your chaincode
async function createBurnAllowance(ctx: GalaChainContext, params: {
  tokenInstance: TokenInstanceQueryKey,
  grantedTo: UserAlias,
  quantity: BigNumber,
  uses?: BigNumber,
  expires?: number
}) {
  const allowances = await grantAllowance(ctx, {
    tokenInstance: params.tokenInstance,
    allowanceType: AllowanceType.BURN,
    quantities: [{
      grantedTo: params.grantedTo,
      quantity: params.quantity
    }],
    uses: params.uses ?? new BigNumber(1),
    expires: params.expires ?? inverseTime(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });
  return allowances;
}
```

3. Contract Implementation Example:
The GalaChain token contract provides built-in methods for managing burn allowances:

```typescript
import { GrantAllowanceDto, TokenAllowance, AllowanceType } from '@gala-chain/api';

@Submit({
  in: GrantAllowanceDto,
  out: { arrayOf: TokenAllowance }
})
public async GrantBurnAllowance(ctx: GalaChainContext, dto: GrantAllowanceDto): Promise<TokenAllowance[]> {
  return grantAllowance(ctx, {
    tokenInstance: dto.tokenInstance,
    allowanceType: AllowanceType.BURN,
    quantities: dto.quantities,
    uses: dto.uses,
    expires: dto.expires
  });
}

```

Best Practices:
- Use the built-in `TokenAllowance` class for consistent allowance tracking
- Leverage the `grantAllowance` function for standardized allowance creation
- Set appropriate expiration times
- Specify the number of uses allowed
- Track allowance usage

Key Points:
- Allowances are managed through the standard `TokenAllowance` class
- The `AllowanceType.BURN` type specifically enables burn permissions
- Allowances can be time-limited through the `expires` field
- Usage can be limited through the `uses` field
- Allowances are tracked and validated automatically

Allowance Tips:
- Always set an expiration time
- Consider limiting the number of uses
- Use the built-in validation
- Monitor allowance events
- Keep allowance records

Note: All operations in GalaChain must be executed sequentially to ensure deterministic behavior. Never use Promise.all or other parallel execution methods, as they can lead to non-deterministic results across multiple chaincode executions.