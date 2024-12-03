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
current_script="$(basename "$0")"
command="$1"
host=${LOCALHOST_NAME:-localhost}

# Add shared functions with ops-api script
printHeadline() {
  bold=$'\e[1m'
  end=$'\e[0m'
  TEXT=$1
  EMOJI=$2
  printf "${bold}============ %b %s %b ==============${end}\n" "$EMOJI" "$TEXT" "$EMOJI"
}

if [ "$command" = "up" ]; then
  echo "Starting Chain Browser instances..."
  (cd "$current_dir" && docker compose --env-file ../fablo-target/fabric-docker/.env up -d)
elif [ "$command" = "success-message" ]; then
  printHeadline "The Chain Browser is ready! You can now use the following URLs:" "\360\237\237\242"
  echo "  block browser:   http://$host:3010/blocks"
  echo "  state browser:   http://$host:3010/graphiql"
elif [ "$command" = "down" ]; then
  echo "Downing Chain Browser instances..."
  (cd "$current_dir" && docker compose --env-file ../fablo-target/fabric-docker/.env down -t 1)
else
  echo "Invalid command. Usage: $current_script <up|down>"
  exit 0
fi
