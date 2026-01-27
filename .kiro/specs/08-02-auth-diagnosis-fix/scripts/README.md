# Authentication Diagnostic Scripts

This directory contains diagnostic scripts for investigating authentication issues in the Novel Anime Desktop application.

## Purpose

These scripts systematically check each layer of the authentication system to identify where the authentication chain breaks:

1. **Frontend Diagnostics** - Check localStorage and auth store state
2. **Token Diagnostics** - Decode and validate JWT tokens
3. **API Diagnostics** - Inspect API request headers and responses
4. **Backend Diagnostics** - Test backend authentication endpoints directly

## Scripts

### diagnose-frontend.ts
Checks frontend authentication state including localStorage and Pinia auth store.

**Usage:**
```bash
npm run diagnose:frontend
```

### diagnose-token.ts
Decodes JWT tokens and validates their structure and claims.

**Usage:**
```bash
npm run diagnose:token
```

### diagnose-api.ts
Tests API endpoints with authentication and logs request/response details.

**Usage:**
```bash
npm run diagnose:api
```

### diagnose-backend.sh
Tests backend authentication endpoints directly using curl.

**Usage:**
```bash
./diagnose-backend.sh
```

### run-all-diagnostics.ts
Master script that runs all diagnostics and generates a comprehensive report.

**Usage:**
```bash
npm run diagnose:all
```

## Output

Diagnostic reports are saved to `.kiro/specs/08-02-auth-diagnosis-fix/reports/` with timestamps.

## Dependencies

- jwt-decode: For decoding JWT tokens
- fast-check: For property-based testing
- axios: For API testing (already installed)

## Installation

Dependencies are installed automatically when running:
```bash
npm install
```

## Troubleshooting

If scripts fail to run:
1. Ensure you're in the `frontend/NovelAnimeDesktop` directory
2. Run `npm install` to ensure all dependencies are installed
3. Check that the backend server is running
4. Verify you have valid authentication credentials

## Related Documentation

- Requirements: `.kiro/specs/08-02-auth-diagnosis-fix/requirements.md`
- Design: `.kiro/specs/08-02-auth-diagnosis-fix/design.md`
- Tasks: `.kiro/specs/08-02-auth-diagnosis-fix/tasks.md`
