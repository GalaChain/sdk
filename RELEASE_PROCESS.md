# Release process for GalaChain SDK

This document outlines our release process for the GalaChain SDK Node.js package, ensuring a smooth workflow while adhering to Semantic Versioning (SemVer) principles.

[Semantic Versioning](https://semver.org/) is a widely adopted versioning scheme for software development that consists of three numbers separated by dots: `MAJOR.MINOR.PATCH`.

- **MAJOR**: Incremented when making incompatible API changes.
- **MINOR**: Incremented when adding functionality in a backward-compatible manner.
- **PATCH**: Incremented for backward-compatible bug fixes.

We typically aim to release new versions on Mondays, although the timing may vary depending on the readiness of the release and any relevant factors affecting the project.

## Before release

The current process of releasing a new version of the GalaChain SDK include a PR created by a bot (i.e. https://github.com/GalaChain/sdk/pull/242), which increments the version number (PATCH number) in the `package.json` file and all other necessary files. This PR should be merged before the release if you want to release this new version. So always check if the `package.json` in the main branch contains the correct version number.

Please check if there are any approved pull requests that can be easily merged and merge them. You may also want to consult merging if there are some PRs marked with a `breaking-change` tag.

By default we upgrade the PATCH version number, but if a given PR contains changes that should increment MINOR or MAJOR version number, then the upgrade should be made within the PR.
We have a NPM script for that: `npm run set-version X.Y.Z`.

It means, that in most cases you don't need to increment version just before the release, because it is either unneccessary, or already done.

## Create a release on GitHub

1. Check the new release version in [`package.json`](https://github.com/GalaChain/sdk/blob/main/package.json) file in the main branch. It contains the version number of the release.
2. Go to the ["New release" page](https://github.com/GalaChain/sdk/releases/new) on GitHub.
3. Provide a new tag using the format `vX.Y.Z` (`v` plus version from `package.json`). This format is required to trigger CI release jobs.
4. Click on "Generate release notes." It will create a list of all PRs merged recently in the release description field.
5. Provide a release name. It should start with the tag name (`vX.Y.Z`), because the version is not visible enough in the GitHub releases UI. After the tag, you may want to add an optional short highlight of the most notable changes.
7. Ensure "Set as a pre-release" is unchecked, and "Set as the latest release" is checked.
8. Click on the "Publish release" button.
9. The CI will handle publishing Node.js packages, publishing the CLI Docker image, and publishing the new version of docs. It will also increment PATCH version of the SDK on the main branch.
