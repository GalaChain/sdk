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

set -euo pipefail

current_dir="$(cd "$(dirname "$0")" && pwd)"
current_script="$current_dir/$(basename "$0")"

mode="${1:-"watch"}"
chaincode_name="${2:-"basic-asset"}"
chaincode_id="$chaincode_name:0.0.1"
chaincode_path="$current_dir/$(jq -r ".chaincodes[] | select(.name==\"$chaincode_name\") | .directory" "$current_dir/fablo-config.json")"

# if $LOCALHOST_NAME is not set, set it to the localhost IP
if [ -z "${LOCALHOST_NAME:-}" ]; then
  LOCALHOST_NAME="127.0.0.1"
fi

function networkDown() {
  echo "Stopping chaincode $chaincode_id build in watch mode"
  galachain network:prune
}

(
    cd "$chaincode_path" || exit 1

  if [ "$mode" = "watch" ]; then
    trap "networkDown" EXIT

    echo "Starting chaincode $chaincode_id build in watch mode"
    (npm run build:watch) &
    sleep 5 # wait a bit until compilation ends

    echo "Starting chaincode $chaincode_id processes in watch mode"
    npx nodemon \
      --watch "$chaincode_path/lib" \
      --verbose \
      --exec "$current_script" start "${2:-""}" || true

  elif [ "$mode" = "start" ]; then
    echo "Starting chaincode $chaincode_id from $chaincode_path"
    mkdir -p "$chaincode_path/logs"

    # starting assets for partner and users (in background)
    (npm start -- --peer.address "$LOCALHOST_NAME:8561" --chaincode-id-name "$chaincode_id" --tls.enabled false >>logs/partner.log) &
    (npm start -- --peer.address "$LOCALHOST_NAME:8581" --chaincode-id-name "$chaincode_id" --tls.enabled false >>logs/users.log) &

    # starting assets for peer0.curator.org (in front)
    log_level=info
    (
      CORE_CHAINCODE_LOGGING_LEVEL=$log_level npm start --inspect -- \
        --peer.address "$LOCALHOST_NAME:8541" \
        --chaincode-id-name "$chaincode_id" \
        --tls.enabled false |
        tee -a logs/curator.log |
        awk '{ print "[\033[34mcurator\033[0m]  "$0 }'
    ) &&
      echo "Chaincode stopped" ||
      echo "Chaincode stopped with $? signal"

  else
    echo "Unrecognized mode $mode, assuming $mode is a chaincode name"
    "$current_script" watch "$mode"
  fi
)
