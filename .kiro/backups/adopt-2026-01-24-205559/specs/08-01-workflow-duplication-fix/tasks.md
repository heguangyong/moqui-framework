# Implementation Plan: Workflow Duplication Fix

## Overview

This implementation plan breaks down the workflow duplication fix into discrete, incremental tasks. The approach focuses on:
1. Extending the WorkflowStore with project-workflow mapping capabilities
2. Updating the Workflow data model to include projectId
3. Refactoring WorkflowEditor to use store-level state
4. Adding cleanup and duplicate prevention logic
5. Implementing comprehensive tests

## Tasks

- [x] 1. Extend Workflow data model and WorkflowStore state
  - Add `projectId` field to Workflow interface in `types/workflow.ts`
  - Add `projectWorkflowMap: Map<string, string>` to WorkflowState
  - Add `isCreatingWorkflowForProject: string | null` to WorkflowState
  - _Requirements: 5.1, 5.2, 8.1, 8.2_

- [x] 2. Implement project-workflow mapping methods in WorkflowStore
  - [x] 2.1 Implement `getWorkflowByProjectId(projectId: string): Workflow | null`
    - Check mapping cache first
    - Fall back to searching workflows array
    - Update cache if found through search
    - Clean up stale mappings
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [x] 2.2 Implement `setProjectWorkflowMapping(projectId: string, workflowId: string): void`
    - Add mapping to Map
    - Call persistProjectWorkflowMap
    - _Requirements: 5.2_
  
  - [x] 2.3 Implement `clearProjectWorkflowMapping(projectId: string): void`
    - Remove mapping from Map
    - Call persistProjectWorkflowMap
    - _Requirements: 5.4_
  
  - [x] 2.4 Implement `persistProjectWorkflowMap(): void`
    - Convert Map to plain object
    - Store in localStorage with key 'novel_anime_project_workflow_map'
    - _Requirements: 5.5_
  
  - [x] 2.5 Implement `loadProjectWorkflowMap(): void`
    - Load from localStorage
    - Parse JSON and convert to Map
    - Handle errors gracefully
    - _Requirements: 5.5_

- [x] 3. Implement workflow creation and cleanup methods
  - [x] 3.1 Implement `createWorkflowForProject(projectId, template, projectName): Promise<Workflow | null>`
    - Check if already creating for this project (return null if true)
    - Check if workflow already exists (return existing if true)
    - Set isCreatingWorkflowForProject flag
    - Create workflow with projectId
    - Add template nodes
    - Set project-workflow mapping
    - Save to backend
    - Clear flag in finally block
    - _Requirements: 1.1, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 3.2 Implement `addTemplateNodesToWorkflow(workflowId, template): Promise<void>`
    - Add nodes from template
    - Connect nodes sequentially
    - _Requirements: 1.1_
  
  - [x] 3.3 Implement `cleanupEmptyWorkflows(projectId?: string): Promise<number>`
    - Find workflows with zero nodes
    - Filter by projectId if provided
    - Delete empty workflows
    - Return count of deleted workflows
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 3.4 Implement `getNodeTitle(type: string): string` helper
    - Return display title for node type
    - _Requirements: 1.1_

- [x] 4. Update WorkflowStore initialization
  - [x] 4.1 Call `loadProjectWorkflowMap()` in initialize method
    - Load mappings from localStorage on store init
    - _Requirements: 5.5_
  
  - [x] 4.2 Update `createWorkflow` to accept optional projectId parameter
    - Pass projectId to backend API
    - _Requirements: 8.1, 8.3_

- [x] 5. Checkpoint - Ensure store methods work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Refactor WorkflowEditor component
  - [x] 6.1 Remove component-level flags
    - Remove `isAutoApplyingTemplate` ref
    - Remove `hasAutoAppliedTemplate` ref
    - _Requirements: 2.3, 5.1_
  
  - [x] 6.2 Update `autoApplyTemplate` function
    - Get template from templates array
    - Call `workflowStore.createWorkflowForProject`
    - Handle null return (already in progress)
    - Select workflow and update navigation context
    - Show appropriate notifications
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_
  
  - [x] 6.3 Update `useTemplate` function
    - Get projectId from context or projectStore
    - Check if workflow exists using `getWorkflowByProjectId`
    - If exists, switch to it
    - If not exists, call `createWorkflowForProject`
    - Update navigation context
    - Show appropriate notifications
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 6.4 Update `initializeEditor` function
    - Call `workflowStore.loadProjectWorkflowMap()`
    - Call `workflowStore.cleanupEmptyWorkflows()`
    - Log cleanup results
    - _Requirements: 4.1, 4.5, 5.5_

- [x] 7. Update backend API to support projectId
  - [x] 7.1 Update workflow creation endpoint to accept projectId
    - Modify request payload to include projectId
    - Store projectId in database
    - _Requirements: 8.3_
  
  - [x] 7.2 Update workflow retrieval to include projectId
    - Include projectId in response payload
    - _Requirements: 8.4_

- [x] 8. Checkpoint - Ensure component integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Write unit tests for WorkflowStore methods
  - [ ]* 9.1 Write unit tests for project-workflow mapping
    - Test setProjectWorkflowMapping
    - Test getWorkflowByProjectId with cached mapping
    - Test getWorkflowByProjectId with search fallback
    - Test clearProjectWorkflowMapping
    - Test stale mapping cleanup
    - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.5_
  
  - [ ]* 9.2 Write unit tests for persistence
    - Test persistProjectWorkflowMap
    - Test loadProjectWorkflowMap with valid data
    - Test loadProjectWorkflowMap with corrupted data
    - _Requirements: 5.5_
  
  - [ ]* 9.3 Write unit tests for workflow creation
    - Test createWorkflowForProject with new project
    - Test createWorkflowForProject with existing workflow
    - Test createWorkflowForProject with empty existing workflow
    - Test createWorkflowForProject concurrent calls
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3_
  
  - [ ]* 9.4 Write unit tests for cleanup
    - Test cleanupEmptyWorkflows with single empty workflow
    - Test cleanupEmptyWorkflows with multiple empty workflows
    - Test cleanupEmptyWorkflows preserves workflows with nodes
    - Test cleanupEmptyWorkflows with projectId filter
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 10. Write property-based tests
  - [ ]* 10.1 Write property test for unique workflow per project
    - **Property 1: Unique Workflow Per Project**
    - **Validates: Requirements 1.1, 1.4**
    - Generate random project IDs and create workflows
    - Verify only one workflow exists per project
    - Run 100+ iterations
  
  - [ ]* 10.2 Write property test for mapping consistency
    - **Property 2: Mapping Consistency**
    - **Validates: Requirements 5.2, 5.3**
    - Generate random mappings and workflows
    - Verify all mapped workflow IDs exist in workflows array
    - Run 100+ iterations
  
  - [ ]* 10.3 Write property test for creation flag cleanup
    - **Property 3: Creation Flag Cleanup**
    - **Validates: Requirements 7.4, 7.5**
    - Simulate random creation operations (success/failure)
    - Verify flag is always null after completion
    - Run 100+ iterations
  
  - [ ]* 10.4 Write property test for empty workflow cleanup
    - **Property 4: Empty Workflow Cleanup**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Generate random workflows (some empty, some with nodes)
    - Run cleanup and verify no empty workflows remain
    - Run 100+ iterations
  
  - [ ]* 10.5 Write property test for persistence round trip
    - **Property 5: Persistence Round Trip**
    - **Validates: Requirements 5.5**
    - Generate random project-workflow mappings
    - Persist and load, verify equivalence
    - Run 100+ iterations
  
  - [ ]* 10.6 Write property test for concurrent creation prevention
    - **Property 6: Concurrent Creation Prevention**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Simulate concurrent creation calls for same project
    - Verify only one workflow is created
    - Run 100+ iterations
  
  - [ ]* 10.7 Write property test for workflow lookup correctness
    - **Property 7: Workflow Lookup Correctness**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - Generate random workflows with project IDs
    - Test lookup with and without cache
    - Verify correct workflow is always returned
    - Run 100+ iterations
  
  - [ ]* 10.8 Write property test for navigation state preservation
    - **Property 8: Navigation State Preservation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Simulate component mount/unmount cycles
    - Verify same workflow is used after remount
    - Run 100+ iterations

- [ ] 11. Write integration tests
  - [ ]* 11.1 Write end-to-end workflow creation test
    - Test complete flow from Dashboard to WorkflowEditor
    - Verify single workflow is created
    - Verify navigation back and forth doesn't create duplicates
    - _Requirements: 1.1, 2.1, 2.2_
  
  - [ ]* 11.2 Write template application flow test
    - Test auto-apply from Dashboard
    - Test manual template button click
    - Verify both use same workflow
    - _Requirements: 1.1, 3.1, 3.2, 3.3_
  
  - [ ]* 11.3 Write multi-project scenario test
    - Create multiple projects
    - Verify each has its own workflow
    - Verify no cross-contamination
    - _Requirements: 1.1, 1.5_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript as specified in the design document
- All store methods should be synchronous except for those that call backend APIs
- localStorage operations should handle errors gracefully
- The fix maintains backward compatibility with existing workflows that don't have projectId
