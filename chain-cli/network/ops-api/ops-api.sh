#!/usr/bin/env bash

set -eu

command="$1"
test_network_dir="${2:-$(pwd)}"
api_config="${3:-"$(pwd)/api-config.json"}"

current_dir="$(cd "$(dirname "$0")" && pwd)"
host=${LOCALHOST_NAME:-localhost}

export API_CONFIG=$api_config
export CHAINCODES_BASE_DIR=$test_network_dir

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
  local endpoint="http://$host:$port/status"

  echo "Verifying ops-api $org instance at $endpoint..."

  while [ $attempt -le $max_attempts ]; do
    if curl -s "$endpoint" > /dev/null 2>&1; then
      echo -e "  [\033[32msuccess\033[0m]: ops-api $org is ready"
      return 0
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
  cd "$current_dir" && docker compose --env-file "$test_network_dir/fablo-target/fabric-docker/.env" up -d

  # Verify all instances
  verifyOpsInstance 3000 "curator"
  verifyOpsInstance 3100 "partner"
  verifyOpsInstance 3200 "users"

  printHeadline "The ops-api instances are ready! You can now use the following URLs:" "\360\237\237\242"
  echo "  ops-api curator: http://$host:3000/docs"
  echo "  ops-api partner: http://$host:3100/docs"
  echo "  ops-api users:   http://$host:3200/docs"

elif [ "$command" = "down" ]; then
  echo "Downing ops-api instances..."
  cd "$current_dir" && docker compose --env-file "$test_network_dir/fablo-target/fabric-docker/.env" down -t 1
else
  printHeadline "Invalid command. Valid commands are <up|down>" "\360\237\233\221"
  echo "Example:"
  echo "  sh ops-api.sh up <test_network_dir> <api_config_file_path>"
  echo "  sh ops-api.sh down"
  exit 1
fi