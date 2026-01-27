# Requirements Document: 项目创建和列表同步修复

## Introduction

本需求文档定义了修复项目创建和列表同步问题的功能需求。当前系统存在多个项目创建入口，但创建后项目列表未能正确同步更新，导致用户在不同界面看到不一致的项目信息。

## Glossary

- **Project_Store**: Pinia store，管理项目状态和数据
- **Dashboard_Panel**: 控制面板组件，提供项目创建入口
- **Dashboard_View**: 概览页面组件，显示项目概览和创建入口
- **App_Component**: 应用根组件，提供菜单栏项目创建入口
- **Import_Dialog**: 导入小说对话框，在导入时创建项目
- **Project_List**: 项目列表组件，显示所有项目
- **Backend_API**: 后端 API 服务，提供项目 CRUD 操作
- **Frontend_Store**: 前端 Pinia store，缓存项目数据

## Requirements

### Requirement 1: 统一项目创建后的刷新机制

**User Story:** 作为开发者，我希望所有项目创建入口在创建项目后都能统一刷新项目列表，以确保数据一致性。

#### Acceptance Criteria

1. WHEN a project is created through any entry point, THE System SHALL call `projectStore.fetchProjects()` to refresh the project list from backend
2. WHEN `projectStore.createProject()` completes successfully, THE System SHALL automatically update the `projects` array in the store
3. WHEN a project is created, THE System SHALL ensure the new project appears in both the store's `projects` array and the backend database
4. WHEN `projectStore.fetchProjects()` is called, THE System SHALL fetch the latest project list from the backend API and update the store
5. WHEN the backend returns project data, THE System SHALL normalize the project data to ensure consistent field names (`id` vs `projectId`)

### Requirement 2: 修复控制面板项目创建

**User Story:** 作为用户，我希望在控制面板点击"+"按钮创建项目后，能立即在"全部项目"页面看到新创建的项目。

#### Acceptance Criteria

1. WHEN a user clicks the "+" button in Dashboard_Panel, THE System SHALL display a project creation dialog
2. WHEN a user confirms project creation in the dialog, THE System SHALL call `projectStore.createProject()` with the project data
3. WHEN `projectStore.createProject()` succeeds, THE System SHALL call `projectStore.fetchProjects()` to refresh the project list
4. WHEN the project list is refreshed, THE System SHALL update the project count badge in Dashboard_Panel
5. WHEN a user navigates to the "全部项目" view after creating a project, THE System SHALL display the newly created project in Project_List

### Requirement 3: 修复概览页面项目创建

**User Story:** 作为用户，我希望在概览页面的"新建项目"按钮创建项目后，能立即看到项目出现在项目列表中。

#### Acceptance Criteria

1. WHEN a user clicks the "新建项目" button in Dashboard_View, THE System SHALL trigger the project import workflow
2. WHEN a project is created during the import workflow, THE System SHALL call `projectStore.createProject()` with the project data
3. WHEN `projectStore.createProject()` succeeds, THE System SHALL call `projectStore.fetchProjects()` to refresh the project list
4. WHEN the project list is refreshed, THE System SHALL update the active project display in Dashboard_View
5. WHEN a user navigates to the "全部项目" view after creating a project, THE System SHALL display the newly created project

### Requirement 4: 修复菜单栏项目创建

**User Story:** 作为用户，我希望通过应用菜单栏的"新建项目"选项创建项目后，能立即在项目列表中看到新项目。

#### Acceptance Criteria

1. WHEN a user selects "new-project" from the application menu, THE System SHALL call the `createProject()` function in App_Component
2. WHEN `createProject()` is called, THE System SHALL prompt the user for a project name
3. WHEN the user provides a project name, THE System SHALL call `projectStore.createProject()` with the project data
4. WHEN `projectStore.createProject()` succeeds, THE System SHALL call `projectStore.fetchProjects()` to refresh the project list
5. WHEN the project list is refreshed, THE System SHALL navigate to the project detail page or dashboard

### Requirement 5: 修复导入小说时的项目创建

**User Story:** 作为用户，我希望在导入小说时创建的项目能立即出现在项目列表中，而不需要刷新页面。

#### Acceptance Criteria

1. WHEN a user imports a novel through Import_Dialog, THE System SHALL check if a project exists
2. WHEN no project exists, THE System SHALL call `apiService.createProject()` to create a new project on the backend
3. WHEN the backend returns a project with `projectId`, THE System SHALL normalize the project data to include both `id` and `projectId` fields
4. WHEN the project is created, THE System SHALL call `projectStore.setCurrentProject()` to set it as the current project
5. WHEN the project is set as current, THE System SHALL call `projectStore.fetchProjects()` to refresh the project list from backend

### Requirement 6: 修复 ProjectList 组件的响应式更新

**User Story:** 作为用户，我希望 ProjectList 组件能自动响应 store 中的项目列表变化，无需手动刷新。

#### Acceptance Criteria

1. WHEN Project_List component is mounted, THE System SHALL call `projectStore.fetchProjects()` to load the latest project list
2. WHEN `projectStore.projects` array changes, THE System SHALL automatically re-render the Project_List component
3. WHEN a project is added to `projectStore.projects`, THE System SHALL display the new project in the list immediately
4. WHEN a project is removed from `projectStore.projects`, THE System SHALL remove it from the list immediately
5. WHEN `projectStore.projects` is empty, THE System SHALL display an empty state message

### Requirement 7: 确保前端 Store 和后端 API 的数据同步

**User Story:** 作为开发者，我希望前端 store 和后端 API 的项目数据始终保持同步，避免数据不一致。

#### Acceptance Criteria

1. WHEN `projectStore.createProject()` is called, THE System SHALL first create the project on the backend via `apiService.createProject()`
2. WHEN the backend returns success, THE System SHALL add the project to the store's `projects` array with the backend-provided `projectId`
3. WHEN `projectStore.fetchProjects()` is called, THE System SHALL fetch the latest project list from the backend and replace the store's `projects` array
4. WHEN the backend returns project data, THE System SHALL normalize field names to ensure consistency (`projectId` → `id`)
5. WHEN a project creation fails on the backend, THE System SHALL not add the project to the store and SHALL display an error message

### Requirement 8: 项目数据规范化

**User Story:** 作为开发者，我希望项目数据在前端和后端之间传递时使用一致的字段名称，避免混淆。

#### Acceptance Criteria

1. WHEN the backend returns a project with `projectId`, THE System SHALL normalize it to include both `id` and `projectId` fields
2. WHEN the frontend sends project data to the backend, THE System SHALL use `projectId` as the primary identifier
3. WHEN displaying project data in components, THE System SHALL use `id` or `projectId` interchangeably with fallback logic
4. WHEN storing project data in the store, THE System SHALL ensure both `id` and `projectId` fields are present and equal
5. WHEN comparing projects, THE System SHALL use `projectId` or `id` with proper fallback handling

### Requirement 9: 项目创建成功通知

**User Story:** 作为用户，我希望在项目创建成功后看到明确的成功提示，并能快速访问新项目。

#### Acceptance Criteria

1. WHEN a project is created successfully, THE System SHALL display a success notification with the project name
2. WHEN the success notification is displayed, THE System SHALL include an option to view the project
3. WHEN a user clicks "view project" in the notification, THE System SHALL navigate to the project detail page
4. WHEN a project creation fails, THE System SHALL display an error notification with the failure reason
5. WHEN the error notification is displayed, THE System SHALL suggest possible solutions or retry options

### Requirement 10: 项目列表加载状态

**User Story:** 作为用户，我希望在项目列表加载时看到加载指示器，避免误以为没有项目。

#### Acceptance Criteria

1. WHEN `projectStore.fetchProjects()` is called, THE System SHALL set `projectStore.isLoading` to `true`
2. WHEN the project list is loading, THE System SHALL display a loading indicator in Project_List
3. WHEN `projectStore.fetchProjects()` completes, THE System SHALL set `projectStore.isLoading` to `false`
4. WHEN the project list load fails, THE System SHALL display an error message and set `isLoading` to `false`
5. WHEN the project list is empty after loading, THE System SHALL display an empty state message instead of a loading indicator

