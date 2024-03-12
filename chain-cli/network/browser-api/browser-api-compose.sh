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

if [ "$command" = "up" ]; then
  echo "Starting Fablo instances..."
  (cd "$current_dir" && docker compose --env-file ../fablo-target/fabric-docker/.env up -d)
elif [ "$command" = "success-message" ]; then
  echo ""
  echo "The test network is ready! You can now use the following URLs to access it:"
  echo "  block browser:   http://$host:3010/blocks"
  echo "  state browser:   http://$host:3010/graphiql"
elif [ "$command" = "down" ]; then
  echo "Downing Fablo instances..."
  (cd "$current_dir" && docker compose --env-file ../fablo-target/fabric-docker/.env down -t 1)
  else
  echo "Invalid command. Usage: $current_script <up|down>"
  exit 0
fi
