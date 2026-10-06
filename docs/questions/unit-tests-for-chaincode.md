### Question


How do I write unit tests for chaincode?


### Answer


GalaChain provides a robust testing framework that makes it easy to write unit tests for chaincode. Here's how to write effective tests:

1. Basic Test Structure:
```typescript
import { GalaChainResponse, createValidSubmitDTO } from '@gala-chain/api';
import { fixture, users, writesMap } from '@gala-chain/test';
import GalaChainTokenContract from '../__test__/GalaChainTokenContract';

describe('MyChaincode', () => {
  it('should perform an operation', async () => {
    // Given
    const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
      .registeredUsers(users.testUser1)
      .savedState(/* initial state objects */);

    const dto = await createValidSubmitDTO(MyOperationDto, {
      // operation parameters
    }).signed(users.testUser1.privateKey);

    // When
    const response = await contract.MyOperation(ctx, dto);

    // Then
    expect(response).toEqual(GalaChainResponse.Success([/* expected result */]));
    expect(getWrites()).toEqual(writesMap(/* expected state changes */));
  });
});
```

2. Testing State Changes:
```typescript
import { TokenBalance, TokenInstance } from '@gala-chain/api';

it('should update token balance', async () => {
  // Given
  const tokenInstance = await createValidChainObject(TokenInstance, {
    owner: users.testUser1.identityKey,
    // other token properties
  });

  const initialBalance = new TokenBalance({
    owner: users.testUser1.identityKey,
    quantity: new BigNumber('100')
  });

  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .savedState(tokenInstance, initialBalance);

  // When
  const response = await contract.TransferToken(ctx, transferDto);

  // Then
  const expectedBalance = new TokenBalance({
    owner: users.testUser1.identityKey,
    quantity: new BigNumber('50')
  });

  expect(getWrites()).toEqual(writesMap(expectedBalance));
});
```

3. Testing Error Cases:
```typescript
it('should fail with insufficient balance', async () => {
  // Given
  const balance = new TokenBalance({
    owner: users.testUser1.identityKey,
    quantity: new BigNumber('10')
  });

  const { ctx, contract } = fixture(GalaChainTokenContract)
    .savedState(balance);

  const dto = await createValidSubmitDTO(TransferDto, {
    amount: new BigNumber('20')
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.Transfer(ctx, dto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new InsufficientBalanceError(
        users.testUser1.identityKey,
        new BigNumber('20'),
        new BigNumber('10')
      )
    )
  );
});
```

4. Testing Validation:
```typescript
it('should validate input parameters', async () => {
  // Given
  const { ctx, contract } = fixture(GalaChainTokenContract);

  const invalidDto = await createValidSubmitDTO(MintTokenDto, {
    quantity: new BigNumber('-1')  // Invalid negative quantity
  }).signed(users.testUser1.privateKey);

  // When
  const response = await contract.MintToken(ctx, invalidDto);

  // Then
  expect(response).toEqual(
    GalaChainResponse.Error(
      new ValidationError(['quantity must be a positive number'])
    )
  );
});
```

5. Testing Complex Scenarios:
```typescript
it('should handle multiple operations in sequence', async () => {
  // Given
  const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
    .registeredUsers(users.testUser1, users.testUser2)
    .savedState(initialState);

  // When - First operation
  await contract.Operation1(ctx, dto1);
  const intermediateState = getWrites();

  // When - Second operation
  await contract.Operation2(ctx, dto2);
  const finalState = getWrites();

  // Then
  expect(intermediateState).toEqual(writesMap(expectedIntermediateState));
  expect(finalState).toEqual(writesMap(expectedFinalState));
});
```

Best Practices:
- Use descriptive test names
- Follow Given-When-Then pattern
- Test both success and error cases
- Verify state changes
- Test input validation

Key Points:
- Use fixture helper for setup
- Verify GalaChainResponse
- Check state modifications
- Test error conditions
- Validate complex workflows

Testing Tips:
- Mock external dependencies
- Test edge cases
- Group related tests
- Keep tests focused
- Use test utilities