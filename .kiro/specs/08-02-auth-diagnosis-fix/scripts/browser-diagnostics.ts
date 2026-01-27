/**
 * Browser-Compatible Diagnostic Script
 * Feature: 08-02-auth-diagnosis-fix
 * 
 * This script can be pasted into the browser console to run diagnostics
 * without needing to build or import modules.
 */

// Paste this entire script into the browser console and run: runBrowserDiagnostics()

(function() {
  // Simple JWT decoder (no dependencies)
  function decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = parts[1];
      // Add padding if needed
      const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  // Main diagnostic function
  (window as any).runBrowserDiagnostics = function() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   BROWSER AUTHENTICATION DIAGNOSTICS                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Timestamp:', new Date().toISOString());
    console.log('');

    const issues: string[] = [];

    // 1. Check localStorage
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. LOCALSTORAGE CHECK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const accessToken = localStorage.getItem('novel_anime_access_token');
    const refreshToken = localStorage.getItem('novel_anime_refresh_token');
    const userId = localStorage.getItem('novel_anime_user_id');
    const userStr = localStorage.getItem('novel_anime_user_data');
    
    console.log('access_token:', accessToken ? '✓ Present' : '✗ Missing');
    console.log('refresh_token:', refreshToken ? '✓ Present' : '✗ Missing');
    console.log('userId:', userId || '✗ Missing');
    console.log('user:', userStr ? '✓ Present' : '✗ Missing');
    console.log('');

    if (!accessToken) issues.push('Missing access_token in localStorage');
    if (!refreshToken) issues.push('Missing refresh_token in localStorage');
    if (!userId) issues.push('Missing userId in localStorage');
    if (!userStr) issues.push('Missing user object in localStorage');

    // 2. Check token structure
    if (accessToken) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('2. TOKEN STRUCTURE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const parts = accessToken.split('.');
      console.log('Token parts:', parts.length, parts.length === 3 ? '✓' : '✗');
      
      if (parts.length === 3) {
        const decoded = decodeJWT(accessToken);
        if (decoded) {
          console.log('✓ Token decoded successfully');
          console.log('');
          console.log('Token Claims:');
          console.log('  sub (user ID):', decoded.sub || '✗ Missing');
          console.log('  userId:', decoded.userId || '✗ Missing');
          console.log('  username:', decoded.username || decoded.preferred_username || '✗ Missing');
          console.log('  exp (expiration):', decoded.exp ? new Date(decoded.exp * 1000).toISOString() : '✗ Missing');
          console.log('  iat (issued at):', decoded.iat ? new Date(decoded.iat * 1000).toISOString() : '✗ Missing');
          console.log('');
          
          if (!decoded.sub && !decoded.userId) {
            issues.push('Token missing user identifier (sub or userId)');
          }
          if (!decoded.exp) {
            issues.push('Token missing expiration time');
          } else {
            const isExpired = Date.now() >= decoded.exp * 1000;
            console.log('Token expired:', isExpired ? '✗ Yes' : '✓ No');
            if (isExpired) {
              issues.push('Token is expired');
            }
          }
          
          console.log('');
          console.log('Full payload:');
          console.log(decoded);
        } else {
          console.log('✗ Failed to decode token');
          issues.push('Failed to decode JWT token');
        }
      } else {
        issues.push('Invalid JWT format (expected 3 parts)');
      }
      console.log('');
    }

    // 3. Check Pinia store
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. PINIA AUTH STORE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if ((window as any).__PINIA__) {
      const pinia = (window as any).__PINIA__;
      const authStore = pinia.state.value?.auth;
      
      if (authStore) {
        console.log('✓ Auth store found');
        console.log('isAuthenticated:', authStore.isAuthenticated);
        console.log('user:', authStore.user ? '✓ Present' : '✗ Missing');
        console.log('accessToken:', authStore.accessToken ? '✓ Present' : '✗ Missing');
        console.log('');
        
        if (authStore.isAuthenticated && !authStore.accessToken) {
          issues.push('Auth store shows authenticated but has no token');
        }
        if (authStore.accessToken && !accessToken) {
          issues.push('Auth store has token but localStorage does not');
        }
      } else {
        console.log('✗ Auth store not found');
        issues.push('Auth store not found in Pinia');
      }
    } else {
      console.log('✗ Pinia not found');
      issues.push('Pinia not initialized');
    }
    console.log('');

    // 4. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4. SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (issues.length === 0) {
      console.log('✓ No issues found - authentication state looks good!');
    } else {
      console.log('✗ Issues found:');
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    console.log('');
    console.log('Status:', issues.length === 0 ? 'PASS' : 'FAIL');
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   END OF DIAGNOSTICS                                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    return {
      timestamp: new Date(),
      issues,
      status: issues.length === 0 ? 'PASS' : 'FAIL'
    };
  };

  console.log('✓ Browser diagnostics loaded!');
  console.log('Run: runBrowserDiagnostics()');
})();
