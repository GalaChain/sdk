# Identity Management in GalaChain

## Overview

GalaChain implements an identity management system that combines blockchain-native identities with Ethereum-compatible wallets. This system provides secure authentication, role-based authorization, and flexible identity resolution.

## Core Concepts

### User Identities

In GalaChain, users can be identified in multiple ways:

1. **User Alias**: A unique identifier in the format `scheme|value`
   ```typescript
   // Examples
   "eth|0x123...def"  // Ethereum address (with crc, some chars upper-case)
   "client|admin"       // Legacy client user
   ```

2. **Ethereum Address**: Users can be identified by their Ethereum wallet address
   ```typescript
   "0x123...def"  // Will be normalized and converted to eth|0x123...def
   ```

### Public Key Infrastructure

GalaChain maintains a public key infrastructure (PKI) through the `PublicKeyContract`:

```typescript
// Register a new user with their public key
await publicKeyContract.RegisterUser(ctx, {
  publicKey: "0x...",
  alias: "eth|0x123...def",
  roles: ["SUBMIT", "EVALUATE"] // Default roles
});
```

### Role-Based Access Control

GalaChain SDK 2.0 introduced a comprehensive role-based authorization system:

1. **Default Roles**:
   - `SUBMIT`: Allows submitting transactions that modify state
   - `EVALUATE`: Allows querying the blockchain state

2. **Custom Roles**:
   ```typescript
   @Submit({
     allowedRoles: ["CURATOR", "ADMIN"]
   })
   async privilegedOperation(ctx: GalaChainContext, dto: OperationDto) {
     // Only users with CURATOR or ADMIN role can execute this
   }
   ```

### Transaction Signing

All state-modifying operations require digital signatures:

```typescript
// Create and sign a transaction
const dto = await createValidDTO(MintTokenDto, {
  // ... dto parameters
}).signed(privateKey);

// The contract verifies the signature
@GalaTransaction({
  verifySignature: true,
  in: MintTokenDto
})
async mintToken(ctx: GalaChainContext, dto: MintTokenDto) {
  // Signature is automatically verified
  // ctx.callingUser contains the verified user identity
}
```

## Identity Resolution

GalaChain provides flexible identity resolution through the `resolveUserAlias` service:

```typescript
// Different ways to reference the same user
const ethAddress = "0x123...def";
const userAlias = "eth|0x123...def";

// Both resolve to the same user identity
const alias1 = await resolveUserAlias(ctx, ethAddress);
const alias2 = await resolveUserAlias(ctx, userAlias);
assert(alias1 === alias2);
```

## User Profiles

User information is stored in profiles that contain:

- Public key(s)
- Roles and permissions
- Identity aliases
- Additional metadata

```typescript
interface UserProfile {
  alias: UserAlias;        // Primary identifier
  ethAddress?: string;     // Ethereum address, provide either eth or ton address
  tonAddress?: string;     // TON address, provide either eth or ton address
  roles: string[];         // Assigned roles
  // ... other fields
}

interface PublicKey {
  publicKey: string;
  public signing?: SigningScheme; // "ETH" or "TON"
}
```

## Best Practices

1. **Role Management**:
   - Define clear role hierarchies
   - Use specific roles for privileged operations
   - Regularly audit role assignments

2. **Signature Verification**:
   - Always require signatures for state changes
   - Use `@Submit` with `verifySignature: true`
   - Validate signatures before processing transactions

3. **Identity Resolution**:
   - Use `resolveUserAlias` for consistent identity handling
   - Store normalized user aliases
   - Handle both Ethereum and system identities

4. **Security**:
   - Never expose private keys
   - Implement key rotation policies
   - Monitor for suspicious activity

## Migration from Legacy Authentication

GalaChain 2.0 removed support for legacy Certificate Authority (CA) authentication:

1. All transactions must now be signed with user private keys
2. DER signatures without public key recovery are no longer supported
3. Previously unauthenticated endpoints now require signatures or explicit user parameters

For detailed migration steps, refer to the [Breaking Changes Documentation](https://github.com/galachain/galachain-sdk/blob/main/BREAKING_CHANGES.md).
