#!/bin/bash

# Base URL
BASE_URL="http://localhost:5000/api"

echo "Testing Public User Profile Endpoint..."
# 1. Test fetching a user profile (assuming user ID 1 exists or adjust as needed)
# Since I don't know for sure which IDs exist, I'll try ID 1. If it fails, check logs.
curl -s "$BASE_URL/public/users/1" | grep -q "user_id"
if [ $? -eq 0 ]; then
    echo "✅ Fetch User Profile: Success"
else
    echo "❌ Fetch User Profile: Failed (or user 1 not found)"
    curl -s "$BASE_URL/public/users/1"
fi

echo "Testing Public Properties by Owner Endpoint..."
# 2. Test fetching properties for an owner (assuming owner ID 1)
curl -s "$BASE_URL/public/properties/owner/1" | grep -q "current_owner"
if [ $? -eq 0 ]; then
    echo "✅ Fetch Public Properties: Success"
else
    echo "❌ Fetch Public Properties: Failed (or no properties for user 1)"
    curl -s "$BASE_URL/public/properties/owner/1"
fi
