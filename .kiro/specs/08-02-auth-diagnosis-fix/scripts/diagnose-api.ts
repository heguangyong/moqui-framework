/**
 * API Authentication Diagnostic Script
 * Feature: 08-02-auth-diagnosis-fix
 * 
 * Tests API endpoints with authentication and logs request/response details.
 * Verifies Authorization header presence and format.
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface APIDiagnosticResult {
  requestHeaders: Record<string, string>;
  authorizationHeader: string | null;
  responseStatus: number | null;
  responseBody: any;
  backendUserRecognized: boolean;
  issues: string[];
  status: 'PASS' | 'FAIL';
}

/**
 * Diagnose API authentication
 * Validates: Requirements 1.3, 3.1, 3.2
 */
export async function diagnoseAPI(
  endpoint: string,
  method: string = 'GET',
  token?: string | null
): Promise<APIDiagnosticResult> {
  const issues: string[] = [];
  let requestHeaders: Record<string, string> = {};
  let authorizationHeader: string | null = null;
  let responseStatus: number | null = null;
  let responseBody: any = null;
  let backendUserRecognized = false;

  // Get token from localStorage if not provided
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('novel_anime_access_token');
  }

  if (!token) {
    issues.push('No token available for API request');
    return {
      requestHeaders,
      authorizationHeader,
      responseStatus,
      responseBody,
      backendUserRecognized,
      issues,
      status: 'FAIL'
    };
  }

  // Prepare request config
  const config: AxiosRequestConfig = {
    method: method.toUpperCase(),
    url: endpoint,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Capture request headers
  requestHeaders = { ...config.headers } as Record<string, string>;
  authorizationHeader = requestHeaders['Authorization'] || null;

  // Validate Authorization header format
  if (!authorizationHeader) {
    issues.push('Authorization header is missing');
  } else if (!authorizationHeader.startsWith('Bearer ')) {
    issues.push(`Authorization header has invalid format: ${authorizationHeader}`);
  }

  // Make API request
  try {
    const response: AxiosResponse = await axios(config);
    responseStatus = response.status;
    responseBody = response.data;

    // Check if backend recognized the user
    if (responseBody && typeof responseBody === 'object') {
      // Look for user information in response
      if (responseBody.userId || responseBody.user || responseBody.username) {
        backendUserRecognized = true;
      }
      
      // Check for "No User" error message
      if (JSON.stringify(responseBody).includes('[No User]')) {
        issues.push('Backend returned "[No User]" - user not recognized');
        backendUserRecognized = false;
      }
    }

    if (responseStatus >= 200 && responseStatus < 300) {
      // Success - but still check if user was recognized
      if (!backendUserRecognized && method !== 'GET') {
        issues.push('Request succeeded but backend may not have recognized user');
      }
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    responseStatus = axiosError.response?.status || null;
    responseBody = axiosError.response?.data || axiosError.message;

    if (responseStatus === 401) {
      issues.push('Backend returned 401 Unauthorized - token not accepted');
    } else if (responseStatus === 403) {
      issues.push('Backend returned 403 Forbidden - insufficient permissions');
    } else {
      issues.push(`API request failed: ${axiosError.message}`);
    }

    // Check for "No User" in error message
    if (JSON.stringify(responseBody).includes('[No User]')) {
      issues.push('Backend returned "[No User]" - user not recognized');
      backendUserRecognized = false;
    }
  }

  const status = issues.length === 0 ? 'PASS' : 'FAIL';

  return {
    requestHeaders,
    authorizationHeader,
    responseStatus,
    responseBody,
    backendUserRecognized,
    issues,
    status
  };
}

/**
 * Run diagnostic and log results
 */
export async function runAPIDiagnostic(
  endpoint?: string,
  method: string = 'GET',
  token?: string | null
): Promise<APIDiagnosticResult> {
  console.log('=== API Authentication Diagnostic ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('');

  // Use default endpoint if not provided
  if (!endpoint) {
    // Try to get base URL from environment or use default
    const baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080';
    endpoint = `${baseURL}/rest/s1/novelanime/projects`;
  }

  console.log('Testing Endpoint:', endpoint);
  console.log('Method:', method);
  console.log('');

  const result = await diagnoseAPI(endpoint, method, token);

  console.log('Request Headers:');
  Object.entries(result.requestHeaders).forEach(([key, value]) => {
    if (key === 'Authorization') {
      // Mask token for security
      const parts = value.split(' ');
      if (parts.length === 2) {
        const maskedToken = parts[1].substring(0, 10) + '...' + parts[1].substring(parts[1].length - 10);
        console.log(`  ${key}: Bearer ${maskedToken}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });
  console.log('');

  console.log('Authorization Header:');
  console.log('  Present:', result.authorizationHeader ? '✓' : '✗');
  console.log('  Format:', result.authorizationHeader?.startsWith('Bearer ') ? '✓ Valid' : '✗ Invalid');
  console.log('');

  console.log('Response:');
  console.log('  Status:', result.responseStatus || 'No response');
  console.log('  Backend User Recognized:', result.backendUserRecognized ? '✓ Yes' : '✗ No');
  console.log('');

  if (result.responseBody) {
    console.log('Response Body:');
    console.log(JSON.stringify(result.responseBody, null, 2));
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
  console.log('====================================');

  return result;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).diagnoseAPI = runAPIDiagnostic;
}
