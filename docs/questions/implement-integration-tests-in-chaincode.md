### Question


How can I implement integration tests for chaincode?


### Answer


GalaChain uses end-to-end (e2e) tests to verify chaincode behavior against a running chaincode instance. Here's how to implement effective integration tests:

1. Setting Up E2E Tests:
```typescript
// In your e2e test directory
import { ChainClient, TestUser } from '@gala-chain/client';
import { GalaChainResponse } from '@gala-chain/api';

describe('Token Operations E2E', () => {
  let client: ChainClient;
  let admin: TestUser;
  let user1: TestUser;

  beforeAll(async () => {
    // Connect to running chaincode
    client = await ChainClient.newClient();
    
    // Set up test users
    admin = await TestUser.newUser('admin');
    user1 = await TestUser.newUser('user1');
    
    // Register users with chaincode
    await client.registerUser(admin);
    await client.registerUser(user1);
  });
});
```

2. Testing Complete Workflows:
```typescript
it('should complete token lifecycle', async () => {
  // Create token class
  const createResponse = await client.submit(
    'TokenContract:CreateTokenClass',
    {
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 0
    },
    admin
  );
  expect(createResponse).toEqual(GalaChainResponse.Success());

  // Mint tokens
  const mintResponse = await client.submit(
    'TokenContract:MintTokens',
    {
      tokenClass: 'TEST',
      amount: '100',
      recipient: user1.identityKey
    },
    admin
  );
  expect(mintResponse).toEqual(GalaChainResponse.Success());

  // Query balance
  const balanceResponse = await client.evaluate(
    'TokenContract:GetBalance',
    {
      tokenClass: 'TEST',
      owner: user1.identityKey
    }
  );
  expect(balanceResponse.payload.amount).toEqual('100');
});
```

3. Testing Error Scenarios:
```typescript
it('should handle invalid operations', async () => {
  // Attempt to mint without permission
  const response = await client.submit(
    'TokenContract:MintTokens',
    {
      tokenClass: 'TEST',
      amount: '100',
      recipient: user1.identityKey
    },
    user1  // Non-admin user
  );
  
  expect(response).toEqual(
    GalaChainResponse.Error('UNAUTHORIZED')
  );
});
```

4. Testing State Changes:
```typescript
it('should update state correctly', async () => {
  // Get initial state
  const initialState = await client.evaluate(
    'TokenContract:GetState',
    { key: 'test-key' }
  );

  // Perform operation
  await client.submit(
    'TokenContract:UpdateState',
    { key: 'test-key', value: 'new-value' },
    admin
  );

  // Verify state change
  const updatedState = await client.evaluate(
    'TokenContract:GetState',
    { key: 'test-key' }
  );
  expect(updatedState).not.toEqual(initialState);
});
```

5. Testing Multi-User Scenarios:
```typescript
it('should handle concurrent users', async () => {
  const user2 = await TestUser.newUser('user2');
  await client.registerUser(user2);

  // Set up initial state
  await client.submit(
    'TokenContract:MintTokens',
    {
      tokenClass: 'TEST',
      amount: '100',
      recipient: user1.identityKey
    },
    admin
  );

  // Perform concurrent operations
  const [transfer1, transfer2] = await Promise.all([
    client.submit(
      'TokenContract:Transfer',
      {
        tokenClass: 'TEST',
        amount: '60',
        recipient: user2.identityKey
      },
      user1
    ),
    client.submit(
      'TokenContract:Transfer',
      {
        tokenClass: 'TEST',
        amount: '60',
        recipient: user2.identityKey
      },
      user1
    )
  ]);

  // Verify only one transfer succeeded
  expect(
    transfer1.isSuccess() && !transfer2.isSuccess() ||
    !transfer1.isSuccess() && transfer2.isSuccess()
  ).toBeTruthy();
});
```

Best Practices:
- Test against running chaincode
- Use ChainClient for interactions
- Test complete workflows
- Verify state changes
- Test multi-user scenarios

Key Points:
- Tests live in e2e directories
- Use @gala-chain/client
- Test real chaincode instances
- Verify actual state changes
- Test concurrent operations

Testing Tips:
- Clean up test data
- Use unique test identifiers
- Test error conditions
- Verify state consistency
- Document test scenarios