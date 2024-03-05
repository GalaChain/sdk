# Release process for GalaChain SDK

This document outlines our release process for the GalaChain SDK Node.js package, ensuring a smooth workflow while adhering to Semantic Versioning (SemVer) principles.

[Semantic Versioning](https://semver.org/) is a widely adopted versioning scheme for software development that consists of three numbers separated by dots: `MAJOR.MINOR.PATCH`.

- **MAJOR**: Incremented when making incompatible API changes.
- **MINOR**: Incremented when adding functionality in a backward-compatible manner.
- **PATCH**: Incremented for backward-compatible bug fixes.

We typically aim to release new versions on Mondays, although the timing may vary depending on the readiness of the release and any relevant factors affecting the project.

## Before release

Please check if there are any approved pull requests that can be easily merged and merge them. You may also want to consult merging if there are some PRs marked with a `breaking-change` tag.

## Create a release on GitHub

1. Go to the ["New release" page](https://github.com/GalaChain/sdk/releases/new) on GitHub.
2. Provide a new tag using the format `vX.Y.Z`.
3. Click on "Generate release notes." It will create a list of all PRs merged recently in the release description field.
4. Revisit the list of merged PRs and adjust the tag name appropriately (for instance, maybe instead of a patch release, it should be a minor release because there were some new features).
5. Provide a release name. It should start with the tag name (`vX.Y.Z`), because the version is not visible enough in the GitHub releases UI. After the tag, you may want to add an optional short highlight of the most notable changes.
6. Ensure "Set as a pre-release" is unchecked, and "Set as the latest release" is checked.
7. Click on the "Publish release" button.
8. The CI will handle setting the SDK version number from the tag name, publishing Node.js packages, publishing the CLI Docker image, and publishing the new version of docs.
