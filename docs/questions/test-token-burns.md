### Question

What's the best way to test token burns?

### Answer

GalaChain provides a comprehensive testing framework that makes it easy to test token burn operations. Here's how to effectively test token burns:

#### 1. Using the Test Fixture

The SDK provides a `fixture` helper for setting up test environments:

```typescript
import { fixture } from '@gala-chain/test';
import GalaChainTokenContract from './GalaChainTokenContract';

const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
  .registeredUsers(users.testUser1)
  .savedState(tokenClass, tokenInstance, tokenBalance)
  .savedRangeState([]);
```

#### 2. Testing Basic Burns

```typescript
// Given
const tokenInstance = currency.tokenInstance();
const tokenInstanceKey = currency.tokenInstanceKey();
const burnQty = new BigNumber('1');

// Create burn request
const dto = await createValidSubmitDTO(BurnTokensDto, {
  tokenInstances: [{ tokenInstanceKey, quantity: burnQty }]
}).signed(privateKey);

// When
const response = await contract.BurnTokens(ctx, dto);

// Then
expect(response).toEqual(GalaChainResponse.Success([expectedTokenBurn]));
expect(getWrites()).toEqual(
  writesMap(
    plainToInstance(TokenBalance, { ...tokenBalance, quantity: new BigNumber('999') }),
    tokenBurn,
    tokenBurnCounter
  )
);
```

#### 3. Testing Error Cases

```typescript
// Test insufficient balance
const response = await contract.BurnTokens(ctx, dto);
expect(response).toEqual(
  GalaChainResponse.Error(
    new InsufficientBurnAllowanceError(
      users.testUser2.identityKey,
      new BigNumber('0'),
      burnQty,
      tokenInstanceKey,
      users.testUser1.identityKey
    )
  )
);
```

#### 4. Testing Batch Burns

```typescript
const burn1 = { tokenInstanceKey, quantity: new BigNumber('1') };
const burn2 = { tokenInstanceKey, quantity: new BigNumber('2') };

const dto = await createValidSubmitDTO(BurnTokensDto, {
  tokenInstances: [burn1, burn2]
}).signed(privateKey);

const response = await contract.BurnTokens(ctx, dto);
// Verify combined burn quantity
expect(tokenBurn.quantity).toEqual(new BigNumber('3'));
```

#### Key Testing Points

1. **State Setup**:
   - Initialize token class, instance, and balance
   - Set up proper allowances if testing permissioned burns
   - Configure initial token balances

2. **Validation Testing**:
   - Test decimal limits
   - Test insufficient balances
   - Test missing or invalid allowances
   - Test NFT burn restrictions

3. **State Changes**:
   - Verify token balance updates
   - Check TokenBurn record creation
   - Validate TokenBurnCounter updates
   - Ensure transaction atomicity

4. **Error Handling**:
   - Test all relevant error conditions
   - Verify error messages and types
   - Ensure no state changes on errors

Remember to use the SDK's built-in test utilities (`fixture`, `writesMap`) and helper functions to make your tests more readable and maintainable.