### Question


How do I handle timeouts in chaincode?


### Answer


GalaChain provides several mechanisms for handling timeouts effectively. Here's how to implement timeout handling:

1. Transaction Timeouts:
```typescript
@Submit()
async function longRunningOperation(
  ctx: GalaChainContext,
  params: {
    operationId: string;
    timeoutMs: number;
  }
): Promise<void> {
  const startTime = Date.now();
  
  // Check if operation already exists
  const key = ChainObject.getCompositeKeyFromParts(
    'OPERATION',
    [params.operationId]
  );
  
  const operation = await getObjectByKey(ctx, Operation, key);
  if (operation) {
    throw new Error('Operation already in progress');
  }
  
  // Create operation record
  const newOperation = new Operation({
    id: params.operationId,
    startTime: startTime,
    timeoutAt: startTime + params.timeoutMs,
    status: 'running'
  });
  await putChainObject(ctx, newOperation);
  
  try {
    // Perform operation with timeout check
    while (someCondition) {
      if (Date.now() > newOperation.timeoutAt) {
        throw new TimeoutError('Operation timed out');
      }
      await processNextBatch();
    }
    
    // Update status on success
    const completed = new Operation({
      ...newOperation,
      status: 'completed',
      completedAt: Date.now()
    });
    await putChainObject(ctx, completed);
  } catch (error) {
    // Update status on failure
    const failed = new Operation({
      ...newOperation,
      status: 'failed',
      error: error.message
    });
    await putChainObject(ctx, failed);
    throw error;
  }
}
```

2. Resource Lock Timeouts:
```typescript
export class TimedLock extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly resourceId: string;
  
  public readonly lockedBy?: string;
  public readonly acquiredAt?: number;
  public readonly timeoutMs: number;
  
  public isLocked(): boolean {
    return this.lockedBy != null && 
           this.acquiredAt != null &&
           Date.now() < (this.acquiredAt + this.timeoutMs);
  }
  
  public hasTimedOut(): boolean {
    return this.lockedBy != null &&
           this.acquiredAt != null &&
           Date.now() >= (this.acquiredAt + this.timeoutMs);
  }
}

@Submit()
async function acquireResourceWithTimeout(
  ctx: GalaChainContext,
  params: {
    resourceId: string;
    userId: string;
    timeoutMs: number;
  }
): Promise<void> {
  const key = ChainObject.getCompositeKeyFromParts(
    TimedLock.INDEX_KEY,
    [params.resourceId]
  );
  
  const lock = await getObjectByKey(ctx, TimedLock, key);
  if (lock) {
    if (lock.isLocked() && lock.lockedBy !== params.userId) {
      throw new Error('Resource is locked');
    }
    if (lock.hasTimedOut()) {
      // Auto-release timed out lock
      await releaseResource(ctx, { resourceId: params.resourceId });
    }
  }
  
  const newLock = new TimedLock({
    resourceId: params.resourceId,
    lockedBy: params.userId,
    acquiredAt: Date.now(),
    timeoutMs: params.timeoutMs
  });
  await putChainObject(ctx, newLock);
}
```

3. Async Operation Status:
```typescript
export class AsyncOperation extends ChainObject {
  @ChainKey({ position: 0 })
  public readonly operationId: string;
  
  public readonly status: 'pending' | 'running' | 'completed' | 'failed';
  public readonly startTime: number;
  public readonly timeoutMs: number;
  public readonly result?: any;
  public readonly error?: string;
  
  public hasTimedOut(): boolean {
    return Date.now() >= (this.startTime + this.timeoutMs);
  }
}

@Submit()
async function checkOperationStatus(
  ctx: GalaChainContext,
  params: {
    operationId: string;
  }
): Promise<AsyncOperation> {
  const key = ChainObject.getCompositeKeyFromParts(
    AsyncOperation.INDEX_KEY,
    [params.operationId]
  );
  
  const operation = await getObjectByKey(ctx, AsyncOperation, key);
  if (!operation) {
    throw new Error('Operation not found');
  }
  
  if (operation.status === 'running' && operation.hasTimedOut()) {
    // Update status for timed out operation
    const timedOut = new AsyncOperation({
      ...operation,
      status: 'failed',
      error: 'Operation timed out'
    });
    await putChainObject(ctx, timedOut);
    return timedOut;
  }
  
  return operation;
}
```

4. Cleanup of Timed Out Operations:
```typescript
@Submit()
async function cleanupTimedOutOperations(
  ctx: GalaChainContext
): Promise<void> {
  const operations = await getObjectsByPartialCompositeKey(
    ctx,
    AsyncOperation.INDEX_KEY,
    [],
    AsyncOperation
  );
  
  const timedOutOps = operations.filter(op => 
    op.status === 'running' && op.hasTimedOut()
  );
  
  // Process operations sequentially
  for (const op of timedOutOps) {
    const failed = new AsyncOperation({
      ...op,
      status: 'failed',
      error: 'Operation timed out'
    });
    await putChainObject(ctx, failed);
    
    // Emit timeout event
    ctx.stub.setEvent('OperationTimeout', {
      operationId: op.operationId,
      startTime: op.startTime,
      timeoutMs: op.timeoutMs
    });
  }
}
```

Best Practices:
- Always set appropriate timeout values
- Implement cleanup mechanisms
- Use sequential operations (avoid Promise.all)
- Handle timeout events
- Monitor long-running operations

Key Points:
- Use timestamp-based timeouts
- Implement auto-cleanup
- Handle partial completions
- Emit timeout events
- Log timeout occurrences

Timeout Tips:
- Set reasonable timeouts
- Clean up timed out resources
- Monitor timeout patterns
- Implement retry logic
- Test timeout scenarios

Note: The GalaChain SDK provides built-in timeout handling through its transaction context and chaincode interfaces. For most use cases, you should rely on these built-in mechanisms rather than implementing custom timeout logic. The examples above illustrate the concepts but consider using the SDK's timeout handling features in production.