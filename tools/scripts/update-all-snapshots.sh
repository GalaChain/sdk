#!/usr/bin/env bash

set -eu pipefail

SDK_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SDK_VERSION=$(jq -r '.version' "$SDK_HOME/package.json")

pushd "$SDK_HOME"

echo "Building and linting all packages"
npm run build
npm run fix

echo "Testing and updating snapshots of all packages"
npm run test -- -u

pushd "chain-cli/chaincode-template"

echo "Packing all packages for chain-cli/chaincode-template"
../../npm-pack-and-replace.sh --skipConfirmation

echo "Building and linting chain-cli/chaincode-template"
npm run build
npm run fix

echo "Testing and updating snapshots of chain-cli/chaincode-template"
npm run test -- -u
npm run test:e2e-mocked -- -u

popd

echo "Cleaning up versions"
./unifyVersions.js "$SDK_VERSION"