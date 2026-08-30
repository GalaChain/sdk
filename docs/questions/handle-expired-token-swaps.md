### Question


How do I handle expired token swaps?


### Answer


GalaChain provides a comprehensive approach to handle expired token swaps. Here's how to implement expiration handling:

1. Swap Request with Expiration:
```typescript
export class SwapRequest extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly swapId: string;

  @ChainKey({ position: 1 })
  @IsUserAlias()
  public readonly requester: UserAlias;

  public readonly fromToken: {
    tokenId: string;
    amount: number;
  };

  public readonly toToken: {
    tokenId: string;
    amount: number;
  };

  public readonly expiresAt: number;
  public readonly status: 'pending' | 'completed' | 'expired' | 'cancelled';
  public readonly createdAt: number;
  public readonly completedAt?: number;

  public hasExpired(): boolean {
    return Date.now() >= this.expiresAt;
  }
}

@Submit()
async function createSwapRequest(
  ctx: GalaChainContext,
  params: {
    fromToken: {
      tokenId: string;
      amount: number;
    };
    toToken: {
      tokenId: string;
      amount: number;
    };
    expiresInMs: number;
  }
): Promise<string> {
  const swapId = generateUniqueId();
  const requester = ctx.callingUser;

  // Validate token ownership
  const balance = await getBalance(ctx, {
    tokenId: params.fromToken.tokenId,
    owner: requester
  });
  if (!balance || balance.amount < params.fromToken.amount) {
    throw new Error('Insufficient balance for swap');
  }

  const request = new SwapRequest({
    swapId,
    requester,
    fromToken: params.fromToken,
    toToken: params.toToken,
    expiresAt: Date.now() + params.expiresInMs,
    status: 'pending',
    createdAt: Date.now()
  });

  await putChainObject(ctx, request);
  return swapId;
}
```

2. Expiration Check and Cleanup:
```typescript
@Submit()
async function cleanupExpiredSwaps(
  ctx: GalaChainContext
): Promise<void> {
  const requests = await getObjectsByPartialCompositeKey(
    ctx,
    SwapRequest.INDEX_KEY,
    [],
    SwapRequest
  );

  const expiredRequests = requests.filter(req => 
    req.status === 'pending' && req.hasExpired()
  );

  // Process expired requests sequentially
  for (const req of expiredRequests) {
    const expired = new SwapRequest({
      ...req,
      status: 'expired'
    });

    // Release any locked tokens
    await releaseTokenLock(ctx, {
      tokenId: req.fromToken.tokenId,
      owner: req.requester,
      amount: req.fromToken.amount
    });

    await putChainObject(ctx, expired);

    // Emit expiration event
    ctx.stub.setEvent('SwapExpired', {
      swapId: req.swapId,
      requester: req.requester,
      expiresAt: req.expiresAt
    });
  }
}
```

3. Expiration Validation:
```typescript
@Submit()
async function validateSwapRequest(
  ctx: GalaChainContext,
  params: {
    swapId: string;
  }
): Promise<void> {
  const key = ChainObject.getCompositeKeyFromParts(
    SwapRequest.INDEX_KEY,
    [params.swapId]
  );

  const request = await getObjectByKey(ctx, SwapRequest, key);
  if (!request) {
    throw new Error('Swap request not found');
  }

  if (request.status !== 'pending') {
    throw new Error(`Swap is ${request.status}`);
  }

  if (request.hasExpired()) {
    // Auto-expire the request
    const expired = new SwapRequest({
      ...request,
      status: 'expired'
    });
    await putChainObject(ctx, expired);
    throw new Error('Swap request has expired');
  }
}
```

4. Expiration Monitoring:
```typescript
@Submit()
async function getExpiringSwaps(
  ctx: GalaChainContext,
  params: {
    timeWindowMs: number;
  }
): Promise<SwapRequest[]> {
  const now = Date.now();
  const requests = await getObjectsByPartialCompositeKey(
    ctx,
    SwapRequest.INDEX_KEY,
    [],
    SwapRequest
  );

  return requests.filter(req => 
    req.status === 'pending' &&
    req.expiresAt > now &&
    req.expiresAt <= now + params.timeWindowMs
  );
}

@Submit()
async function notifyExpiringSwaps(
  ctx: GalaChainContext
): Promise<void> {
  const expiringSwaps = await getExpiringSwaps(ctx, {
    timeWindowMs: 300000 // 5 minutes
  });

  // Process expiring swaps sequentially
  for (const swap of expiringSwaps) {
    ctx.stub.setEvent('SwapExpiringSoon', {
      swapId: swap.swapId,
      requester: swap.requester,
      expiresAt: swap.expiresAt,
      timeToExpiration: swap.expiresAt - Date.now()
    });
  }
}
```

Best Practices:
- Set reasonable expiration times
- Implement auto-cleanup
- Monitor approaching expirations
- Release locked resources
- Emit expiration events

Key Points:
- Validate expiration
- Clean up expired swaps
- Release token locks
- Track expiration status
- Notify stakeholders

Expiration Tips:
- Use timestamp-based expiration
- Implement grace periods
- Monitor expiration patterns
- Archive expired swaps
- Handle partial completions

Note: All operations in GalaChain must be executed sequentially to ensure deterministic behavior. Never use Promise.all, forEach, or other parallel execution methods, as they can lead to non-deterministic results across multiple chaincode executions. This is especially important when handling expirations and cleanup operations where the order of execution must be consistent.