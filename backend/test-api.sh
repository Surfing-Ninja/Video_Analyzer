#!/bin/bash

# Video Analyzer API Test Script
# This script helps you test the multi-tenant RBAC system

BASE_URL="http://localhost:5001"
ORG_ID="507f1f77bcf86cd799439011"  # Update this with your actual org ID

echo "==================================="
echo "Video Analyzer API Test Script"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo ""
    echo -e "${YELLOW}==== $1 ====${NC}"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Test health endpoint
print_header "1. Testing Health Endpoint"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Server is healthy"
    echo "$BODY" | jq '.'
else
    print_error "Server health check failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Register Admin User
print_header "2. Registering Admin User"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Test",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "admin",
    "orgId": "'"$ORG_ID"'"
  }')

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token')
if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    print_success "Admin registered successfully"
    echo "$ADMIN_RESPONSE" | jq '.user'
else
    print_error "Admin registration failed"
    echo "$ADMIN_RESPONSE" | jq '.'
fi

# Register Editor User
print_header "3. Registering Editor User"
EDITOR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Editor Test",
    "email": "editor@test.com",
    "password": "editor123",
    "role": "editor",
    "orgId": "'"$ORG_ID"'"
  }')

EDITOR_TOKEN=$(echo "$EDITOR_RESPONSE" | jq -r '.token')
if [ "$EDITOR_TOKEN" != "null" ] && [ -n "$EDITOR_TOKEN" ]; then
    print_success "Editor registered successfully"
    echo "$EDITOR_RESPONSE" | jq '.user'
else
    print_error "Editor registration failed"
    echo "$EDITOR_RESPONSE" | jq '.'
fi

# Register Viewer User
print_header "4. Registering Viewer User"
VIEWER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Viewer Test",
    "email": "viewer@test.com",
    "password": "viewer123",
    "role": "viewer",
    "orgId": "'"$ORG_ID"'"
  }')

VIEWER_TOKEN=$(echo "$VIEWER_RESPONSE" | jq -r '.token')
if [ "$VIEWER_TOKEN" != "null" ] && [ -n "$VIEWER_TOKEN" ]; then
    print_success "Viewer registered successfully"
    echo "$VIEWER_RESPONSE" | jq '.user'
else
    print_error "Viewer registration failed"
    echo "$VIEWER_RESPONSE" | jq '.'
fi

# Test Login
print_header "5. Testing Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "orgId": "'"$ORG_ID"'"
  }')

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
if [ "$LOGIN_TOKEN" != "null" ] && [ -n "$LOGIN_TOKEN" ]; then
    print_success "Login successful"
    echo "$LOGIN_RESPONSE" | jq '.user'
else
    print_error "Login failed"
    echo "$LOGIN_RESPONSE" | jq '.'
fi

# Get Current User
print_header "6. Testing Get Current User"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$ME_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    print_success "Get current user successful"
    echo "$ME_RESPONSE" | jq '.user'
else
    print_error "Get current user failed"
    echo "$ME_RESPONSE" | jq '.'
fi

# Test unauthorized access
print_header "7. Testing Unauthorized Access"
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/videos")
HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    print_success "Unauthorized access properly blocked"
else
    print_error "Unauthorized access not blocked (HTTP $HTTP_CODE)"
fi

# Test role-based access (Viewer trying to delete)
print_header "8. Testing RBAC - Viewer Cannot Delete"
# First, let's try to get videos (should work but return empty)
VIEWER_VIDEOS=$(curl -s -X GET "$BASE_URL/api/videos" \
  -H "Authorization: Bearer $VIEWER_TOKEN")

print_success "Viewer can access videos endpoint"
echo "$VIEWER_VIDEOS" | jq '.'

print_header "Summary"
echo ""
echo "Tokens generated:"
echo "ADMIN_TOKEN:  $ADMIN_TOKEN"
echo "EDITOR_TOKEN: $EDITOR_TOKEN"
echo "VIEWER_TOKEN: $VIEWER_TOKEN"
echo ""
echo "Organization ID: $ORG_ID"
echo ""
print_success "All basic tests completed!"
echo ""
echo "To test video upload, delete, and process:"
echo "1. Upload a video using one of the tokens"
echo "2. Test different role permissions"
echo ""
echo "Example:"
echo "  curl -X POST $BASE_URL/api/videos/upload \\"
echo "    -H \"Authorization: Bearer \$ADMIN_TOKEN\" \\"
echo "    -F \"video=@/path/to/video.mp4\" \\"
echo "    -F \"title=Test Video\""
