#!/bin/bash

# Admin Setup Script for Production
# This script helps you create an admin user on your deployed backend

echo "============================================"
echo "     Kyokushin Karate Admin Setup"
echo "============================================"
echo ""

# Collect admin details
echo "Please provide the following details:"
echo ""

read -p "Admin Email: " ADMIN_EMAIL
read -sp "Admin Password (min 8 chars): " ADMIN_PASSWORD
echo ""
read -p "Full Name: " ADMIN_NAME
read -p "Phone (optional): " ADMIN_PHONE
read -p "City (optional): " ADMIN_CITY
read -p "State (optional): " ADMIN_STATE

echo ""
echo "============================================"

# Use the fixed setup key that's already in Render
SETUP_KEY="kki-admin-setup-1764083376-da6dee8dd39dc24a"

echo ""
echo "Using Setup Key: $SETUP_KEY"
echo "(This key should already be in your Render environment variables)"
echo ""
read -p "Is this key already in Render as ADMIN_SETUP_KEY? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Please add the environment variable first, then run this script again."
    exit 1
fi

# Build the JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "setupKey": "$SETUP_KEY",
  "email": "$ADMIN_EMAIL",
  "password": "$ADMIN_PASSWORD",
  "name": "$ADMIN_NAME"
EOF
)

# Add optional fields if provided
if [ ! -z "$ADMIN_PHONE" ]; then
    JSON_PAYLOAD="$JSON_PAYLOAD,\n  \"phone\": \"$ADMIN_PHONE\""
fi

if [ ! -z "$ADMIN_CITY" ]; then
    JSON_PAYLOAD="$JSON_PAYLOAD,\n  \"city\": \"$ADMIN_CITY\""
fi

if [ ! -z "$ADMIN_STATE" ]; then
    JSON_PAYLOAD="$JSON_PAYLOAD,\n  \"state\": \"$ADMIN_STATE\""
fi

JSON_PAYLOAD="$JSON_PAYLOAD\n}"

echo ""
echo "Creating admin user..."
echo ""

# Make the API call
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://kyokushin-api.onrender.com/api/setup/admin \
  -H "Content-Type: application/json" \
  -d "$(echo -e "$JSON_PAYLOAD")")

# Extract HTTP code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
    echo "============================================"
    echo "✅ SUCCESS! Admin user created successfully!"
    echo "============================================"
    echo ""
    echo "You can now login with:"
    echo "  Email: $ADMIN_EMAIL"
    echo "  Password: [the password you entered]"
    echo ""
    echo "IMPORTANT: Delete the ADMIN_SETUP_KEY from Render now!"
else
    echo "============================================"
    echo "❌ Failed to create admin user"
    echo "HTTP Status: $HTTP_CODE"
    echo "============================================"
    echo ""
    echo "Common issues:"
    echo "  - Setup key doesn't match Render environment variable"
    echo "  - Admin already exists"
    echo "  - Backend not deployed yet"
fi

echo ""
