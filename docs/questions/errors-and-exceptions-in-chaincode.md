### Question


How do I handle errors and exceptions in chaincode?


### Answer


GalaChain provides a robust error handling system centered around the `DefaultError` class. Here's how to implement proper error handling:

1. Custom Error Classes:
```typescript
import { DefaultError } from '@gala-chain/api';

export class InsufficientBalanceError extends DefaultError {
  constructor(
    public readonly userId: string,
    public readonly required: number,
    public readonly available: number
  ) {
    super(
      'INSUFFICIENT_BALANCE',
      `User ${userId} has insufficient balance. Required: ${required}, Available: ${available}`
    );
  }

  public static is(error: Error): error is InsufficientBalanceError {
    return error instanceof InsufficientBalanceError;
  }
}

export class TokenNotFoundError extends DefaultError {
  constructor(
    public readonly tokenId: string
  ) {
    super(
      'TOKEN_NOT_FOUND',
      `Token ${tokenId} not found`
    );
  }

  public static is(error: Error): error is TokenNotFoundError {
    return error instanceof TokenNotFoundError;
  }
}
```

2. Error Handling in Chaincode:
```typescript
@Submit()
async function transferTokens(
  ctx: GalaChainContext,
  params: {
    fromId: string;
    toId: string;
    amount: number;
  }
): Promise<void> {
  try {
    // Get source balance
    const fromBalance = await getBalance(ctx, params.fromId);
    if (!fromBalance) {
      throw new TokenNotFoundError(params.fromId);
    }

    // Check sufficient balance
    if (fromBalance.amount < params.amount) {
      throw new InsufficientBalanceError(
        params.fromId,
        params.amount,
        fromBalance.amount
      );
    }

    // Process transfer
    await processTransfer(ctx, params);
  } catch (error) {
    // Handle specific errors
    if (InsufficientBalanceError.is(error)) {
      // Log detailed balance info
      ctx.logger.error(
        `Balance check failed: ${error.required} > ${error.available}`
      );
      throw error;
    }

    if (TokenNotFoundError.is(error)) {
      ctx.logger.error(`Token lookup failed: ${error.tokenId}`);
      throw error;
    }

    // Handle unexpected errors
    ctx.logger.error('Unexpected error during transfer:', error);
    throw new DefaultError(
      'TRANSFER_FAILED',
      'Transfer failed due to an unexpected error'
    );
  }
}
```

3. Validation Errors:
```typescript
export class ValidationError extends DefaultError {
  constructor(
    public readonly errors: string[]
  ) {
    super(
      'VALIDATION_FAILED',
      `Validation failed: ${errors.join(', ')}`
    );
  }
}

@Submit()
async function createAsset(
  ctx: GalaChainContext,
  params: GameAssetParams
): Promise<GameAsset> {
  try {
    const asset = new GameAsset(params);
    await validateOrReject(asset);
    await putChainObject(ctx, asset);
    return asset;
  } catch (error) {
    if (error instanceof Array) {
      // Handle class-validator errors
      const validationErrors = error.map(e =>
        Object.values(e.constraints).join(', ')
      );
      throw new ValidationError(validationErrors);
    }
    throw error;
  }
}
```

4. Error Recovery:
```typescript
export class RetryableError extends DefaultError {
  constructor(
    message: string,
    public readonly retryAfter: number = 5000
  ) {
    super('RETRYABLE_ERROR', message);
  }
}

async function retryOperation<T>({
  operation,
  maxAttempts = 3,
  delayMs = 1000
}: {
  operation: () => Promise<T>;
  maxAttempts?: number;
  delayMs?: number;
}): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (error instanceof RetryableError) {
        if (attempt < maxAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, error.retryAfter || delayMs)
          );
          continue;
        }
      }
      break;
    }
  }

  throw lastError;
}
```

5. Error Aggregation:
```typescript
export class BatchError extends DefaultError {
  constructor(
    public readonly errors: Error[]
  ) {
    super(
      'BATCH_OPERATION_FAILED',
      `Multiple errors occurred: ${errors.map(e => e.message).join('; ')}`
    );
  }
}

async function batchOperation<T>(
  operations: (() => Promise<T>)[]
): Promise<T[]> {
  const results: T[] = [];
  const errors: Error[] = [];

  for (const operation of operations) {
    try {
      results.push(await operation());
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new BatchError(errors);
  }

  return results;
}
```

Best Practices:
- Extend DefaultError for custom errors
- Include relevant error context
- Implement type guards (is methods)
- Use specific error types
- Handle errors at appropriate levels

Key Points:
- Structured error handling
- Type-safe error checking
- Detailed error messages
- Error recovery patterns
- Proper error propagation

Error Design Tips:
- Keep error hierarchies shallow
- Include actionable information
- Consider error recovery
- Log errors appropriately
- Document error conditions