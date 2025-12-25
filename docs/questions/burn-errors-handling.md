### Question


What's the best way to handle burn errors in GalaChain?


### Answer


GalaChain provides a set of built-in error types for handling burn-related errors. Here's how to use them effectively:

1. Built-in Error Types:
```typescript
import { 
  InsufficientBalanceError,
  NftMultipleBurnNotAllowedError,
  BurnTokensFailedError,
  InsufficientBurnAllowanceError,
  UseAllowancesFailedError
} from '@gala-chain/chaincode';

// Example error handling in your chaincode
async function handleBurnOperation(ctx: GalaChainContext, params: {
  owner: UserAlias,
  toBurn: BurnTokenQuantity[]
}) {
  try {
    const burns = await burnTokens(ctx, {
      owner: params.owner,
      toBurn: params.toBurn,
      preValidated: false
    });
    return burns;

  } catch (error) {
    // Handle specific burn errors
    if (ChainError.matches(InsufficientBalanceError)) {
      // User doesn't have enough tokens to burn
      const { owner, spendableQuantity, quantity, tokenInstanceKey } = error.payload;
      // Handle insufficient balance...

    } else if (ChainError.matches(NftMultipleBurnNotAllowedError)) {
      // Attempted to burn multiple instances of an NFT
      const { tokenInstanceKey } = error.payload;
      // Handle NFT burn error...

    } else if (ChainError.matches(InsufficientBurnAllowanceError)) {
      // User doesn't have sufficient burn allowance
      const { user, allowedQuantity, quantity, tokenInstanceKey } = error.payload;
      // Handle insufficient allowance...

    } else if (ChainError.matches(UseAllowancesFailedError)) {
      // Failed to use burn allowances
      const { quantity, tokenInstanceKey, owner } = error.payload;
      // Handle allowance usage error...

    } else if (ChainError.matches(BurnTokensFailedError)) {
      // General burn operation failure
      // Handle general burn error...

    } else {
      // Handle unexpected errors
      throw error;
    }
  }
}
```

2. Error Types and Their Use Cases:

- `InsufficientBalanceError`:
  * When user tries to burn more tokens than they own
  * Includes details about available and requested amounts

- `NftMultipleBurnNotAllowedError`:
  * When attempting to burn multiple instances of an NFT
  * NFTs must be burned one at a time

- `InsufficientBurnAllowanceError`:
  * When user lacks required burn allowance
  * Includes details about allowed and requested amounts

- `UseAllowancesFailedError`:
  * When burn allowance usage fails
  * Could be due to expired or invalid allowances

- `BurnTokensFailedError`:
  * General burn operation failure
  * Includes detailed error message and context

3. Best Practices:
- Always use try-catch blocks around burn operations
- Handle each error type specifically
- Provide clear error messages to users
- Log errors appropriately
- Maintain transaction atomicity

Key Points:
- Use the SDK's built-in error types
- Each error includes relevant context in its payload
- Errors are strongly typed for better handling
- Error messages are standardized
- Error handling preserves transaction atomicity
- Errors are mapped to proper HTTP status code responses in REST API

Note: All operations in GalaChain must be executed sequentially to ensure deterministic behavior. Never use Promise.all or other parallel execution methods, as they can lead to non-deterministic results across multiple chaincode executions.
