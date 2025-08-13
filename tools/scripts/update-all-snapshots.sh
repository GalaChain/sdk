#!/usr/bin/env bash

#
# Copyright (c) Gala Games Inc. All rights reserved.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

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