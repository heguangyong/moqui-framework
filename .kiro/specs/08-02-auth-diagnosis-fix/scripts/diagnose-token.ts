/**
 * Token Authentication Diagnostic Script
 * Feature: 08-02-auth-diagnosis-fix
 * 
 * Decodes JWT tokens and validates their structure and claims.
 * Checks token expiration and required fields.
 */

import { jwtDecode } from 'jwt-decode';

export interface TokenDiagnosticResult {
  tokenPresent: boolean;
  tokenValid: boolean;
  decodedPayload: object | null;
  expirationTime: Date | null;
  isExpired: boolean;
  claims: {
    userId?: string;
    username?: string;
    roles?: string[];
    [key: string]: any;
  };
  issues: string[];
  status: 'PASS' | 'FAIL';
}

/**
 * Diagnose JWT token
 * Validates: Requirements 1.2, 4.2
 */
export function diagnoseToken(token: string | null): TokenDiagnosticResult {
  const issues: string[] = [];
  let tokenPresent = false;
  let tokenValid = false;
  let decodedPayload: object | null = null;
  let expirationTime: Date | null = null;
  let isExpired = false;
  let claims: any = {};

  if (!token) {
    issues.push('Token is null or undefined');
    return {
      tokenPresent,
      tokenValid,
      decodedPayload,
      expirationTime,
      isExpired,
      claims,
      issues,
      status: 'FAIL'
    };
  }

  tokenPresent = true;

  // Check token format (should be JWT with 3 parts)
  const parts = token.split('.');
  if (parts.length !== 3) {
    issues.push(`Invalid JWT format: expected 3 parts, got ${parts.length}`);
    return {
      tokenPresent,
      tokenValid,
      decodedPayload,
      expirationTime,
      isExpired,
      claims,
      issues,
      status: 'FAIL'
    };
  }

  // Try to decode token
  try {
    decodedPayload = jwtDecode(token);
    claims = decodedPayload as any;
    tokenValid = true;
  } catch (e) {
    issues.push(`Failed to decode JWT: ${e}`);
    return {
      tokenPresent,
      tokenValid,
      decodedPayload,
      expirationTime,
      isExpired,
      claims,
      issues,
      status: 'FAIL'
    };
  }

  // Check required claims
  const requiredClaims = ['exp', 'iat'];
  const missingClaims = requiredClaims.filter(claim => !(claim in claims));
  if (missingClaims.length > 0) {
    issues.push(`Missing required claims: ${missingClaims.join(', ')}`);
  }

  // Check for userId (can be in 'sub' or 'userId' claim)
  if (!claims.sub && !claims.userId) {
    issues.push('Missing user identifier (sub or userId claim)');
  }

  // Check expiration
  if (claims.exp) {
    expirationTime = new Date(claims.exp * 1000);
    isExpired = Date.now() >= claims.exp * 1000;
    
    if (isExpired) {
      issues.push(`Token is expired (expired at ${expirationTime.toISOString()})`);
    }
  } else {
    issues.push('Token has no expiration time (exp claim)');
  }

  // Check issued at time
  if (claims.iat) {
    const issuedAt = new Date(claims.iat * 1000);
    if (issuedAt > new Date()) {
      issues.push('Token issued in the future (invalid iat claim)');
    }
  }

  const status = issues.length === 0 ? 'PASS' : 'FAIL';

  return {
    tokenPresent,
    tokenValid,
    decodedPayload,
    expirationTime,
    isExpired,
    claims,
    issues,
    status
  };
}

/**
 * Run diagnostic and log results
 */
export function runTokenDiagnostic(token?: string | null): TokenDiagnosticResult {
  console.log('=== Token Authentication Diagnostic ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('');

  // Get token from localStorage if not provided
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('novel_anime_access_token');
  }

  const result = diagnoseToken(token);

  console.log('Token Status:');
  console.log('  Present:', result.tokenPresent ? '✓' : '✗');
  console.log('  Valid Format:', result.tokenValid ? '✓' : '✗');
  console.log('  Expired:', result.isExpired ? '✗ Yes' : '✓ No');
  console.log('');

  if (result.expirationTime) {
    console.log('Token Expiration:');
    console.log('  Expires at:', result.expirationTime.toISOString());
    console.log('  Time remaining:', result.isExpired ? 'Expired' : 
      Math.floor((result.expirationTime.getTime() - Date.now()) / 1000 / 60) + ' minutes');
    console.log('');
  }

  if (result.decodedPayload) {
    console.log('Token Claims:');
    const claims = result.claims;
    console.log('  User ID (sub):', claims.sub || 'Missing');
    console.log('  User ID (userId):', claims.userId || 'Missing');
    console.log('  Username:', claims.username || claims.preferred_username || 'Missing');
    console.log('  Roles:', claims.roles || claims.realm_access?.roles || 'Missing');
    console.log('  Issuer (iss):', claims.iss || 'Missing');
    console.log('  Audience (aud):', claims.aud || 'Missing');
    console.log('');
    
    console.log('  All Claims:');
    Object.keys(claims).forEach(key => {
      if (!['sub', 'userId', 'username', 'roles', 'iss', 'aud', 'exp', 'iat', 'nbf'].includes(key)) {
        console.log(`    ${key}:`, claims[key]);
      }
    });
    console.log('');
  }

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
  console.log('======================================');

  return result;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).diagnoseToken = runTokenDiagnostic;
}
