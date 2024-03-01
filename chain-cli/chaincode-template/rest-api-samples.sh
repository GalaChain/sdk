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

# Enroll a user (default admin credentials for local env)
enroll_response="$(
  curl --request POST \
    --url http://localhost:8801/user/enroll \
    --data '{"id": "admin", "secret": "adminpw"}'
)"
echo "Enroll response: $enroll_response"

token="$(echo "$enroll_response" | jq -r '.token')"

# Call chaincode (GetChaincodeVersion - the simplest call)
version_response="$(
  curl --request POST \
    --url http://localhost:8801/invoke/product-channel/basic-product \
    --header "Authorization: Bearer $token" \
    --data '{"method": "PublicKeyContract:GetChaincodeVersion", "args": []}'
)"
echo "Version response: $version_response"


# Call chaincode (GetMyProfile - requires signing of DTO with user's private key
get_my_profile_dto="$(galachain dto-sign test-network/dev-admin-key/dev-admin.priv.hex.txt '{}')"
echo "get_my_profile_dto: $get_my_profile_dto"
get_my_profile_payload="$(
  echo '{}' |
   jq '.method="PublicKeyContract:GetMyProfile"' |
   jq ".args=[\"${get_my_profile_dto//\"/\\\"}\"]"
)"

profile_response="$(
  curl --request POST \
    --url http://localhost:8801/invoke/product-channel/basic-product \
    --header "Authorization: Bearer $token" \
    --header 'Content-Type: application/json' \
    --data "$get_my_profile_payload"
)"
echo "Profile response: $profile_response"
