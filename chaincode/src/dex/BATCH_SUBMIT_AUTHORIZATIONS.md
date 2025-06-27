# Batch Submit Authorizations

This document describes the batch submit authorization system for the DexV3Contract.

## Overview

The batch submit authorization system allows fine-grained control over which users can call the `BatchSubmit` method in the DexV3Contract. This replaces the previous hardcoded organization-based authorization with a flexible user-based system.

## Chain Object

### BatchSubmitAuthorizations

The `BatchSubmitAuthorizations` chain object stores the list of users authorized to perform batch submit operations.

- **INDEX_KEY**: `"GCBSA"` (GalaChain Batch Submit Authorizations)
- **Properties**:
  - `authorities: string[]` - Array of user identifiers authorized to call BatchSubmit

## Methods

### AuthorizeBatchSubmitter

**Method**: `AuthorizeBatchSubmitter`  
**Type**: Submit  
**Access**: CuratorOrg MSP members + existing authorized users

Adds new users to the batch submit authorization list.

**Parameters**:
- `authorizers: string[]` - Array of user identifiers to authorize

**Returns**:
- `BatchSubmitAuthorizationsResDto` - Updated list of authorized users

### DeauthorizeBatchSubmitter

**Method**: `DeauthorizeBatchSubmitter`  
**Type**: Submit  
**Access**: CuratorOrg MSP members + existing authorized users

Removes users from the batch submit authorization list.

**Parameters**:
- `authorizer: string` - User identifier to deauthorize

**Returns**:
- `BatchSubmitAuthorizationsResDto` - Updated list of authorized users

**Note**: Cannot remove the last authorized user to prevent complete lockout.

### GetBatchSubmitAuthorizations

**Method**: `GetBatchSubmitAuthorizations`  
**Type**: Evaluate  
**Access**: Public

Retrieves the current list of authorized users.

**Parameters**: None

**Returns**:
- `BatchSubmitAuthorizationsResDto` - Current list of authorized users

## Authorization Flow

1. **Initial Setup**: When the system is first used, the calling user becomes the first authorized user
2. **Adding Users**: Existing authorized users can add new users to the authorization list
3. **Removing Users**: Existing authorized users can remove other users (but not the last one)
4. **BatchSubmit Check**: Before executing batch operations, the system checks if the calling user is in the authorized list

## Usage Examples

### Authorizing a New User

```typescript
const dto = new AuthorizeBatchSubmitterDto();
dto.authorizers = ["user1", "user2"];

const result = await contract.AuthorizeBatchSubmitter(ctx, dto);
console.log("Authorized users:", result.authorities);
```

### Deauthorizing a User

```typescript
const dto = new DeauthorizeBatchSubmitterDto();
dto.authorizer = "user1";

const result = await contract.DeauthorizeBatchSubmitter(ctx, dto);
console.log("Remaining authorized users:", result.authorities);
```

### Checking Current Authorizations

```typescript
const dto = new FetchBatchSubmitAuthorizationsDto();
const result = await contract.GetBatchSubmitAuthorizations(ctx, dto);
console.log("Current authorized users:", result.authorities);
```

## Security Considerations

1. **Initial Access**: The first user to interact with the system becomes authorized
2. **CuratorOrg Override**: CuratorOrg MSP members can always manage authorizations
3. **Last User Protection**: The system prevents removal of the last authorized user
4. **Audit Trail**: All authorization changes are recorded on the blockchain

## Migration from Previous System

The new system replaces the hardcoded `allowedOrgs: [process.env.CURATOR_ORG_MSP ?? "CuratorOrg"]` check with a dynamic user-based authorization system. CuratorOrg members retain the ability to manage authorizations while allowing for more granular control over batch submit access. 