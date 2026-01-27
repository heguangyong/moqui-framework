# Implementation Plan: Fix Novel Import Project ID Mismatch

## Overview

This implementation plan addresses the project ID mismatch bug by modifying the frontend's `DashboardView.vue` component to correctly capture and use the backend-returned projectId throughout the novel import workflow. The fix is entirely frontend-focused, with no backend changes required.

## Tasks

- [x] 1. Modify DashboardView.vue to extract and use backend projectId
  - Update the `uploadNovelToBackend()` function to capture the projectId from the backend's project creation response
  - Ensure the backend projectId is used in the novel import API call
  - Add validation to check that projectId exists before proceeding
  - Add console logging for debugging
  - _Requirements: 1.1, 1.2, 1.3, 3.1_

- [ ]* 1.1 Write property test for backend projectId storage
  - **Property 1: Backend ProjectId Storage**
  - **Validates: Requirements 1.1, 2.2, 4.1**

- [ ]* 1.2 Write property test for projectId consistency throughout workflow
  - **Property 2: ProjectId Consistency Throughout Workflow**
  - **Validates: Requirements 1.2, 2.3, 4.3, 5.2, 5.4**

- [ ]* 1.3 Write property test for no client-generated IDs in backend calls
  - **Property 4: No Client-Generated IDs in Backend Calls**
  - **Validates: Requirements 1.4**

- [ ] 2. Update ProjectStore to ensure correct projectId handling
  - [ ] 2.1 Verify createProject() returns complete backend response
    - Ensure the method returns the full project object including projectId
    - Verify no client-generated ID overwrites the backend projectId
    - _Requirements: 2.1, 2.2_
  
  - [ ] 2.2 Update setCurrentProject() to accept backend projectId
    - Modify the method to accept projectId as a parameter
    - Fetch project details from backend using the provided projectId
    - Store the project with the backend projectId in state and local storage
    - _Requirements: 4.1, 4.4_

- [ ]* 2.3 Write property test for local storage persistence
  - **Property 7: Local Storage Persistence**
  - **Validates: Requirements 4.4**

- [ ] 3. Add error handling and validation
  - [ ] 3.1 Add projectId validation before novel import
    - Check that backend projectId exists and is non-empty
    - Throw descriptive error if projectId is missing
    - _Requirements: 3.1, 3.2_
  
  - [ ] 3.2 Add error handling for API failures
    - Catch and display backend error messages
    - Handle network failures gracefully
    - Show user-friendly error messages
    - _Requirements: 3.3_

- [ ]* 3.3 Write unit tests for error conditions
  - Test missing projectId scenario
  - Test backend "Project not found" error
  - Test network failure handling
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4. Update ProjectManager.js documentation
  - Add clear comments that client-generated IDs are for local use only
  - Document that backend API calls must use backend-generated projectIds
  - Consider renaming `generateProjectId()` to `generateLocalProjectId()` for clarity
  - _Requirements: 1.4, 2.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Test the complete workflow manually: create project → import novel → navigate
  - Verify console logs show correct projectId usage
  - Ask the user if questions arise

- [ ]* 6. Write integration tests for complete workflow
  - Test end-to-end: file selection → project creation → novel import → navigation
  - Verify projectId consistency throughout the workflow
  - Test with various project names and descriptions
  - _Requirements: 5.1, 5.3, 5.4_

- [ ] 7. Final verification and cleanup
  - Verify no client-generated IDs appear in backend API calls
  - Verify all error scenarios are handled gracefully
  - Verify console logging is present for debugging
  - Remove any temporary debugging code
  - Update any relevant documentation
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The fix is entirely frontend-focused - no backend changes required
- The backend's existing error handling is correct and should be maintained
- Property tests should run with minimum 100 iterations each
- Each property test must reference its design document property in a comment
- Focus on ensuring the backend projectId flows correctly through the entire workflow
