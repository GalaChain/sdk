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

target_configtx="./fablo-target/fabric-config/configtx.yaml"
target_env="./fablo-target/fabric-docker/.env"
fablo_config=./fablo-config.json

echo "Creating old configtx.yaml file backup"
cp "$target_configtx" "$target_configtx.backup"

#
# Set MaxMessageCount to 1 and BatchTimeout to 1s
# (perl is a cross-platform solution instead of sed, see https://stackoverflow.com/questions/65384534)
echo "Updating MaxMessageCount and BatchTimeout"
perl -i -pe "s/MaxMessageCount: 10/MaxMessageCount: ${MAX_MESSAGE_COUNT:-1}/g" "$target_configtx"
perl -i -pe "s/BatchTimeout: 2s/BatchTimeout: ${BATCH_TIMEOUT:-1s}/g" "$target_configtx"

#
# Update versions
#perl -i -pe 's/_VERSION=2.4.2/_VERSION=2.4.7/g' "$target_env"
perl -i -pe 's/_CA_VERSION=1.5.0/_CA_VERSION=1.5.5/g' "$target_env"


#
# skip chaincode installation for UsersOrg1 (note the approval for UsersOrg1 is not skipped)
perl -i -pe 's/chaincodeInstall "cli.users1.local"/echo "Skipping..." # chaincodeInstall "cli.users1.local"/g' "./fablo-target/fabric-docker/commands-generated.sh"

#
# overwrite default policies
#
setFromPoliciesConfigtx() {
  yaml_path="$1"
  configtx_policies="./configtx-policies.yml"
  echo " - $yaml_path"
  yq eval-all --inplace "select(fileIndex == 0)$yaml_path = select(fileIndex == 1)$yaml_path | select(fileIndex == 0)" "$target_configtx" "$configtx_policies"
}

executeInConfigtx() {
  expression="$1"
  echo " - $expression"
  yq eval --inplace "$expression" "$target_configtx"
}

echo "Overriding policies:"
setFromPoliciesConfigtx ".Organizations[0].Policies"
setFromPoliciesConfigtx ".Organizations[1].Policies"
setFromPoliciesConfigtx ".Organizations[2].Policies"
setFromPoliciesConfigtx ".Organizations[3].Policies"
setFromPoliciesConfigtx ".Application.ACLs"
setFromPoliciesConfigtx ".Application.Policies"
executeInConfigtx '.Application.Policies anchor = "ApplicationDefaultPolicies"'
setFromPoliciesConfigtx ".Orderer.Policies"
setFromPoliciesConfigtx ".Channel.Policies"
setFromPoliciesConfigtx '.Profiles.CuratorChannel'
executeInConfigtx '.Profiles.CuratorChannel anchor = "CuratorChannelDefaults"'
setFromPoliciesConfigtx '.Profiles.PartnerChannel'
executeInConfigtx '.Profiles.PartnerChannel anchor = "PartnerChannelDefaults"'

for channel_name in $(cat "$fablo_config" | jq -r '.channels[] | .name'); do
  channel_name_pascal_case="$(perl -pe 's/(^|-)(\w)/\U$2/g' <<<"$channel_name")"
  executeInConfigtx "del(.Profiles.$channel_name_pascal_case)"
  setFromPoliciesConfigtx ".Profiles.$channel_name_pascal_case"
done

#
# Some sample commands that might be useful in experiments
#
# In chaincode commit phase of chaincode lifecycle you may want to approve only by the CuratorOrg
# perl -i -pe 's/peer0.curator.local:7041,peer0.partner1.local:7061,peer0.users1.local:7081/peer0.curator.local:7041/g' "./fablo-target/fabric-docker/commands-generated.sh"
#
# Disable chaincode approve by some orgs
# perl -i -pe 's/chaincodeApprove "cli.users1.local"/# chaincodeApprove "cli.users1.local"/g' "./fablo-target/fabric-docker/commands-generated.sh"

#
#
echo "Verifying chaincode directories..."
for dir in $(cat "$fablo_config" | jq -r '.chaincodes[] | .directory'); do
  echo "  - Checking if $dir exists..."
  if [ ! -d "$dir" ]; then
    echo "    ERROR: Chaincode directory does not exist: $dir"
    exit 1
  fi
done

echo "Adding BROWSER_API_CHANNEL_NAMES to .env"
echo "BROWSER_API_CHANNEL_NAMES=$(cat "$fablo_config" | jq -r '.channels | map(.name) | join(",")')" >> "$target_env"
