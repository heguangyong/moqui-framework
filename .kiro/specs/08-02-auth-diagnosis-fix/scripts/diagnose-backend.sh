#!/bin/bash

###############################################################################
# Backend Authentication Diagnostic Script
# Feature: 08-02-auth-diagnosis-fix
#
# Tests backend authentication endpoints directly using curl.
# Verifies token validation and user session establishment.
# Validates: Requirements 1.4, 1.5, 4.1, 4.3, 4.4
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${API_BASE_URL:-http://localhost:8080}"
LOGIN_ENDPOINT="$BASE_URL/rest/s1/novelanime/login"
PROJECTS_ENDPOINT="$BASE_URL/rest/s1/novelanime/projects"
USERNAME="${TEST_USERNAME:-admin}"
PASSWORD="${TEST_PASSWORD:-admin}"

echo "=== Backend Authentication Diagnostic ==="
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Login and get token
echo "Test 1: Login and Token Generation"
echo "-----------------------------------"
echo "Endpoint: $LOGIN_ENDPOINT"
echo "Credentials: $USERNAME / ****"
echo ""

LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$LOGIN_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_STATUS/d')

echo "Response Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  
  # Extract token
  ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
  USER_ID=$(echo "$RESPONSE_BODY" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ Access token received${NC}"
    echo "Token (first 20 chars): ${ACCESS_TOKEN:0:20}..."
  else
    echo -e "${RED}✗ No access token in response${NC}"
  fi
  
  if [ -n "$USER_ID" ]; then
    echo -e "${GREEN}✓ User ID received: $USER_ID${NC}"
  else
    echo -e "${RED}✗ No user ID in response${NC}"
  fi
else
  echo -e "${RED}✗ Login failed with status $HTTP_STATUS${NC}"
  echo "Response: $RESPONSE_BODY"
  exit 1
fi

echo ""

# Test 2: Verify token structure
echo "Test 2: Token Structure Validation"
echo "-----------------------------------"

# Count dots in token (JWT should have 2 dots = 3 parts)
DOT_COUNT=$(echo "$ACCESS_TOKEN" | tr -cd '.' | wc -c | tr -d ' ')

if [ "$DOT_COUNT" = "2" ]; then
  echo -e "${GREEN}✓ Token has valid JWT structure (3 parts)${NC}"
else
  echo -e "${RED}✗ Token has invalid structure (expected 3 parts, got $((DOT_COUNT + 1)))${NC}"
fi

# Try to decode token payload (base64)
PAYLOAD=$(echo "$ACCESS_TOKEN" | cut -d'.' -f2)
# Add padding if needed
case $((${#PAYLOAD} % 4)) in
  2) PAYLOAD="${PAYLOAD}==" ;;
  3) PAYLOAD="${PAYLOAD}=" ;;
esac

DECODED_PAYLOAD=$(echo "$PAYLOAD" | base64 -d 2>/dev/null)

if [ -n "$DECODED_PAYLOAD" ]; then
  echo -e "${GREEN}✓ Token payload decoded successfully${NC}"
  echo "Payload:"
  echo "$DECODED_PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$DECODED_PAYLOAD"
else
  echo -e "${RED}✗ Failed to decode token payload${NC}"
fi

echo ""

# Test 3: Test authenticated API request
echo "Test 3: Authenticated API Request"
echo "----------------------------------"
echo "Endpoint: $PROJECTS_ENDPOINT"
echo "Method: GET"
echo ""

API_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X GET "$PROJECTS_ENDPOINT" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

API_HTTP_STATUS=$(echo "$API_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
API_RESPONSE_BODY=$(echo "$API_RESPONSE" | sed '/HTTP_STATUS/d')

echo "Response Status: $API_HTTP_STATUS"

if [ "$API_HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ API request successful${NC}"
  
  # Check if response contains user information
  if echo "$API_RESPONSE_BODY" | grep -q "userId\|username"; then
    echo -e "${GREEN}✓ Backend recognized user${NC}"
  else
    echo -e "${YELLOW}⚠ Response does not contain user information${NC}"
  fi
  
  # Check for "[No User]" error
  if echo "$API_RESPONSE_BODY" | grep -q "\[No User\]"; then
    echo -e "${RED}✗ Backend returned '[No User]' error${NC}"
  fi
else
  echo -e "${RED}✗ API request failed with status $API_HTTP_STATUS${NC}"
  
  if [ "$API_HTTP_STATUS" = "401" ]; then
    echo -e "${RED}✗ Unauthorized - token not accepted by backend${NC}"
  elif [ "$API_HTTP_STATUS" = "403" ]; then
    echo -e "${RED}✗ Forbidden - insufficient permissions${NC}"
  fi
fi

echo "Response:"
echo "$API_RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$API_RESPONSE_BODY"

echo ""

# Test 4: Test DELETE operation (if we have a project ID)
echo "Test 4: DELETE Operation Permission Check"
echo "------------------------------------------"

# Try to get first project ID from the list
PROJECT_ID=$(echo "$API_RESPONSE_BODY" | grep -o '"projectId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PROJECT_ID" ]; then
  echo "Testing DELETE with project ID: $PROJECT_ID"
  echo ""
  
  DELETE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -X DELETE "$PROJECTS_ENDPOINT/$PROJECT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json")
  
  DELETE_HTTP_STATUS=$(echo "$DELETE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
  DELETE_RESPONSE_BODY=$(echo "$DELETE_RESPONSE" | sed '/HTTP_STATUS/d')
  
  echo "Response Status: $DELETE_HTTP_STATUS"
  
  if [ "$DELETE_HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ DELETE operation successful${NC}"
  else
    echo -e "${RED}✗ DELETE operation failed with status $DELETE_HTTP_STATUS${NC}"
    
    if echo "$DELETE_RESPONSE_BODY" | grep -q "\[No User\]"; then
      echo -e "${RED}✗ Backend returned '[No User]' - user not recognized${NC}"
    fi
    
    if echo "$DELETE_RESPONSE_BODY" | grep -q "not authorized"; then
      echo -e "${RED}✗ User not authorized for DELETE operation${NC}"
    fi
  fi
  
  echo "Response:"
  echo "$DELETE_RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$DELETE_RESPONSE_BODY"
else
  echo -e "${YELLOW}⚠ No project ID available for DELETE test${NC}"
fi

echo ""
echo "=========================================="
echo "Diagnostic complete"
echo ""

# Summary
echo "Summary:"
echo "--------"
if [ "$HTTP_STATUS" = "200" ] && [ -n "$ACCESS_TOKEN" ]; then
  echo -e "${GREEN}✓ Login and token generation: PASS${NC}"
else
  echo -e "${RED}✗ Login and token generation: FAIL${NC}"
fi

if [ "$DOT_COUNT" = "2" ] && [ -n "$DECODED_PAYLOAD" ]; then
  echo -e "${GREEN}✓ Token structure validation: PASS${NC}"
else
  echo -e "${RED}✗ Token structure validation: FAIL${NC}"
fi

if [ "$API_HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Authenticated API request: PASS${NC}"
else
  echo -e "${RED}✗ Authenticated API request: FAIL${NC}"
fi

if [ -n "$PROJECT_ID" ]; then
  if [ "$DELETE_HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ DELETE operation: PASS${NC}"
  else
    echo -e "${RED}✗ DELETE operation: FAIL${NC}"
  fi
else
  echo -e "${YELLOW}⚠ DELETE operation: SKIPPED${NC}"
fi
