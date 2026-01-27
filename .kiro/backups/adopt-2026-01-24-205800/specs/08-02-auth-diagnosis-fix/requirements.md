# Requirements Document

## Introduction

This spec addresses the persistent authentication issue in the Novel Anime Desktop application where the backend returns "User [No User] is not authorized" despite the frontend showing a logged-in state. The goal is to systematically diagnose the root cause and implement a robust fix.

## Glossary

- **Auth_Store**: Frontend Pinia store managing authentication state
- **JWT_Token**: JSON Web Token used for API authentication
- **Backend_API**: Moqui backend REST API endpoints
- **Authorization_Header**: HTTP header containing the Bearer token
- **Test_Account**: Development account (admin/admin) used for testing
- **Moqui**: Backend framework handling authentication and authorization

## Requirements

### Requirement 1: Authentication State Diagnosis

**User Story:** As a developer, I want to diagnose the authentication state across frontend and backend, so that I can identify where the authentication chain breaks.

#### Acceptance Criteria

1. WHEN a diagnostic script is executed, THE System SHALL verify the JWT token exists in localStorage
2. WHEN checking token validity, THE System SHALL decode the JWT token and display its payload contents
3. WHEN analyzing API requests, THE System SHALL log all Authorization headers being sent
4. WHEN testing backend authentication, THE System SHALL verify the backend receives and processes the token correctly
5. WHEN checking user session, THE System SHALL confirm the backend recognizes the authenticated user

### Requirement 2: Token Generation and Storage Verification

**User Story:** As a developer, I want to verify token generation and storage, so that I can ensure tokens are correctly created and persisted.

#### Acceptance Criteria

1. WHEN a user logs in, THE System SHALL generate a valid JWT token containing user information
2. WHEN tokens are persisted, THE System SHALL store both access_token and refresh_token in localStorage
3. WHEN tokens are persisted, THE System SHALL store userId and user object in localStorage
4. WHEN retrieving tokens, THE System SHALL correctly load all authentication data from localStorage
5. WHEN tokens expire, THE System SHALL handle token refresh or re-authentication

### Requirement 3: API Request Authentication

**User Story:** As a developer, I want to ensure API requests include proper authentication, so that the backend can authorize operations.

#### Acceptance Criteria

1. WHEN making API requests, THE System SHALL include the Authorization header with Bearer token format
2. WHEN the auth store has a valid token, THE System SHALL automatically attach it to all API requests
3. WHEN API requests fail with 401 status, THE System SHALL attempt token refresh or redirect to login
4. WHEN making DELETE requests, THE System SHALL include the same authentication as other requests
5. WHEN authentication fails, THE System SHALL provide clear error messages to the user

### Requirement 4: Backend Authentication Configuration

**User Story:** As a developer, I want to verify backend authentication configuration, so that I can ensure the backend correctly validates tokens.

#### Acceptance Criteria

1. WHEN the backend receives a request, THE System SHALL extract and validate the JWT token from the Authorization header
2. WHEN validating tokens, THE System SHALL verify token signature and expiration
3. WHEN a valid token is provided, THE System SHALL establish a user session with correct permissions
4. WHEN checking permissions, THE System SHALL verify the Test_Account has delete operation permissions
5. WHEN authentication fails, THE System SHALL return descriptive error messages indicating the failure reason

### Requirement 5: Comprehensive Testing and Validation

**User Story:** As a developer, I want comprehensive tests for the authentication flow, so that I can verify the fix works correctly.

#### Acceptance Criteria

1. WHEN running authentication tests, THE System SHALL verify login flow from start to finish
2. WHEN testing API operations, THE System SHALL verify authenticated requests succeed
3. WHEN testing delete operations, THE System SHALL verify projects can be deleted with proper authentication
4. WHEN testing token persistence, THE System SHALL verify tokens survive page reloads
5. WHEN testing error scenarios, THE System SHALL verify appropriate error handling for authentication failures

### Requirement 6: Diagnostic Tooling

**User Story:** As a developer, I want diagnostic tools to inspect authentication state, so that I can quickly identify issues in the future.

#### Acceptance Criteria

1. THE System SHALL provide a diagnostic script that checks frontend authentication state
2. THE System SHALL provide a diagnostic script that tests backend authentication endpoints
3. THE System SHALL provide a diagnostic script that validates JWT token structure and contents
4. THE System SHALL provide logging utilities that capture authentication-related events
5. THE System SHALL provide a comprehensive diagnostic report summarizing all authentication checks

### Requirement 7: Documentation and Troubleshooting Guide

**User Story:** As a developer, I want clear documentation of the authentication flow, so that I can maintain and troubleshoot it in the future.

#### Acceptance Criteria

1. THE System SHALL document the complete authentication flow from login to API request
2. THE System SHALL document the JWT token structure and required claims
3. THE System SHALL document common authentication issues and their solutions
4. THE System SHALL document the diagnostic tools and how to use them
5. THE System SHALL document the backend authentication configuration requirements
