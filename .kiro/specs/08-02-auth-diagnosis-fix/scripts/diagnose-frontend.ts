/**
 * Frontend Authentication Diagnostic Script
 * Feature: 08-02-auth-diagnosis-fix
 * 
 * Checks frontend authentication state including localStorage and auth store.
 * Identifies missing or inconsistent authentication data.
 */

export interface FrontendDiagnosticResult {
  localStorageTokens: {
    access_token: string | null;
    refresh_token: string | null;
    userId: string | null;
    user: object | null;
  };
  authStoreState: {
    isAuthenticated: boolean;
    currentUser: object | null;
    token: string | null;
  };
  issues: string[];
  status: 'PASS' | 'FAIL';
}

/**
 * Diagnose frontend authentication state
 * Validates: Requirements 1.1, 6.1
 */
export function diagnoseFrontend(): FrontendDiagnosticResult {
  const issues: string[] = [];

  // Check localStorage
  const localStorageTokens = {
    access_token: localStorage.getItem('novel_anime_access_token'),
    refresh_token: localStorage.getItem('novel_anime_refresh_token'),
    userId: localStorage.getItem('novel_anime_user_id'),
    user: null as object | null
  };

  // Try to parse user object
  const userStr = localStorage.getItem('novel_anime_user_data');
  if (userStr) {
    try {
      localStorageTokens.user = JSON.parse(userStr);
    } catch (e) {
      issues.push('localStorage user data is not valid JSON');
    }
  }

  // Check for missing tokens
  if (!localStorageTokens.access_token) {
    issues.push('Missing access_token in localStorage');
  }
  if (!localStorageTokens.refresh_token) {
    issues.push('Missing refresh_token in localStorage');
  }
  if (!localStorageTokens.userId) {
    issues.push('Missing userId in localStorage');
  }
  if (!localStorageTokens.user) {
    issues.push('Missing user object in localStorage');
  }

  // Check auth store state (if available in browser context)
  let authStoreState = {
    isAuthenticated: false,
    currentUser: null,
    token: null
  };

  // In browser context, try to access Pinia store
  if (typeof window !== 'undefined' && (window as any).__PINIA__) {
    try {
      const pinia = (window as any).__PINIA__;
      const authStore = pinia.state.value?.auth;
      
      if (authStore) {
        authStoreState = {
          isAuthenticated: authStore.isAuthenticated || false,
          currentUser: authStore.user || null,
          token: authStore.accessToken || null
        };

        // Check for inconsistencies
        if (authStoreState.isAuthenticated && !authStoreState.token) {
          issues.push('Auth store shows authenticated but has no token');
        }
        if (authStoreState.token && !localStorageTokens.access_token) {
          issues.push('Auth store has token but localStorage does not');
        }
        if (!authStoreState.token && localStorageTokens.access_token) {
          issues.push('localStorage has token but auth store does not');
        }
        if (authStoreState.isAuthenticated && !authStoreState.currentUser) {
          issues.push('Auth store shows authenticated but has no user');
        }
      } else {
        issues.push('Auth store not found in Pinia state');
      }
    } catch (e) {
      issues.push(`Error accessing auth store: ${e}`);
    }
  }

  const status = issues.length === 0 ? 'PASS' : 'FAIL';

  return {
    localStorageTokens,
    authStoreState,
    issues,
    status
  };
}

/**
 * Run diagnostic and log results
 */
export function runFrontendDiagnostic(): void {
  console.log('=== Frontend Authentication Diagnostic ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('');

  const result = diagnoseFrontend();

  console.log('LocalStorage Tokens:');
  console.log('  access_token:', result.localStorageTokens.access_token ? '✓ Present' : '✗ Missing');
  console.log('  refresh_token:', result.localStorageTokens.refresh_token ? '✓ Present' : '✗ Missing');
  console.log('  userId:', result.localStorageTokens.userId || '✗ Missing');
  console.log('  user:', result.localStorageTokens.user ? '✓ Present' : '✗ Missing');
  console.log('');

  console.log('Auth Store State:');
  console.log('  isAuthenticated:', result.authStoreState.isAuthenticated);
  console.log('  currentUser:', result.authStoreState.currentUser ? '✓ Present' : '✗ Missing');
  console.log('  token:', result.authStoreState.token ? '✓ Present' : '✗ Missing');
  console.log('');

  if (result.issues.length > 0) {
    console.log('Issues Found:');
    result.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  } else {
    console.log('✓ No issues found');
  }

  console.log('');
  console.log('Status:', result.status);
  console.log('==========================================');

  return result;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).diagnoseFrontend = runFrontendDiagnostic;
}
