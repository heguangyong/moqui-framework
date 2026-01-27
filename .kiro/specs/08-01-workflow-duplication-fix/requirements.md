# Requirements Document: Workflow Duplication Fix

## Introduction

This specification addresses the workflow duplication issue in the Novel Anime Desktop application. Users are experiencing duplicate workflows being created when using templates and navigating between pages. The root cause is that the component-level flags (`isAutoApplyingTemplate`, `hasAutoAppliedTemplate`) are reset when the component unmounts, causing the system to lose track of whether a workflow has already been created for a project.

## Glossary

- **Workflow**: A directed graph of processing nodes that defines how a novel is converted to anime
- **Template**: A predefined workflow configuration with specific nodes and connections
- **WorkflowEditor**: The Vue component responsible for displaying and editing workflows
- **WorkflowStore**: The Pinia store that manages workflow state and persistence
- **NavigationStore**: The Pinia store that manages navigation context and panel state
- **ProjectId**: A unique identifier for a project that links workflows to projects
- **AutoApplyTemplate**: The automatic workflow creation that occurs when a user clicks "继续处理" from Dashboard
- **Component Lifecycle**: The mounting and unmounting of Vue components as users navigate

## Requirements

### Requirement 1: Single Workflow Per Project

**User Story:** As a user, when I create a new project and import a novel, I want only ONE workflow to be created automatically, so that I don't have duplicate or empty workflows cluttering my workspace.

#### Acceptance Criteria

1. WHEN a user clicks "继续处理" from Dashboard with a new project, THE System SHALL create exactly one workflow with template nodes
2. WHEN checking for existing workflows, THE System SHALL prioritize workflows that match the current projectId
3. IF an empty workflow exists for the project, THE System SHALL reuse it by adding template nodes instead of creating a new workflow
4. THE System SHALL NOT create multiple workflows for the same project during the auto-apply process
5. WHEN a workflow is created for a project, THE System SHALL store the project-workflow mapping persistently

### Requirement 2: Navigation Persistence

**User Story:** As a user, when I navigate away from the workflow editor and come back, I want to see the same workflow without any duplicates being created, so that my work is preserved and organized.

#### Acceptance Criteria

1. WHEN a user navigates away from WorkflowEditor and returns, THE System SHALL remember which workflow was created for the project
2. THE System SHALL NOT create a new workflow when the component remounts
3. WHEN the WorkflowEditor component unmounts, THE System SHALL persist the workflow creation state in the store
4. WHEN the WorkflowEditor component mounts, THE System SHALL check the store for existing project-workflow mappings
5. THE System SHALL maintain workflow state across component lifecycle events

### Requirement 3: Template Button Behavior

**User Story:** As a user, when I click the "使用此模板" button and a workflow was already created automatically, I want it to switch to the existing workflow instead of creating a duplicate, so that I don't end up with multiple identical workflows.

#### Acceptance Criteria

1. WHEN the "使用此模板" button is clicked, THE System SHALL check if a workflow already exists for the current project
2. IF a workflow exists with nodes, THE System SHALL switch to that workflow and display a notification
3. IF a workflow exists but is empty, THE System SHALL add template nodes to it instead of creating a new workflow
4. THE System SHALL NOT create a new workflow if one already exists for the project
5. WHEN switching to an existing workflow, THE System SHALL update the navigation context to show the workflow detail view

### Requirement 4: Empty Workflow Cleanup

**User Story:** As a developer, I want the system to automatically clean up empty workflows, so that users don't see confusing empty workflows in their workspace.

#### Acceptance Criteria

1. WHEN loading the workflow editor, THE System SHALL identify workflows with zero nodes
2. IF multiple workflows exist for a project and some are empty, THE System SHALL delete the empty workflows
3. THE System SHALL preserve workflows that have at least one node
4. WHEN deleting empty workflows, THE System SHALL update the workflows list in the store
5. THE System SHALL log cleanup actions for debugging purposes

### Requirement 5: Store-Level State Management

**User Story:** As a developer, I want workflow creation state to be managed at the store level instead of component level, so that state persists across component lifecycle events.

#### Acceptance Criteria

1. THE WorkflowStore SHALL maintain a mapping of projectId to workflowId
2. WHEN a workflow is created for a project, THE System SHALL store the mapping in the WorkflowStore
3. WHEN checking if a workflow exists for a project, THE System SHALL query the WorkflowStore mapping
4. THE WorkflowStore SHALL provide methods to get, set, and clear project-workflow mappings
5. THE System SHALL persist project-workflow mappings across application restarts using localStorage

### Requirement 6: Workflow Lookup by Project

**User Story:** As a developer, I want efficient methods to find workflows by projectId, so that the system can quickly determine if a workflow already exists for a project.

#### Acceptance Criteria

1. THE WorkflowStore SHALL provide a method `getWorkflowByProjectId(projectId: string)` that returns the workflow for a project
2. WHEN searching for workflows, THE System SHALL first check the project-workflow mapping
3. IF no mapping exists, THE System SHALL search through all workflows for matching projectId
4. THE System SHALL return null if no workflow is found for the project
5. THE System SHALL update the mapping cache when a workflow is found through search

### Requirement 7: Duplicate Prevention Logic

**User Story:** As a developer, I want robust duplicate prevention logic, so that workflows are never created twice for the same project under any circumstances.

#### Acceptance Criteria

1. WHEN `autoApplyTemplate` is called, THE System SHALL check if it's already in progress and return early if true
2. WHEN `useTemplate` is called, THE System SHALL check if `autoApplyTemplate` is in progress and wait or return early
3. THE System SHALL use a store-level flag `isCreatingWorkflowForProject` to prevent concurrent creation
4. WHEN a workflow creation starts, THE System SHALL set the flag to the projectId
5. WHEN a workflow creation completes or fails, THE System SHALL clear the flag

### Requirement 8: Workflow-Project Association

**User Story:** As a developer, I want workflows to be explicitly associated with projects, so that the system can track which workflows belong to which projects.

#### Acceptance Criteria

1. WHEN creating a workflow, THE System SHALL accept an optional `projectId` parameter
2. THE Workflow data model SHALL include a `projectId` field
3. WHEN saving a workflow, THE System SHALL persist the projectId to the backend
4. WHEN loading workflows, THE System SHALL include the projectId in the workflow data
5. THE System SHALL validate that projectId is a non-empty string when provided

## Special Requirements Guidance

### Parser and Serializer Requirements

This feature does not involve parsers or serializers, so no round-trip properties are needed.

### Performance Requirements

- Workflow lookup by projectId should complete in under 50ms
- Empty workflow cleanup should not block the UI
- Store state updates should be synchronous to prevent race conditions

### Error Handling Requirements

- If workflow creation fails, the system should clear the creation flag
- If workflow lookup fails, the system should fall back to creating a new workflow
- All errors should be logged with sufficient context for debugging
