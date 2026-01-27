# Authentication Diagnostic Tools - Usage Guide

## Quick Start

The easiest way to run diagnostics is using the browser console method.

### Method 1: Browser Console (Recommended for Quick Checks)

1. Open the Novel Anime Desktop application
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to the Console tab
4. Copy and paste the contents of `scripts/browser-diagnostics.ts` into the console
5. Run: `runBrowserDiagnostics()`

This will immediately show you:
- ✓ What's in localStorage (tokens, userId, user)
- ✓ Token structure and claims
- ✓ Token expiration status
- ✓ Pinia auth store state
- ✓ Any inconsistencies or issues

### Method 2: Backend Shell Script (For Backend Testing)

Test the backend authentication directly:

```bash
cd .kiro/specs/08-02-auth-diagnosis-fix/scripts
./diagnose-backend.sh
```

This will:
- ✓ Test login endpoint
- ✓ Verify token generation
- ✓ Decode token payload
- ✓ Test authenticated API requests
- ✓ Test DELETE operation permissions

### Method 3: Full Diagnostic Suite (Advanced)

For comprehensive diagnostics including all layers:

1. Ensure the backend server is running
2. Open the application and log in
3. Open browser console
4. Import and run the diagnostic scripts (requires build setup)

## Understanding the Output

### PASS Status
All checks passed - authentication is working correctly.

### FAIL Status
One or more issues detected. Check the "Issues Found" section for details.

## Common Issues and Solutions

### Issue: "Missing access_token in localStorage"
**Solution:** User needs to log in. The token is only created after successful login.

### Issue: "Token is expired"
**Solution:** Token has expired. User needs to log in again or implement token refresh.

### Issue: "Token missing user identifier (sub or userId)"
**Solution:** Backend JWT token generation is incorrect. The token must include userId.

### Issue: "Auth store shows authenticated but has no token"
**Solution:** Auth store state is inconsistent. Check `persistTokens()` and `loadTokens()` methods.

### Issue: "Backend returned '[No User]'"
**Solution:** Backend is not recognizing the user from the token. Check:
1. Token contains userId claim
2. Authorization header format is "Bearer {token}"
3. Backend token validation configuration

### Issue: "Backend returned 401 Unauthorized"
**Solution:** Backend rejected the token. Possible causes:
1. Token signature is invalid
2. Token is expired
3. Backend secret key mismatch
4. Token format is incorrect

## Diagnostic Script Locations

- **Browser Console Script**: `scripts/browser-diagnostics.ts`
- **Frontend Diagnostics**: `scripts/diagnose-frontend.ts`
- **Token Diagnostics**: `scripts/diagnose-token.ts`
- **API Diagnostics**: `scripts/diagnose-api.ts`
- **Backend Diagnostics**: `scripts/diagnose-backend.sh`
- **Master Script**: `scripts/run-all-diagnostics.ts`

## Report Location

Diagnostic reports are saved to:
```
.kiro/specs/08-02-auth-diagnosis-fix/reports/diagnostic-{timestamp}.json
```

## Next Steps After Running Diagnostics

1. **Review the diagnostic report** - Identify critical issues
2. **Check the recommendations** - Follow suggested fixes
3. **Implement fixes** - Based on the root cause identified
4. **Re-run diagnostics** - Verify fixes resolved the issues
5. **Run tests** - Ensure no regressions

## Getting Help

If diagnostics show issues you don't understand:
1. Save the diagnostic report
2. Check the troubleshooting guide in the design document
3. Review the authentication flow diagram
4. Ask for help with the diagnostic report attached

## Related Documentation

- **Requirements**: `requirements.md`
- **Design**: `design.md`
- **Tasks**: `tasks.md`
- **Scripts README**: `scripts/README.md`
