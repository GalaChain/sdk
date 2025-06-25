# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

This is a monorepo managed with Nx. Use these commands for development:

### Build Commands
- `npm run build` - Build all packages using Nx
- `nx run-many -t build` - Alternative build command
- `nx build <package-name>` - Build specific package (e.g., `nx build chain-api`)

### Testing Commands
- `npm test` - Run all tests across packages
- `nx run-many -t test` - Alternative test command
- `nx test <package-name>` - Run tests for specific package
- `npm run update-snapshot` - Update Jest snapshots (in chaincode package)

### Linting and Code Quality
- `npm run lint` - Lint all packages
- `npm run fix` - Auto-fix linting issues
- `nx run-many -t lint` - Alternative lint command
- `npm run madge` - Check for circular dependencies
- `nx run-many -t madge` - Alternative command for circular dependencies check

### Individual Package Commands
Each package has its own commands. Key patterns:
- `cd <package-dir> && npm run build` - Build individual package
- `cd <package-dir> && npm test` - Test individual package
- `cd <package-dir> && npm lint|fix|madge` - Code quality checks commands for individual package
- `cd <package-dir> && npm run prepublishOnly` - Full package validation

### CLI Development
- `cd chain-cli && npm run build` - Build CLI with network files and templates
- `./bin/run <command>` - Run CLI commands locally (from chain-cli dir)

## Architecture Overview

GalaChain SDK is a TypeScript monorepo for blockchain development on Hyperledger Fabric. Key architecture components:

### Package Structure
- **chain-api** (`@gala-chain/api`) - Core types, DTOs, validation, signatures, and utilities
- **chaincode** (`@gala-chain/chaincode`) - Chaincode framework with contract base classes and business logic
- **chain-client** (`@gala-chain/client`) - Client libraries for interacting with chaincodes
- **chain-connect** (`@gala-chain/connect`) - High-level client APIs and wallet integration
- **chain-test** (`@gala-chain/test`) - Testing utilities and mocks for chaincode testing
- **chain-cli** (`@gala-chain/cli`) - CLI tool for chaincode development and deployment

### Core Concepts
- **GalaContract**: Base class for all chaincodes, extends Hyperledger Fabric Contract
- **Chain Objects**: Validated data objects stored on blockchain (extend ChainObject)
- **DTOs**: Data Transfer Objects for API communication with validation decorators
- **GalaChainContext**: Extended chaincode context with additional utilities
- **Authentication**: Support for multiple signature types (secp256k1, ED25519, Ethereum, TON)

### Key Functional Areas
The chaincode package is organized by business domains:
- **allowances** - Token spending permissions and allowance management
- **balances** - Token balance tracking and queries
- **burns** - Token burning operations
- **fees** - Fee calculation, authorization, and payment processing
- **loans** - Loan offers and management
- **locks** - Token locking mechanisms
- **mint** - Token minting with configurations and allowances
- **oracle** - Price oracle management and assertions
- **sales** - Token marketplace functionality
- **swaps** - Token swap operations
- **transfer** - Basic token transfer operations
- **vesting** - Token vesting schedules

### Client Architecture
- **Rest API clients** - HTTP-based chaincode interaction
- **Hyperledger Fabric clients** - Direct fabric network communication
- **Browser/Wallet integration** - Web3 wallet connectivity
- **Signing abstractions** - Multiple signature scheme support

### Testing Strategy
- **Unit tests** - Use GalaChain test utilities and mocks
- **Integration tests** - Full chaincode testing with TestClients
- **E2E tests** - End-to-end scenarios with network simulation

## Development Patterns

### Adding New Chaincode Functionality
1. Define DTOs in chain-api with validation decorators
2. Implement business logic functions in chaincode package
3. Add methods to appropriate contract class
4. Write comprehensive tests
5. Update client APIs if needed

### Testing Chaincode
- Use `TestChaincode` and `TestChaincodeStub` for unit tests
- Use `ContractTestClient` for integration testing
- Use `TestClients` for full e2e testing scenarios
- All business logic should be testable independently of Fabric

#### @gala-chain/test Module Overview
The `chain-test` package provides comprehensive testing utilities for GalaChain development:

**Unit Testing Infrastructure:**
- `TestChaincode` - In-memory chaincode execution for unit tests
- `TestChaincodeStub` - Mock Hyperledger Fabric stub with state management
- `TestClients` - Factory for creating test clients with different configurations
- `MockedChaincodeClient` - Fully mocked chaincode client for isolated testing

**Test Data Factories:**
- `currency` - Pre-configured test data for fungible tokens
- `nft` - Pre-configured test data for non-fungible tokens  
- `users` - Standard test user accounts and identities
- Custom test data utilities and helpers

**Integration Testing Support:**
- `ContractTestClient` - Creates clients for different organizations (Curator, Users, Partner)
- Supports multiple connection types: Hyperledger Fabric, REST API, or mocked
- Automatic environment configuration with fallback defaults

**Common Usage Patterns:**
```typescript
// Unit testing with fixture
const { ctx, contract, getWrites } = fixture(MyContract)
  .registeredUsers(user1, user1)
  .savedState(obj1, obj2);
const result = await contract. MyMethod(ctx, dto);

// Unit testing with TestChaincode
const testChaincode = new TestChaincode([MyContract]);
const result = await testChaincode.invoke("MyMethod", dto);

// E2E testing with TestClients
const clients = await TestClients.createForAdmin();
const user = await clients.createRegisteredUser();
const response = await clients.assets.CreateTokenClass(dto);

// Integration testing with custom configuration
const customClients = await TestClients.create({
  myContract: { channel: "ch", chaincode: "cc", contract: "MyContract", api: myAPI }
});
```

### Error Handling
- Extend appropriate error classes (ChainError, ValidationFailedError, etc.)
- Use proper error codes and structured error responses
- Ensure errors are properly serialized for client consumption

## Key Files and Patterns

### Chaincode Entry Points
- `chaincode/src/contracts/GalaContract.ts` - Base contract class
- `chaincode/src/contracts/PublicKeyContract.ts` - User profiles, roles, registration and public key management
- Individual functional contracts extend GalaContract

### API Definitions
- `chain-api/src/types/` - Core data types and DTOs
- All DTOs use class-validator decorators for validation
- API methods defined with proper TypeScript interfaces

### Client Usage
- Import from published packages: `@gala-chain/api`, `@gala-chain/client`, etc.
- Use TypeScript for full type safety
- Follow established patterns for REST API and Fabric client usage

## Testing Strategy

### Unit Tests
- Jest with TypeScript support
- Test files: `*.spec.ts` pattern

### Test Structure Convention
All tests should follow the Given/When/Then structure with concise comments:

```typescript
it("should do something meaningful", () => {
  // Given
  const testData = createTestSetup();
  
  // When
  const result = performAction(testData);
  
  // Then
  expect(result).toBe(expectedValue);
});
```

**Guidelines:**
- Use `// Given` for test setup and preconditions
- Use `// When` for the action being tested
- Use `// Then` for assertions and expected outcomes
- Use `// When & Then` for simple validation tests where setup and assertion are minimal
- Keep comments concise - avoid explanatory text that restates the code
- Add contextual comments only when the scenario or expectation is non-obvious
