/**
 * Master Diagnostic Script
 * Feature: 08-02-auth-diagnosis-fix
 * 
 * Runs all diagnostic scripts in sequence and generates a comprehensive report.
 * Validates: Requirements 6.5
 */

import { diagnoseFrontend, FrontendDiagnosticResult } from './diagnose-frontend';
import { diagnoseToken, TokenDiagnosticResult } from './diagnose-token';
import { diagnoseAPI, APIDiagnosticResult } from './diagnose-api';

export interface DiagnosticReport {
  timestamp: Date;
  frontend: FrontendDiagnosticResult;
  token: TokenDiagnosticResult;
  api: APIDiagnosticResult;
  backend: {
    note: string;
    instructions: string;
  };
  summary: {
    overallStatus: 'PASS' | 'FAIL';
    criticalIssues: string[];
    recommendations: string[];
  };
}

/**
 * Run all diagnostics and generate comprehensive report
 */
export async function runAllDiagnostics(): Promise<DiagnosticReport> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE AUTHENTICATION DIAGNOSTIC REPORT           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  const timestamp = new Date();
  console.log('Timestamp:', timestamp.toISOString());
  console.log('');
  console.log('Running diagnostics...');
  console.log('');

  // 1. Frontend Diagnostics
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. FRONTEND DIAGNOSTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const frontendResult = diagnoseFrontend();
  console.log('Status:', frontendResult.status);
  console.log('Issues:', frontendResult.issues.length);
  console.log('');

  // 2. Token Diagnostics
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2. TOKEN DIAGNOSTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const token = frontendResult.localStorageTokens.access_token;
  const tokenResult = diagnoseToken(token);
  console.log('Status:', tokenResult.status);
  console.log('Issues:', tokenResult.issues.length);
  console.log('');

  // 3. API Diagnostics
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3. API DIAGNOSTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080';
  const apiResult = await diagnoseAPI(`${baseURL}/rest/s1/novelanime/projects`, 'GET', token);
  console.log('Status:', apiResult.status);
  console.log('Issues:', apiResult.issues.length);
  console.log('');

  // 4. Backend Diagnostics (manual)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4. BACKEND DIAGNOSTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const backendNote = 'Backend diagnostics require shell script execution';
  const backendInstructions = 'Run: .kiro/specs/08-02-auth-diagnosis-fix/scripts/diagnose-backend.sh';
  console.log('Note:', backendNote);
  console.log('Instructions:', backendInstructions);
  console.log('');

  // Generate summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5. SUMMARY AND RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const criticalIssues: string[] = [];
  const recommendations: string[] = [];

  // Analyze frontend issues
  if (!frontendResult.localStorageTokens.access_token) {
    criticalIssues.push('CRITICAL: No access token in localStorage');
    recommendations.push('User needs to log in to generate a token');
  }
  if (!frontendResult.localStorageTokens.userId) {
    criticalIssues.push('CRITICAL: No userId in localStorage');
    recommendations.push('Fix persistTokens() in auth store to save userId');
  }
  if (frontendResult.authStoreState.isAuthenticated && !frontendResult.authStoreState.token) {
    criticalIssues.push('CRITICAL: Auth store shows authenticated but has no token');
    recommendations.push('Fix auth store state synchronization');
  }

  // Analyze token issues
  if (!tokenResult.tokenPresent) {
    criticalIssues.push('CRITICAL: Token is missing');
  } else if (!tokenResult.tokenValid) {
    criticalIssues.push('CRITICAL: Token has invalid format');
    recommendations.push('Check login endpoint response format');
  } else if (tokenResult.isExpired) {
    criticalIssues.push('CRITICAL: Token is expired');
    recommendations.push('Implement token refresh or re-authenticate');
  }
  if (tokenResult.claims && !tokenResult.claims.sub && !tokenResult.claims.userId) {
    criticalIssues.push('CRITICAL: Token missing user identifier (sub or userId)');
    recommendations.push('Backend must include userId in JWT token');
  }

  // Analyze API issues
  if (!apiResult.authorizationHeader) {
    criticalIssues.push('CRITICAL: Authorization header not sent with API requests');
    recommendations.push('Fix API service request interceptor');
  } else if (!apiResult.authorizationHeader.startsWith('Bearer ')) {
    criticalIssues.push('CRITICAL: Authorization header has invalid format');
    recommendations.push('Ensure format is "Bearer {token}"');
  }
  if (apiResult.responseStatus === 401) {
    criticalIssues.push('CRITICAL: Backend rejected token (401 Unauthorized)');
    recommendations.push('Verify backend token validation configuration');
  }
  if (!apiResult.backendUserRecognized) {
    criticalIssues.push('CRITICAL: Backend did not recognize user');
    recommendations.push('Check backend user session establishment');
  }

  const overallStatus = criticalIssues.length === 0 ? 'PASS' : 'FAIL';

  console.log('Overall Status:', overallStatus);
  console.log('');

  if (criticalIssues.length > 0) {
    console.log('Critical Issues:');
    criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    console.log('');
  }

  if (recommendations.length > 0) {
    console.log('Recommendations:');
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log('');
  }

  if (overallStatus === 'PASS') {
    console.log('✓ All diagnostics passed! Authentication system is working correctly.');
  } else {
    console.log('✗ Diagnostics failed. Please address the critical issues above.');
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   END OF DIAGNOSTIC REPORT                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Create report object
  const report: DiagnosticReport = {
    timestamp,
    frontend: frontendResult,
    token: tokenResult,
    api: apiResult,
    backend: {
      note: backendNote,
      instructions: backendInstructions
    },
    summary: {
      overallStatus,
      criticalIssues,
      recommendations
    }
  };

  // Save report to file
  const reportPath = `.kiro/specs/08-02-auth-diagnosis-fix/reports/diagnostic-${timestamp.toISOString().replace(/:/g, '-')}.json`;
  const reportJSON = JSON.stringify(report, null, 2);
  
  console.log('');
  console.log('Report saved to:', reportPath);
  console.log('');

  // In Node.js environment, save to file
  if (typeof window === 'undefined') {
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(reportPath, reportJSON);
  }

  return report;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).runAllDiagnostics = runAllDiagnostics;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDiagnostics().catch(console.error);
}
