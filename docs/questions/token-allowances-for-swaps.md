### Question


How do I handle token allowances in swaps?


### Answer


GalaChain provides robust mechanisms for handling token allowances in swaps. Here's how to implement and manage allowances in swap operations:

1. Token Allowance Structure:
```typescript
export class SwapAllowance extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly tokenId: string;

  @ChainKey({ position: 1 })
  @IsUserAlias()
  public readonly owner: UserAlias;

  @ChainKey({ position: 2 })
  @IsUserAlias()
  public readonly spender: UserAlias;

  @Min(0)
  public readonly amount: number;

  public readonly expiresAt?: number;
  public readonly restrictions?: {
    minPrice?: number;
    maxPrice?: number;
    allowedTokenTypes?: string[];
  };
}

@Submit()
async function grantSwapAllowance(
  ctx: GalaChainContext,
  params: {
    tokenId: string;
    spender: UserAlias;
    amount: number;
    expiresAt?: number;
    restrictions?: {
      minPrice?: number;
      maxPrice?: number;
      allowedTokenTypes?: string[];
    };
  }
): Promise<void> {
  const owner = ctx.callingUser;
  
  // Validate token ownership
  const balance = await getBalance(ctx, {
    tokenId: params.tokenId,
    owner: owner
  });
  if (!balance || balance.amount < params.amount) {
    throw new Error('Insufficient balance for allowance');
  }

  const allowance = new SwapAllowance({
    tokenId: params.tokenId,
    owner: owner,
    spender: params.spender,
    amount: params.amount,
    expiresAt: params.expiresAt,
    restrictions: params.restrictions
  });

  await putChainObject(ctx, allowance);
}
```

2. Swap Allowance Validation:
```typescript
@Submit()
async function validateSwapAllowance(
  ctx: GalaChainContext,
  params: {
    tokenId: string;
    owner: UserAlias;
    amount: number;
    proposedPrice: number;
    targetTokenType: string;
  }
): Promise<void> {
  const spender = ctx.callingUser;
  
  const key = ChainObject.getCompositeKeyFromParts(
    SwapAllowance.INDEX_KEY,
    [params.tokenId, params.owner, spender]
  );
  
  const allowance = await getObjectByKey(ctx, SwapAllowance, key);
  if (!allowance) {
    throw new Error('No allowance found');
  }

  // Check expiration
  if (allowance.expiresAt && Date.now() > allowance.expiresAt) {
    throw new Error('Allowance has expired');
  }

  // Check amount
  if (allowance.amount < params.amount) {
    throw new Error('Insufficient allowance');
  }

  // Check price restrictions
  if (allowance.restrictions) {
    if (allowance.restrictions.minPrice && 
        params.proposedPrice < allowance.restrictions.minPrice) {
      throw new Error('Price below minimum allowed');
    }
    if (allowance.restrictions.maxPrice && 
        params.proposedPrice > allowance.restrictions.maxPrice) {
      throw new Error('Price above maximum allowed');
    }
    if (allowance.restrictions.allowedTokenTypes &&
        !allowance.restrictions.allowedTokenTypes.includes(params.targetTokenType)) {
      throw new Error('Token type not allowed for swap');
    }
  }
}
```

3. Executing Swaps with Allowances:
```typescript
@Submit()
async function executeSwapWithAllowance(
  ctx: GalaChainContext,
  params: {
    fromToken: {
      tokenId: string;
      owner: UserAlias;
      amount: number;
    };
    toToken: {
      tokenId: string;
      owner: UserAlias;
      amount: number;
    };
  }
): Promise<void> {
  const spender = ctx.callingUser;

  // Validate allowances
  await validateSwapAllowance(ctx, {
    tokenId: params.fromToken.tokenId,
    owner: params.fromToken.owner,
    amount: params.fromToken.amount,
    proposedPrice: calculatePrice(params),
    targetTokenType: await getTokenType(ctx, params.toToken.tokenId)
  });

  // Update allowance
  const allowanceKey = ChainObject.getCompositeKeyFromParts(
    SwapAllowance.INDEX_KEY,
    [params.fromToken.tokenId, params.fromToken.owner, spender]
  );
  
  const allowance = await getObjectByKey(ctx, SwapAllowance, allowanceKey);
  const updatedAllowance = new SwapAllowance({
    ...allowance,
    amount: allowance.amount - params.fromToken.amount
  });

  // Execute swap sequentially
  // First update the allowance
  await putChainObject(ctx, updatedAllowance);
  
  // Then execute the transfers in a specific order
  await transferToken(ctx, params.fromToken);
  await transferToken(ctx, params.toToken);
}
```

4. Batch Allowance Operations:
```typescript
@Submit()
async function batchUpdateAllowances(
  ctx: GalaChainContext,
  params: {
    operations: Array<{
      tokenId: string;
      spender: UserAlias;
      amount: number;
      action: 'grant' | 'revoke' | 'modify';
    }>;
  }
): Promise<{
    succeeded: string[];
    failed: Array<{ tokenId: string; error: string }>;
  }> {
  const results = {
    succeeded: [] as string[],
    failed: [] as Array<{ tokenId: string; error: string }>
  };

  for (const op of params.operations) {
    try {
      if (op.action === 'revoke') {
        await revokeAllowance(ctx, {
          tokenId: op.tokenId,
          spender: op.spender
        });
      } else {
        await grantSwapAllowance(ctx, {
          tokenId: op.tokenId,
          spender: op.spender,
          amount: op.amount
        });
      }
      results.succeeded.push(op.tokenId);
    } catch (error) {
      results.failed.push({
        tokenId: op.tokenId,
        error: error.message
      });
    }
  }

  return results;
}
```

Best Practices:
- Validate allowances before swaps
- Implement expiration checks
- Use sequential operations
- Handle batch updates
- Monitor allowance usage

Key Points:
- Check token ownership
- Validate restrictions
- Update atomically
- Handle expirations
- Track allowance history

Allowance Tips:
- Set reasonable limits
- Implement price bounds
- Use token type restrictions
- Monitor usage patterns
- Clean up expired allowances

Note: Always execute operations sequentially in a specific order to ensure deterministic behavior across multiple chaincode executions. Never use Promise.all or other parallel execution methods as they can lead to non-deterministic results.