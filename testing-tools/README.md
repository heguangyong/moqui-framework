# Moqui Testing Tools

This directory contains valuable testing and debugging tools for the Moqui Framework development and debugging.

## Chrome MCP Authentication Tools

### 1. chrome_mcp_auth_proxy.sh
**Primary Chrome MCP Authentication Proxy**

Solves the fundamental Chrome headless authentication problem by using curl for authentication and Chrome for rendering.

**Usage:**
```bash
./chrome_mcp_auth_proxy.sh
```

**Features:**
- Bypasses Chrome headless authentication limitations
- 5-step authentication proxy process
- Generates authenticated page screenshots
- Creates local authenticated HTML files

### 2. chrome_mcp_auth_proxy_v2.sh
**Enhanced Chrome MCP Authentication Proxy v2**

Advanced version with additional debugging capabilities and enhanced error handling.

**Usage:**
```bash
./chrome_mcp_auth_proxy_v2.sh
```

## JWT Authentication Testing

### 3. jwt_chrome_mcp.sh
**JWT Chrome MCP Integration Test**

Specialized script for testing JWT authentication with Chrome MCP verification.

**Usage:**
```bash
./jwt_chrome_mcp.sh
```

### 4. pure_jwt_test.html
**Pure JWT Authentication Test Interface**

Interactive web interface for testing JWT authentication flow without browser dependencies.

**Usage:**
```bash
# Open in browser
open pure_jwt_test.html
```

**Features:**
- JWT login testing
- Menu data API testing
- QApps page verification
- Token management debugging

## Vue.js Debugging Tools

### 5. debug_vue_mounting.sh
**Vue.js Mounting Debug Script**

Shell script for debugging Vue.js component mounting and initialization issues.

**Usage:**
```bash
./debug_vue_mounting.sh
```

### 6. debug_vue_mounting.js
**Vue.js Debug JavaScript Module**

Comprehensive JavaScript debugging utilities for Vue 3.x + Quasar 2.x integration.

**Features:**
- Vue instance debugging
- Component registration verification
- Quasar plugin loading analysis
- DOM mounting diagnostics

## User Experience Testing

### 7. real_user_test.sh
**Real User Experience Test**

Simulates real user interaction patterns for comprehensive system testing.

**Usage:**
```bash
./real_user_test.sh
```

### 8. user_complete_test.sh
**Complete User Journey Test**

End-to-end testing script covering complete user workflows from login to application usage.

**Usage:**
```bash
./user_complete_test.sh
```

## Marketplace Testing

### 9. test_marketplace_mcp.sh
**Marketplace MCP Testing Script**

Specialized testing for marketplace component functionality with MCP integration.

**Usage:**
```bash
./test_marketplace_mcp.sh
```

## JWT Frontend Fix Tools

### 10. moqui_complete_solution.html
**Complete JWT Login Solution**

Comprehensive solution for JWT authentication issues in Moqui frontend.

**Usage:**
```bash
# Open in browser
open testing-tools/moqui_complete_solution.html
```

**Features:**
- Step-by-step JWT authentication setup
- Automatic token injection to localStorage, sessionStorage, and cookies
- API connectivity testing
- Direct Moqui app access

### 11. jwt_fix_frontend.html
**Manual JWT Token Injection Tool**

Interactive tool for manual JWT token management and testing.

**Usage:**
```bash
# Open in browser
open testing-tools/jwt_fix_frontend.html
```

### 12. jwt_frontend_fix.sh
**Automated JWT Frontend Fix Script**

Bash script for automated JWT token injection and verification.

**Usage:**
```bash
./testing-tools/jwt_frontend_fix.sh
```

**Features:**
- Automated JWT token retrieval
- Chrome headless testing
- Screenshot verification
- Complete diagnostic output

## System Verification Commands

### Quick Health Check
```bash
# Check if Moqui is running
curl -s "http://localhost:8080" -w "%{http_code}"

# Test QApps page
curl -s "http://localhost:8080/qapps" -w "%{http_code}"
```

### JWT Token Testing
```bash
# Test JWT login
curl -X POST "http://localhost:8080/Login/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=john.doe&password=moqui" \
     -v

# Test authenticated API
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:8080/menuData/qapps"
```

## Architecture Overview

- **JWT Authentication**: Complete stateless authentication system
- **Session Cleanup**: All legacy session dependencies removed
- **Vue.js Integration**: Proper component initialization and error handling
- **Chrome MCP Proxy**: Breakthrough solution for headless browser testing

## Documentation

See `/CLAUDE.md` for comprehensive development guide and troubleshooting.