# Breaking Changes in GalaChain SDK Major Releases

## Introduction

Welcome to the breaking changes documentation for GalaChain SDK major releases.
This document outlines the significant changes that may affect users upgrading to a new major version of the library.
These changes are considered breaking as they may require modifications to existing codebases to maintain compatibility.

By following this documentation, users can effectively manage the upgrade process and ensure smooth transitions to newer versions of the GalaChain SDK.
If you have any questions or need further assistance, please refer to the GalaChain SDK documentation or reach out to the community for support.

## Version 2.0.0

The version contains various breaking changes in terms of how authorization is handled, how transactions are signed, and how the API is structured.
However, it is backward compatible with the previous version in terms of the current chaincode state.
The changes are mostly related to the way the SDK is used and how the chaincode is structured.
If you have current production chain, you don't need to update the data, but you may need to update the code to be compatible with the new version.
The only exception is the authorization, which requires a migration of the roles from `allowedOrgs` to `allowedRoles`, and setting up the roles for some user profiles.

### Removal of Deprecated Features
- `createAndSignValidDTO` was removed in favor of `createValidDTO(...).signed(...)`.

### Changes to API Contracts

#### Different way of handling authorization

Since 2.0.0 we support role-based auth, described in detail here, and we changed how `@GalaTransaction`, `@Submit`, and `@Evaluate` handle transactions.
The most important breaking change is that all methods that update the chain need to be signed.
We no longer support writing to the chain without a signature.

Please, ensure that all methods that update the chain are signed (`@GalaTransaction` has `verifySignature: true` property, or `@Submit`, or `@Evaluate` is used, which enforce signature verification).

Additionally, we deprecated `allowedOrgs` property in decorator in favor of `allowedRoles` only, and encourage users to migrate to the new approach.
As a backward compatibility measure, we still support `allowedOrgs` for now, but we don't allow to combine `allowedOrgs` and `allowedRoles` in the same decorator.

The migration steps from `allowedOrgs` to `allowedRoles` are as follows:
1. Verify which users should have access to the method, and what roles they should have.
   For instance, if you have a curator-like organization for privileged access, like `allowedOrgs: ["CuratorOrg"]`, you may want to designate a `CURATOR` role and assign it to the users.
2. Assign roles to the users, using the `PublicKeyContract:UpdateUserRoles` method.
   You need to provide the full list of roles for the user, as the method replaces the existing roles with the new ones.
3. Ensure that your custom client code for user registration assigns the correct roles.
   Registration methods from the `PublicKeyContract` assign `EVALUATE` and `SUBMIT` as default roles, but you may want additional ones.
4. Update the contract method decorators to use `allowedRoles` instead of `allowedOrgs`.

Probably for most users you won't need to do anything, as the default roles are `EVALUATE` and `SUBMIT`, which are sufficient for calling methods with no `allowedRoles` specified.

You may want to consult our acceptance test for migration from `allowedOrgs` to `allowedRoles` for more details, see [PublicKeyContract.migration.spec.ts](chaincode/src/contracts/PublicKeyContract.migration.spec.ts).

#### API changes for unit tests with `fixture` utility

Starting from version `2.0.0`:
- Test data for `users` contains full user objects with roles, not just user aliases (identity keys).
- User field `identityKey` was renamed to `alias` for clarity.
- We recommend using signature-based authentication and authorization for all transactions, which requires signing the DTOs with the user's private key.

Sample usage of `fixture` for testing transactions:

Using the previous version (`1.x.x`):

```typescript
const { ctx, contract, writes } = fixture(GalaChainTokenContract)
  .callingUser(users.testUser1Id)
  .savedState(nftClass, nftInstance, balance);

const dto = await createValidDTO(LockTokenDto, { ... });

const response = await contract.LockToken(ctx, dto);
```

After upgrade to `2.0.0`:
```typescript
const { ctx, contract, getWrites } = fixture(GalaChainTokenContract)
  .registeredUsers(users.testUser1)
  .savedState(nftClass, nftInstance, balance);

const dto = await createValidSubmitDTO(LockTokenDto, { ... })
  .signed(users.testUser1.privateKey);

const response = await contract.LockToken(ctx, dto);
```

The main difference between the old CA-based auth and the new signature-based auth is that instead of using the user's CA (Certificate Authority) identity, we use the user's public key that is recovered from the DTO (Data Transfer Object) and the signature.
We use the public key as a unique identifier of the user.

In the previous flow we were using `callingUser` to set the user, and the user was identified by the CA identity.
In the new flow we use `registeredUsers` to save relevant `UserProfile` objects in the mocked chain state, and the user is authenticated on the basis of the signature.
This is why in the code for the new version we use `signed` to sign the DTO with the user's private key.

Additionally, `writes` property was changed to `allWrites`, and we recommend to use a new `getWrites()` function, which returns the writes in the form of a dictionary, but skips low-level writes that are not relevant for the test.
By default, it skips the keys of `UniqueTransaction` objects, which are used for enforcing the `uniqueKey` field in the DTOs.
This behavior can be altered by providing custom `skipKeysStartingWith: string[]` parameter.

#### Enforcing dto.uniqueKey for each submit transactions

Starting from version `2.0.0` we enforce the `uniqueKey` field in each DTO that is used in `@Submit` or `@GalaTransaction({ type: SUBMIT })` methods.
This was done to prevent duplicate transactions from being submitted to the chain, and from the replay attacks.
Once you submit a DTO with missing `uniqueKey`, the SDK will throw a validation error.
Once you submit a DTO with a `uniqueKey` that was already used, the SDK will throw a conflict error.

It is recommended to use `@Submit` decorator for all transactions that update the chain, as it enforces the signature verification, and the `uniqueKey` field in the DTOs by enforcing `SubmitCallDTO` as parent DTO class.

In order to make the creation of the `uniqueKey` easier, we added additional method for creating DTOs with `uniqueKey`, aside from the `createValidDTO` method and with similar syntax:

```typescript
const dto = await createValidSubmitDTO(DtoClass, { ... }).signed(...);
```

Additionally, we added a utility method for creating a unique key, which can be used in the DTOs:

```typescript
const uniqueKey = createUniqueKey();
```


### Other Breaking Changes
- TBD

## Template: Version A.B.C

<i>Repeat the structure for each major release, documenting the breaking changes specific to that version. Update this document on each PR that makes breaking changes.</i>

### Removal of Deprecated Features
- Description of the deprecated features that have been removed in this release.
- Guidance on alternatives or migration paths for affected users.

### Changes to API Contracts
- Description of any changes to existing API contracts that may impact users.
- Guidance on updating code to accommodate the new API.

### Dependency Updates
- List of updated dependencies and any potential compatibility issues.
- Instructions for resolving dependency conflicts or compatibility issues.

### Other Breaking Changes
- Any additional breaking changes not covered in the above categories.
- Guidance on how to address these changes in user code.