# Moqui Testing Tools

This directory contains valuable testing and debugging tools for the Moqui JWT authentication system.

## Tools

### 1. chrome_mcp_auth_proxy.sh
**Revolutionary Chrome MCP Authentication Proxy**

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

### 2. pure_jwt_test.html
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