# Smart Contracts and Chaincode

## Understanding the Terminology

In GalaChain and Hyperledger Fabric, the terms "smart contract" and "chaincode" are often used interchangeably, but they have slightly different technical meanings:

- **Chaincode** is the broader term for the entire application-level code deployed to the blockchain network. It's Hyperledger Fabric's implementation of smart contracts.
  
- **Smart Contracts** are specific business logic components within the chaincode that define the rules and conditions for interacting with the blockchain.

## GalaChain Contract Structure

In GalaChain, contracts are TypeScript classes that extend `GalaContract`. Each contract class encapsulates related functionality and is decorated with transaction annotations that define how the blockchain network processes them.

### Sample Contracts

Let's look at the three main contracts in the sample chaincode template:

_(note: some code is hidden for brevity, please refer to actual files and implementations for full technical details)_

#### 1. Apple Contract (Business Logic Example)

```typescript
export class AppleContract extends GalaContract {
  constructor() {
    super("AppleContract", version);
  }

  @Submit({
    in: PlantAppleTreeDto
  })
  public async PlantTree(ctx: GalaChainContext, dto: PlantAppleTreeDto): Promise<void> {
    await plantTree(ctx, dto);
  }

  @Evaluate({
    in: FetchTreesDto,
    out: PagedTreesDto
  })
  public async FetchTrees(ctx: GalaChainContext, dto: FetchTreesDto): Promise<PagedTreesDto> {
    return await fetchTrees(ctx, dto);
  }
}
```

The `AppleContract` demonstrates:
- Simple business logic implementation
- Transaction decorators (`@Submit` and `@Evaluate`)
- Data Transfer Objects (DTOs) for input/output validation

#### 2. Public Key Contract (Identity Management)

The Public Key (PK) contract is a foundational component imported from `@gala-chain/chaincode`. It provides essential identity and security features:

```typescript
import { PublicKeyContract } from "@gala-chain/chaincode";

// The contract is ready to use with built-in identity management
export { PublicKeyContract };
```

Key responsibilities:
- Managing the public key infrastructure (PKI)
- Verifying digital signatures for transactions
- Maintaining identity relationships between users and their public keys
- Handling key rotation and revocation
- Supporting delegated signing authority

#### 3. GalaChain Token Contract (Asset Management)

```typescript
export class GalaChainTokenContract extends GalaContract {
  constructor() {
    super("GalaChainToken", version);
  }

  @Submit({
    in: CreateTokenClassDto
  })
  public async CreateTokenClass(ctx: GalaChainContext, dto: CreateTokenClassDto): Promise<TokenClassKey> {
    // Implementation
  }

  @Submit({
    in: MintTokenDto
  })
  public async MintToken(ctx: GalaChainContext, dto: MintTokenDto): Promise<TokenInstanceKey[]> {
    // Implementation
  }

  @Evaluate({
    in: FetchBalancesDto
  })
  public async FetchBalances(ctx: GalaChainContext, dto: FetchBalancesDto): Promise<TokenBalance[]> {
    // Implementation
  }
}
```

The `GalaChainTokenContract` provides:
- Token lifecycle management (creation, minting, burning)
- Balance tracking and queries
- Transfer and allowance mechanisms
- Fee schedules and vesting functionality

## Key Concepts

### 1. Transaction Types

GalaChain supports two types of transactions:

- **@Submit** - Modifies the world state; requires consensus
  ```typescript
  @Submit({
    in: PlantAppleTreeDto
  })
  public async PlantTree(ctx: GalaChainContext, dto: PlantAppleTreeDto): Promise<void>
  ```

- **@Evaluate** - Read-only operations; no consensus needed
  ```typescript
  @Evaluate({
    in: FetchTreesDto,
    out: PagedTreesDto
  })
  public async FetchTrees(ctx: GalaChainContext, dto: FetchTreesDto): Promise<PagedTreesDto>
  ```

### 2. Context and DTOs

- **GalaChainContext**: Provides access to the blockchain state and utilities
- **Data Transfer Objects (DTOs)**: Define the structure and validation of input/output data

### 3. Contract Organization

Contracts should be organized by domain:
- Group related functionality together
- Keep contracts focused and single-purpose
- Use descriptive names that reflect the business domain

## Best Practices

1. **Use Decorators**: Always use `@Submit` or `@Evaluate` to clearly indicate transaction type

2. **Input Validation**: Define comprehensive DTOs with validation rules

3. **Error Handling**: Use specific error types for different failure scenarios

4. **Modularity**: Split complex contracts into smaller, focused components

5. **Documentation**: Document contract methods with clear descriptions and examples

## Chaincode and the Ledger

Chaincode interacts with Hyperledger Fabric's ledger, which consists of two distinct components:

### World State

- A key-value store holding the current state
- Modified through `@Submit` transactions
- Accessed through `ctx.stub` methods in chaincode
- Changes are atomic and only persist on successful transaction completion

### Transaction Log

- Immutable record of all transactions
- Each block contains multiple transactions
- Automatically maintained by the blockchain
- Used to validate and derive the World State

Example of how chaincode interacts with both components:

```typescript
@Submit({
  in: PlantAppleTreeDto
})
public async PlantTree(ctx: GalaChainContext, dto: PlantAppleTreeDto): Promise<void> {
  // 1. World State: Create new tree entry
  await plantTree(ctx, dto);
  
  // 2. Transaction Log: Automatically records this operation
  // - Transaction details
  // - Timestamp
  // - Signatures
  // - State changes
}
```

## Implementation Strategy

When implementing new chaincode:

1. Start with clear business requirements
2. Design your data model using Chain Objects
3. Create appropriate DTOs for input/output
4. Implement contract methods with proper decorators
5. Add comprehensive unit tests
6. Document all public interfaces
7. Remember: It's very hard to migrate data once it is saved on chain. Invest in your designs and data modeling up front to avoid this problem!
