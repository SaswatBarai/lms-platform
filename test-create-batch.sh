#!/bin/bash

BASE_URL="http://localhost:8000"

EMAIL="jane.smith@college.edu"
PASSWORD="34a2bd50024006be"

COURSE_ID="cmjvhn412000hn22j4hybs1wb"
BATCH_YEAR="2024-2028"
BATCH_TYPE="BTECH"

echo "Logging in..."

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/api/login-non-teaching-staff" \
  -H "Content-Type: application/json" \
  -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\"
      }")

echo "Login Response:"
echo "$LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // .token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to fetch token. Check login response."
  exit 1
fi

echo "✅ Token fetched"
echo ""

echo "📌 Creating Batch..."

CREATE_BATCH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/api/add-batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
        \"courseId\": \"$COURSE_ID\",
        \"batchYear\": \"$BATCH_YEAR\",
        \"batchType\": \"$BATCH_TYPE\"
      }")

echo "Create Batch Response:"
echo "$CREATE_BATCH_RESPONSE" | jq '.'

SUCCESS=$(echo "$CREATE_BATCH_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" == "true" ]; then
  echo ""
  echo "✅ Batch created successfully!"
else
  echo ""
  echo "❌ Failed to create batch"
  exit 1
fi




