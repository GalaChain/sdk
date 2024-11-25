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

current_dir="$(cd "$(dirname "$0")" && pwd)"
command="$1"
test_network_dir="${2:-$(pwd)}"
api_config="${3:-"$(pwd)/api-config.json"}"
host=${LOCALHOST_NAME:-localhost}

export API_CONFIG=$api_config

printHeadline() {
  bold=$'\e[1m'
  end=$'\e[0m'
  TEXT=$1
  EMOJI=$2
  printf "${bold}============ %b %s %b ==============${end}\n" "$EMOJI" "$TEXT" "$EMOJI"
}

checkApiConfigFile() {
  if [ ! -f "$api_config" ]; then
    printHeadline "The api-config.json file does not exist at $api_config" "\360\237\233\221"
    echo "Example:"
    echo "  sh ops-api.sh up <test_network_dir> <api_config_file_path>"
    exit 1
  fi
}

verifyOpsInstance() {
  local port=$1
  local org=$2
  local max_attempts=30
  local attempt=1
  local endpoint="http://$host:$port/api/status"

  echo "Verifying ops-api $org instance at $endpoint..."

  while [ $attempt -le $max_attempts ]; do
    # Store the curl response and http code in variables
    local response
    local http_code
    # Add --connect-timeout to avoid hanging
    response=$(curl -s --connect-timeout 1 -w "\n%{http_code}" "$endpoint" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)  # Get last line (status code)
    response=$(echo "$response" | sed \$d)     # Get all but last line (response body)
    
    # Check if curl succeeded and response contains valid JSON
    if [ "$http_code" = "200" ] && [ -n "$response" ]; then
      # Check if response doesn't contain "contractVersion":"?.?.?" and empty contracts array
      if ! echo "$response" | grep -q '"contractVersion":"?.?.?"' && \
         ! echo "$response" | grep -q '"contracts":\[\]'; then
        echo "$response"
        echo -e "  [\033[32msuccess\033[0m]: ops-api $org is ready"
        return 0
      fi
    fi
    
    echo -e "  [\033[33mpending\033[0m]: attempt $attempt/$max_attempts"
    sleep 2
    attempt=$((attempt + 1))
  done

  echo -e "  [\033[31mfailed\033[0m]: ops-api $org failed to start"
  return 1
}

if [ "$command" = "up" ]; then
  checkApiConfigFile

  echo "Starting ops-api instances..."
  (cd "$current_dir" && docker compose --env-file ../fablo-target/fabric-docker/.env up -d)

  # Verify all instances
  verifyOpsInstance 3000 "curator"
  verifyOpsInstance 3100 "partner"
  verifyOpsInstance 3200 "users"

  printHeadline "The ops-api instances are ready! You can now use the following URLs:" "\360\237\237\242"
  echo "  ops-api curator: http://$host:3000/docs"
  echo "  ops-api partner: http://$host:3100/docs"
  echo "  ops-api users:   http://$host:3200/docs"

elif [ "$command" = "down" ]; then
  echo "Downing ops-api instances... .. $current_dir"
  (cd "$current_dir" && docker compose --env-file ../fablo-target/fabric-docker/.env down -t 1)
elif [ "$command" = "verify" ]; then
  verifyOpsInstance 3000 "curator"
  verifyOpsInstance 3100 "partner"
  verifyOpsInstance 3200 "users"
else
  printHeadline "Invalid command. Valid commands are <up|down|verify>" "\360\237\233\221"
  echo "Example:"
  echo "  sh ops-api.sh up <test_network_dir> <api_config_file_path>"
  echo "  sh ops-api.sh down"
  exit 1
fi