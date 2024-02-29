#!/usr/bin/env bash

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
