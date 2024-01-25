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

set -eu

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
current_dir="$(pwd)"
skip_confirmation_flag="${1:-}"

echo "The script (1) packs all npm packages from source, (2) puts the tar archives in current directory, and (3) replaces dependencies in current package.json to packed packages.
  - source directory:  $script_dir
  - current directory: $current_dir"

if [ "$skip_confirmation_flag" != "--skipConfirmation" ]; then
  echo "Do you want to proceed? (y/n)"
  read -r proceed

  if [ "$proceed" != "y" ]; then
    echo "Aborting."
    exit 1
  fi
fi

to_install=()

replace_in_pwd_package_json() {
  path="$1"
  package="$2"
  package_escaped="${package//\//\\/}"

  echo "Packing and replacing $package..."

  # pack the package
  tar_file="$( (cd "$path" && npm run build && npm pack --pack-destination="$current_dir") | tail -n 1)"

  # update package json with reference to the file
  updated_package_json="$(sed "s/\"$package_escaped\": \"[^\"]*\"/\"$package_escaped\": \"file:$tar_file\"/g" < "$current_dir/package.json")"
  echo "$updated_package_json" > "$current_dir/package.json"

  to_install+=("file:$tar_file")
}

# note: the order of packages is important
replace_in_pwd_package_json "$script_dir/chain-api" "@gala-chain/api"
replace_in_pwd_package_json "$script_dir/chain-client" "@gala-chain/client"
replace_in_pwd_package_json "$script_dir/chain-test" "@gala-chain/test"
replace_in_pwd_package_json "$script_dir/chaincode" "@gala-chain/chaincode"
replace_in_pwd_package_json "$script_dir/chain-cli" "@gala-chain/cli"

# we need to install it at the end, because they are cross-dependent
npm i --no-cache "${to_install[@]}"

echo ""
echo "Done. Installed packages:"
for package in "${to_install[@]}"; do
  echo " - $package"
done
echo ""