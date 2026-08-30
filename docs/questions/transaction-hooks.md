### Question


How do I implement transaction hooks in chaincode?


### Answer


Transaction hooks in GalaChain can be implemented using decorators and middleware patterns. Here's how:

1. Using Method Decorators:
```typescript
function ValidateOwnership() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (ctx: GalaChainContext, params: any) {
      // Pre-execution hook
      const item = await getObjectByKey(ctx, GameItem, params.itemId);
      if (item.owner !== ctx.callingUser) {
        throw new Error('Not the owner');
      }

      // Execute original method
      const result = await originalMethod.call(this, ctx, params);

      // Post-execution hook
      ctx.logger.info('Operation completed', {
        method: propertyKey,
        itemId: params.itemId
      });

      return result;
    };

    return descriptor;
  };
}

class GameContract extends Contract {
  @Submit()
  @ValidateOwnership()
  async transferItem(
    ctx: GalaChainContext,
    params: { itemId: string, newOwner: string }
  ): Promise<void> {
    // Method implementation
  }
}
```

2. Built-in Decorator Hooks:
```typescript
class GameContract extends Contract {
  private async checkFees(
    ctx: GalaChainContext,
    params: { amount: number }
  ): Promise<void> {
    const balance = await getTokenBalance(ctx, ctx.callingUser);
    if (balance.lt(params.amount)) {
      throw new Error('Insufficient funds for transaction fee');
    }
  }

  @Submit({
    before: async (ctx, params) => this.checkFees(ctx, { amount: 10 }),
    after: async (ctx) => ctx.logger.info('Transaction completed')
  })
  async purchaseItem(
    ctx: GalaChainContext,
    params: { itemId: string }
  ): Promise<void> {
    // Transaction logic here
  }
}
```

3. Common Hook Use Cases:
   - Transaction fee gates
   - Input validation
   - Access control checks
   - Logging and monitoring
   - State validation
   - Event emission

4. Transaction Context Extension:
```typescript
class GameContext extends GalaChainContext {
  private _gameState: GameState | undefined;

  async getGameState(): Promise<GameState> {
    if (!this._gameState) {
      this._gameState = await getObjectByKey(
        this,
        GameState,
        'CURRENT_STATE'
      );
    }
    return this._gameState;
  }

  async validateGameState(): Promise<void> {
    const state = await this.getGameState();
    if (state.status !== 'ACTIVE') {
      throw new Error('Game is not active');
    }
  }
}
```

5. Best Practices:
   - Keep hooks focused and single-purpose
   - Handle errors appropriately
   - Consider performance impact
   - Document hook behavior
   - Use typescript for type safety

Note: The `@Submit`, `@Evaluate`, and other GalaChain decorators provide built-in `before` and `after` hook properties, which are the preferred way to implement transaction hooks. Custom decorators should only be used when the built-in hooks don't meet your needs. While hooks are powerful, overusing them can make code harder to understand and maintain.