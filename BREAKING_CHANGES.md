# Breaking Changes in GalaChain SDK Major Releases

## Introduction

Welcome to the breaking changes documentation for GalaChain SDK major releases.
This document outlines the significant changes that may affect users upgrading to a new major version of the library.
These changes are considered breaking as they may require modifications to existing codebases to maintain compatibility.

By following this documentation, users can effectively manage the upgrade process and ensure smooth transitions to newer versions of the GalaChain SDK.
If you have any questions or need further assistance, please refer to the GalaChain SDK documentation or reach out to the community for support.

## Version 2.0.0

### Removal of Deprecated Features
*none*

### Changes to API Contracts

#### Different way of handling authorization

Since 2.0.0 we support role-based auth, described in detail here, and we changed how `@GalaTransaction`, `@Submit`, and `@Evaluate` handle transactions.
The most important breaking change is that all methods that update the chain need to be signed.
We no longer support writing to the chain without a signature.

Please, ensure that all methods that update the chain are signed (`@GalaTransaction` has `verifySignature: true` property, or `@Submit`, or `@Evaluate` is used, which enforce signature verification).

Additionally, we deprecated `allowedOrgs` property in decorator in favor of `allowedRoles` only, and encourage users to migrate to the new approach.
As a backward compatibility measure, we still support `allowedOrgs` for now, but we don't allow to combine `allowedOrgs` and `allowedRoles` in the same decorator.

This the migration steps from `allowedOrgs` to `allowedRoles` are as follows:
1. Verify which users should have access to the method, and what roles they should have.
   For instance, if you have a curator-like organization for privileged access, like `allowedOrgs: ["CuratorOrg"]`, you may want a `CURATOR` role and assign it to the users.
2. Assign roles to the users, using `PublicKeyContract:UpdateUserRoles` method.
   You need to provide the full list of roles for the user, as the method replaces the existing roles with the new ones.
3. Ensure that your custom client code for user registration assigns the correct roles.
   Registration methods from `PublicKeyContract` assign `EVALUATE` and `SUBMIT` as default roles, but you may want additional ones.
4. Update the contract method decorators to use `allowedRoles` instead of `allowedOrgs`.

Probably for most users you won't need to do anything, as the default roles are `EVALUATE` and `SUBMIT`, which are sufficient for calling methods with no `allowedRoles` specified.

You may want to consult our acceptance test for migration from `allowedOrgs` to `allowedRoles` for more details, see [PublicKeyContract.migration.spec.ts](chaincode/src/contracts/PublicKeyContract.migration.spec.ts).

#### Enforcing dto.uniqueKey for each submit transactions
*TBD*

#### Other
- Different way of providing calling user in unit tests.
- Field `uniqueKey` in contract method DTOs is now mandatory. https://github.com/GalaChain/sdk/issues/27

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
