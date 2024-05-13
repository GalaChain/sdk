# Breaking Changes in GalaChain SDK Major Releases

## Introduction

Welcome to the breaking changes documentation for GalaChain SDK major releases.
This document outlines the significant changes that may affect users upgrading to a new major version of the library.
These changes are considered breaking as they may require modifications to existing codebases to maintain compatibility.

By following this documentation, users can effectively manage the upgrade process and ensure smooth transitions to newer versions of the GalaChain SDK.
If you have any questions or need further assistance, please refer to the GalaChain SDK documentation or reach out to the community for support.

## Version 2.0.0

### Removal of Deprecated Features

- Removal of `allowedOrgs` marker
- Removal of legacy auth https://github.com/GalaChain/sdk/issues/176

### Changes to API Contracts
- Different way of handling authorization. Since 2.0.0 we support role-based auth, described in detail here (TBD link)
- Different way of providing calling user in unit tests.
- Field `uniqueKey` in contract method DTOs is now mandatory. https://github.com/GalaChain/sdk/issues/27

### Dependency Updates
- TBD

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
