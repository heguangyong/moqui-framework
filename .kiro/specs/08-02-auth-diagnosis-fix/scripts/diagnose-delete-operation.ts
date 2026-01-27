/**
 * Delete Operation Diagnostic Script
 * 
 * Purpose: Test delete operation with authentication to identify why it's failing
 * Usage: Run in browser console after logging in with john.doe/moqui
 */

interface DeleteDiagnosticResult {
  timestamp: string
  authState: {
    isAuthenticated: boolean
    hasToken: boolean
    hasUserId: boolean
    hasUserData: boolean
    tokenPreview?: string
    userId?: string
    username?: string
  }
  tokenAnalysis: {
    isValid: boolean
    isExpired: boolean
    claims?: any
    error?: string
  }
  deleteTest: {
    endpoint: string
    method: string
    headers: any
    status?: number
    statusText?: string
    response?: any
    error?: string
  }
  recommendations: string[]
}

async function diagnoseDeleteOperation(): Promise<DeleteDiagnosticResult> {
  const result: DeleteDiagnosticResult = {
    timestamp: new Date().toISOString(),
    authState: {
      isAuthenticated: false,
      hasToken: false,
      hasUserId: false,
      hasUserData: false
    },
    tokenAnalysis: {
      isValid: false,
      isExpired: false
    },
    deleteTest: {
      endpoint: '',
      method: 'DELETE',
      headers: {}
    },
    recommendations: []
  }

  console.log('🔍 === Delete Operation Diagnostic ===\n')

  // Step 1: Check auth state
  console.log('📋 Step 1: Checking authentication state...')
  const token = localStorage.getItem('novel_anime_access_token')
  const userId = localStorage.getItem('novel_anime_user_id')
  const userData = localStorage.getItem('novel_anime_user_data')

  result.authState.hasToken = !!token
  result.authState.hasUserId = !!userId
  result.authState.hasUserData = !!userData
  result.authState.tokenPreview = token ? `${token.substring(0, 20)}...` : undefined
  result.authState.userId = userId || undefined

  if (userData) {
    try {
      const user = JSON.parse(userData)
      result.authState.username = user.username || user.name
    } catch (e) {
      console.error('Failed to parse user data:', e)
    }
  }

  // Check Pinia store
  if (window.__PINIA__) {
    const authStore = window.__PINIA__.state.value?.auth
    result.authState.isAuthenticated = authStore?.isAuthenticated || false
  }

  console.log('  ✓ Has token:', result.authState.hasToken)
  console.log('  ✓ Has userId:', result.authState.hasUserId, userId ? `(${userId})` : '')
  console.log('  ✓ Has userData:', result.authState.hasUserData)
  console.log('  ✓ Is authenticated:', result.authState.isAuthenticated)
  console.log('')

  // Step 2: Analyze token
  console.log('🔐 Step 2: Analyzing JWT token...')
  if (token) {
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        result.tokenAnalysis.claims = payload
        result.tokenAnalysis.isValid = true

        // Check expiration
        if (payload.exp) {
          const isExpired = Date.now() >= payload.exp * 1000
          result.tokenAnalysis.isExpired = isExpired
          console.log('  ✓ Token expiration:', new Date(payload.exp * 1000).toISOString())
          console.log('  ✓ Is expired:', isExpired ? '❌ YES' : '✅ NO')
        }

        // Check user claims
        console.log('  ✓ Token claims:')
        console.log('    - sub:', payload.sub || '❌ MISSING')
        console.log('    - userId:', payload.userId || '❌ MISSING')
        console.log('    - username:', payload.username || '❌ MISSING')
        console.log('    - roles:', payload.roles || payload.authorities || '❌ MISSING')
      } else {
        result.tokenAnalysis.error = 'Invalid token format'
        console.log('  ❌ Invalid token format')
      }
    } catch (e: any) {
      result.tokenAnalysis.error = e.message
      console.log('  ❌ Failed to decode token:', e.message)
    }
  } else {
    result.tokenAnalysis.error = 'No token found'
    console.log('  ❌ No token found')
  }
  console.log('')

  // Step 3: Test delete operation
  console.log('🗑️  Step 3: Testing DELETE operation...')
  
  // Get a test project ID (we'll use a dummy ID for testing)
  const testProjectId = 'TEST_PROJECT_ID'
  const baseUrl = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:8080'
  const endpoint = `${baseUrl}/rest/s1/novel-anime/projects/${testProjectId}`
  
  result.deleteTest.endpoint = endpoint
  
  // Prepare headers
  const headers: any = {
    'Content-Type': 'application/json'
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  result.deleteTest.headers = headers
  
  console.log('  ✓ Endpoint:', endpoint)
  console.log('  ✓ Headers:', JSON.stringify(headers, null, 2))
  console.log('')
  console.log('  ⚠️  Note: Using test project ID. Actual delete will fail with 404, but we can see auth errors.')
  console.log('')

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: headers
    })

    result.deleteTest.status = response.status
    result.deleteTest.statusText = response.statusText

    console.log('  ✓ Response status:', response.status, response.statusText)

    try {
      const data = await response.json()
      result.deleteTest.response = data
      console.log('  ✓ Response body:', JSON.stringify(data, null, 2))
    } catch (e) {
      console.log('  ⚠️  No JSON response body')
    }

    // Analyze response
    if (response.status === 401) {
      console.log('  ❌ AUTHENTICATION FAILED (401)')
      result.recommendations.push('Authentication failed - token is invalid or not recognized by backend')
    } else if (response.status === 403) {
      console.log('  ❌ AUTHORIZATION FAILED (403)')
      result.recommendations.push('User is authenticated but lacks permission to delete')
    } else if (response.status === 404) {
      console.log('  ✅ Authentication passed (404 means project not found, not auth issue)')
      result.recommendations.push('Authentication is working - 404 is expected for test project ID')
    } else if (response.status >= 200 && response.status < 300) {
      console.log('  ✅ Request successful')
    } else {
      console.log('  ⚠️  Unexpected status:', response.status)
    }

  } catch (error: any) {
    result.deleteTest.error = error.message
    console.log('  ❌ Request failed:', error.message)
    result.recommendations.push(`Network error: ${error.message}`)
  }

  console.log('')

  // Step 4: Generate recommendations
  console.log('💡 Recommendations:')
  
  if (!result.authState.hasToken) {
    result.recommendations.push('❌ No access token found - user needs to log in')
  }
  
  if (result.tokenAnalysis.isExpired) {
    result.recommendations.push('❌ Token is expired - user needs to refresh or re-login')
  }
  
  if (result.tokenAnalysis.claims && !result.tokenAnalysis.claims.userId && !result.tokenAnalysis.claims.sub) {
    result.recommendations.push('❌ Token missing user ID - backend login endpoint needs to include userId in JWT')
  }
  
  if (result.deleteTest.status === 401) {
    result.recommendations.push('❌ Backend is rejecting the token - check backend JWT validation configuration')
  }
  
  if (result.deleteTest.status === 403) {
    result.recommendations.push('❌ User lacks delete permission - check backend role/permission configuration')
  }
  
  if (!result.deleteTest.headers['Authorization']) {
    result.recommendations.push('❌ Authorization header not set - check API interceptor')
  }

  if (result.recommendations.length === 0) {
    result.recommendations.push('✅ No critical issues found - authentication appears to be working')
  }

  result.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`)
  })

  console.log('')
  console.log('🎯 === Diagnostic Complete ===')
  console.log('')
  console.log('Full result object:')
  console.log(result)

  return result
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Delete Operation Diagnostic Script Loaded')
  console.log('Run: diagnoseDeleteOperation()')
  console.log('')
  
  // Make it globally available
  ;(window as any).diagnoseDeleteOperation = diagnoseDeleteOperation
}

export { diagnoseDeleteOperation }
