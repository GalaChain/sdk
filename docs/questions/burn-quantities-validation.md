### Question


How do I validate burn quantities in GalaChain?


### Answer


GalaChain's SDK provides built-in validation for burn quantities. Here's how it works:

1. Automatic Validations:
```typescript
import { burnTokens, BurnTokenQuantity, TokenInstanceKey } from '@gala-chain/chaincode';
import { UserAlias } from '@gala-chain/api';
import { BigNumber } from 'bignumber.js';

// The burnTokens function automatically validates:
async function burnTokens(ctx: GalaChainContext, params: {
  owner: UserAlias,
  toBurn: BurnTokenQuantity[]
}) {
  // Validation happens automatically:
  // - Balance checks
  // - Decimal limits
  // - NFT restrictions
  // - Allowance verification
  // - Token existence
  
  const burns = await burnTokens(ctx, {
    owner: params.owner,
    toBurn: params.toBurn,
    preValidated: false  // Set to true to skip allowance checks
  });

  return burns;
}
```

2. Built-in Validation Rules:

- Balance Validation:
  * Checks if owner has sufficient balance
  * Prevents burning more than available
  * Validates across batch operations

- NFT Validation:
  * Ensures NFTs are burned one at a time
  * Prevents multiple NFT burns in single request
  * Validates NFT ownership

- Decimal Validation:
  * Enforces token decimal limits
  * Prevents burns with invalid decimals
  * Respects token class configuration

- Allowance Validation:
  * Verifies burn allowances
  * Checks allowance quantities
  * Validates allowance expiration

3. Error Types:

- `InsufficientBalanceError`:
  * When burn amount exceeds balance
  * Includes available and requested amounts

- `NftMultipleBurnNotAllowedError`:
  * When attempting multiple NFT burns
  * Enforces single NFT burn rule

- `InvalidDecimalError`:
  * When burn amount has invalid decimals
  * Based on token class configuration

- `InsufficientBurnAllowanceError`:
  * When burn allowance is insufficient
  * Includes allowance details

Key Points:
- No manual validation needed
- SDK handles all validation rules
- Strong error typing for handling
- Atomic validation in transactions
- Built-in security checks

Note: All operations in GalaChain must be executed sequentially to ensure deterministic behavior. Never use Promise.all or other parallel execution methods, as they can lead to non-deterministic results across multiple chaincode executions.